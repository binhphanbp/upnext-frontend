"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { useAiConversation } from "../hooks/use-ai-conversation";
import { quickActionsForContext } from "../lib/quick-actions";
import { useAiCopilotUiStore } from "../stores/ai-copilot-ui.store";
import type { AiPageContext } from "../types";
import { AiComposer, type AiComposerHandle } from "./ai-composer";
import { AiEmptyState } from "./ai-empty-state";
import { AiMessageList } from "./ai-message-list";
import { AiQuickActions } from "./ai-quick-actions";

export type AiCopilotConversationController = ReturnType<typeof useAiConversation>;

/**
 * The conversation surface itself, with no chrome of its own, so the full page
 * and the drawer render the identical thread and differ only in framing.
 */
export function AiCopilotConversation({
  controller,
  context,
  variant,
}: {
  controller: AiCopilotConversationController;
  context: AiPageContext;
  variant: "page" | "drawer";
}) {
  const t = useTranslations("AiCopilot");
  const composerRef = useRef<AiComposerHandle>(null);
  const draftKey = controller.conversationId ?? "new";
  const draft = useAiCopilotUiStore((state) => state.drafts[draftKey] ?? "");
  const setDraft = useAiCopilotUiStore((state) => state.setDraft);

  const actions = quickActionsForContext(context.type);

  const send = (prompt: string) => {
    // Cleared here rather than in the hook: the draft is keyed on "new" until the
    // conversation exists, and only this component knows that key.
    setDraft(draftKey, "");
    void controller.send(prompt);
    composerRef.current?.focus();
  };

  return (
    <>
      <AiMessageList
        messages={controller.messages}
        isResolvingAction={controller.isResolvingAction}
        onFeedback={controller.setFeedback}
        onResolveAction={controller.resolveAction}
        onSuggestion={send}
        onRetry={controller.retry}
        emptyState={
          <AiEmptyState
            actions={actions}
            onSelect={send}
            isDisabled={controller.isBusy}
            compact={variant === "drawer"}
            {...(context.type === "GENERAL" ? {} : { contextLabel: t(context.labelKey) })}
          />
        }
      />

      {controller.messages.length > 0 ? (
        <div className="border-t border-slate-100 px-4 pt-2.5 pb-1 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <AiQuickActions actions={actions} onSelect={send} isDisabled={controller.isBusy} />
          </div>
        </div>
      ) : null}

      <AiComposer
        value={draft}
        onChange={(value) => setDraft(draftKey, value)}
        onSubmit={() => send(draft)}
        onStop={controller.stop}
        isBusy={controller.isBusy}
        handleRef={composerRef}
        className={controller.messages.length > 0 ? "pt-2" : "pt-3"}
      />
    </>
  );
}
