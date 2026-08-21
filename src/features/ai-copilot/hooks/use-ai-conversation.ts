"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  persistConversation,
  resolveActionRequest,
  submitMessageFeedback,
} from "../api/conversations-api";
import { copilotTransport } from "../api/copilot-transport";
import type { MockScenarioKey } from "../api/mock-scenarios";
import type {
  AiConversation,
  AiMessage,
  AiMessageFeedback,
  AiPageContext,
  AiRunStatus,
} from "../types";

export const AI_CONVERSATIONS_QUERY_KEY = ["ai-copilot", "conversations"] as const;

export function useAiConversationList() {
  return useQuery({
    queryKey: AI_CONVERSATIONS_QUERY_KEY,
    queryFn: listConversations,
    staleTime: 30_000,
  });
}

function emptyAssistantMessage(id: string): AiMessage {
  return {
    id,
    role: "assistant",
    content: "",
    createdAt: new Date().toISOString(),
    status: "loading",
    toolCalls: [],
    citations: [],
    cards: [],
    suggestions: [],
  };
}

type SendOptions = {
  /** State-preview override; never set in normal use. */
  forceScenario?: MockScenarioKey;
};

type UseAiConversationOptions = {
  /** Refreshes server-authoritative allowance after every completed attempt. */
  onRunSettled?: () => void | Promise<void>;
};

/**
 * Owns one live thread.
 *
 * The conversation *list* is server data and lives in TanStack Query (§15.2).
 * The in-flight thread is a streaming buffer — client state by nature — and is
 * written back through `persistConversation` once the run closes, which is the
 * same moment NestJS persists the final message in the real flow (§13.1 step 13).
 */
export function useAiConversation(context: AiPageContext, options: UseAiConversationOptions = {}) {
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [status, setStatus] = useState<AiRunStatus>("idle");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string>("");
  const conversationRef = useRef<AiConversation | null>(null);
  const onRunSettledRef = useRef(options.onRunSettled);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    onRunSettledRef.current = options.onRunSettled;
  }, [options.onRunSettled]);

  const patchMessage = useCallback((id: string, patch: (message: AiMessage) => AiMessage) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? patch(message) : message)),
    );
  }, []);

  const run = useCallback(
    async (prompt: string, options?: SendOptions) => {
      const trimmed = prompt.trim();
      if (!trimmed || status === "streaming" || status === "processing" || status === "queued")
        return;

      lastPromptRef.current = trimmed;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const now = Date.now();
      const userMessage: AiMessage = {
        id: `u-${now.toString(36)}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        status: "completed",
        toolCalls: [],
        citations: [],
        cards: [],
        suggestions: [],
      };
      const assistantId = `a-${now.toString(36)}`;
      setMessages((current) => [...current, userMessage, emptyAssistantMessage(assistantId)]);
      setStatus("loading");

      let finished = false;

      try {
        // Bên trong `try`: `createConversation` ném khi phiên đăng nhập không còn
        // hợp lệ, và trước đây lời ném đó thoát ra ngoài `run()` thành một promise
        // rejection không ai bắt — người dùng gõ câu hỏi, bấm Enter, và giao diện
        // không đổi gì cả. Một lỗi im lặng còn tệ hơn một lỗi hiện rõ.
        let conversation = conversationRef.current;
        if (!conversation) {
          conversation = await createConversation(context.type);
          conversationRef.current = conversation;
          setConversationId(conversation.id);
        }

        for await (const frame of copilotTransport({
          conversationId: conversation.id,
          prompt: trimmed,
          context,
          signal: controller.signal,
          ...(options?.forceScenario === undefined ? {} : { forceScenario: options.forceScenario }),
        })) {
          switch (frame.event) {
            case "status": {
              setStatus(frame.data.step);
              patchMessage(assistantId, (message) => ({ ...message, status: frame.data.step }));
              break;
            }
            case "intent": {
              patchMessage(assistantId, (message) => ({ ...message, intent: frame.data.intent }));
              break;
            }
            case "tool_start": {
              patchMessage(assistantId, (message) => ({
                ...message,
                toolCalls: [...message.toolCalls, frame.data.tool],
              }));
              break;
            }
            case "tool_result": {
              patchMessage(assistantId, (message) => ({
                ...message,
                toolCalls: message.toolCalls.map((tool) =>
                  tool.id === frame.data.id
                    ? {
                        ...tool,
                        status: frame.data.status,
                        durationMs: frame.data.durationMs,
                        ...(frame.data.detail === undefined ? {} : { detail: frame.data.detail }),
                      }
                    : tool,
                ),
              }));
              break;
            }
            case "content_delta": {
              patchMessage(assistantId, (message) => ({
                ...message,
                content: message.content + frame.data.text,
              }));
              break;
            }
            case "citation": {
              patchMessage(assistantId, (message) => ({
                ...message,
                citations: [...message.citations, frame.data.citation],
              }));
              break;
            }
            case "card": {
              patchMessage(assistantId, (message) => ({
                ...message,
                cards: [...message.cards, frame.data.card],
              }));
              break;
            }
            case "action_request": {
              patchMessage(assistantId, (message) => ({
                ...message,
                actionRequest: frame.data.actionRequest,
              }));
              break;
            }
            case "suggestions": {
              patchMessage(assistantId, (message) => ({
                ...message,
                suggestions: frame.data.suggestions,
              }));
              break;
            }
            case "error": {
              finished = true;
              setStatus(frame.data.status);
              patchMessage(assistantId, (message) => ({
                ...message,
                status: frame.data.status,
                errorCode: frame.data.code,
                errorDetail: frame.data.detail,
              }));
              break;
            }
            case "done": {
              finished = true;
              setStatus("completed");
              patchMessage(assistantId, (message) => ({
                ...message,
                status: "completed",
                meta: frame.data.meta,
              }));
              break;
            }
          }
        }
      } catch {
        finished = true;
        setStatus("failed");
        patchMessage(assistantId, (message) => ({
          ...message,
          status: "failed",
          errorCode: "AI_SERVICE_UNAVAILABLE",
        }));
      }

      // The loop ended without a terminal frame: the user pressed "Dừng".
      if (!finished) {
        setStatus("partial");
        patchMessage(assistantId, (message) => ({
          ...message,
          status: message.content ? "partial" : "idle",
        }));
      }

      abortRef.current = null;
      // The quota is reserved by the API before invoking the model and may be
      // reversed if the model fails. Refresh only after the terminal event so
      // the visible allowance always reflects the settled ledger.
      void onRunSettledRef.current?.();
    },
    [context, patchMessage, status],
  );

  // Persist once the run settles so the sidebar reflects the new thread.
  useEffect(() => {
    const conversation = conversationRef.current;
    const settled =
      status === "completed" ||
      status === "failed" ||
      status === "partial" ||
      status === "rate_limited" ||
      status === "permission_denied" ||
      status === "model_unavailable";
    if (!conversation || !settled || messages.length === 0) return;
    void persistConversation({ ...conversation, messages }).then(() => {
      void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
    });
  }, [messages, queryClient, status]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const retry = useCallback(async () => {
    setMessages((current) => {
      // Drop the failed exchange so the retry reads as one attempt, not two.
      const lastUserIndex = current.findLastIndex((message) => message.role === "user");
      return lastUserIndex === -1 ? current : current.slice(0, lastUserIndex);
    });
    setStatus("idle");
    await run(lastPromptRef.current);
  }, [run]);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setIsLoadingHistory(true);
    const conversation = await getConversation(id);
    conversationRef.current = conversation;
    setConversationId(conversation?.id ?? null);
    setMessages(conversation?.messages ?? []);
    setStatus("idle");
    setIsLoadingHistory(false);
  }, []);

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort();
    conversationRef.current = null;
    setConversationId(null);
    setMessages([]);
    setStatus("idle");
  }, []);

  const feedbackMutation = useMutation({
    mutationFn: ({ messageId, feedback }: { messageId: string; feedback: AiMessageFeedback }) =>
      submitMessageFeedback(messageId, feedback),
    // Optimistic: a thumb should light up instantly. Pressing the same thumb
    // again clears the rating, which under `exactOptionalPropertyTypes` means
    // dropping the key rather than setting it to `undefined`.
    onMutate: ({ messageId, feedback }) => {
      patchMessage(messageId, (message) => {
        if (message.feedback !== feedback) return { ...message, feedback };
        const { feedback: _cleared, ...withoutFeedback } = message;
        return withoutFeedback;
      });
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({
      actionId,
      decision,
    }: {
      actionId: string;
      decision: "CONFIRMED" | "REJECTED";
    }) => resolveActionRequest(actionId, decision),
    onSuccess: (result) => {
      setMessages((current) =>
        current.map((message) =>
          message.actionRequest?.id === result.id
            ? { ...message, actionRequest: { ...message.actionRequest, status: result.status } }
            : message,
        ),
      );
    },
  });

  const removeConversation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_result, id) => {
      if (conversationRef.current?.id === id) startNewConversation();
      void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
    },
  });

  const isBusy =
    status === "loading" ||
    status === "queued" ||
    status === "processing" ||
    status === "streaming";

  return {
    conversationId,
    messages,
    status,
    isBusy,
    isLoadingHistory,
    send: run,
    stop,
    retry,
    openConversation,
    startNewConversation,
    deleteConversation: removeConversation.mutate,
    setFeedback: (messageId: string, feedback: AiMessageFeedback) =>
      feedbackMutation.mutate({ messageId, feedback }),
    resolveAction: (actionId: string, decision: "CONFIRMED" | "REJECTED") =>
      actionMutation.mutate({ actionId, decision }),
    isResolvingAction: actionMutation.isPending,
  };
}
