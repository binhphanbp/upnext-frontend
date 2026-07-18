"use client";

import { ShieldSlash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

import { respondToTalentRequest } from "../api/talent-outreach";
import { chatQueryKeys } from "../hooks/use-conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import type { ConversationDetail } from "../types/contracts";

export function TalentRequestActions({ conversation }: { conversation: ConversationDetail }) {
  const request = conversation.talentContactRequest;
  const { actor, token } = useChatSocket();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (action: "accept" | "decline" | "block-company") => {
      if (!token || !request) throw new Error("Phiên đăng nhập đã hết hạn");
      return respondToTalentRequest(token, request.id, action, {
        ...(request.version === undefined ? {} : { expectedVersion: request.version }),
      });
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversation(conversation.id) }),
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(conversation.id) }),
        queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
      ]);
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Thao tác thất bại"),
  });

  if (actor !== "CANDIDATE" || request?.status !== "PENDING") return null;
  return (
    <div className="border-t border-blue-100 bg-blue-50 p-3">
      <p className="mb-3 text-sm text-blue-900">
        Bạn có muốn trao đổi với nhà tuyển dụng về vị trí này không?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("accept")}
        >
          Chấp nhận trao đổi
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("decline")}
        >
          Từ chối
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("block-company")}
          className="text-red-700"
        >
          <ShieldSlash /> Chặn công ty
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
