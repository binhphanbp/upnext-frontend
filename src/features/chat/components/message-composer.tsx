"use client";

import { Paperclip, PaperPlaneRight, SpinnerGap, X } from "@phosphor-icons/react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

import { uploadMessageAttachment } from "../api/conversations";
import { useSendMessage } from "../hooks/use-send-message";
import { useChatSocket } from "../socket/chat-socket-provider";
import { useChatUiStore } from "../store/chat-ui.store";
import { CHAT_SCHEMA_VERSION } from "../types/contracts";

export function MessageComposer({
  conversationId,
  senderParticipantId,
  disabledReason,
  allowAttachments,
}: {
  conversationId: string;
  senderParticipantId: string | null;
  disabledReason?: string;
  allowAttachments: boolean;
}) {
  const { socket, token } = useChatSocket();
  const draft = useChatUiStore((state) => state.drafts[conversationId] ?? "");
  const setDraft = useChatUiStore((state) => state.setDraft);
  const sendMutation = useSendMessage(conversationId, senderParticipantId);
  const [attachments, setAttachments] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmit = useRef(0);

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socket?.emit("typing:stop", { schemaVersion: CHAT_SCHEMA_VERSION, conversationId });
    },
    [socket, conversationId],
  );

  const updateDraft = (value: string) => {
    setDraft(conversationId, value.slice(0, 4_000));
    if (!socket || disabledReason) return;
    const now = Date.now();
    if (now - lastTypingEmit.current > 2_000) {
      socket.emit("typing:start", { schemaVersion: CHAT_SCHEMA_VERSION, conversationId });
      lastTypingEmit.current = now;
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { schemaVersion: CHAT_SCHEMA_VERSION, conversationId });
    }, 2_500);
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, 5 - attachments.length);
    event.target.value = "";
    if (!token || !files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const response = await uploadMessageAttachment(token, conversationId, file);
        setAttachments((current) => [...current, { id: response.data.id, name: file.name }]);
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const content = draft.trim();
    if ((!content && !attachments.length) || disabledReason) return;
    const currentAttachments = attachments;
    setDraft(conversationId, "");
    setAttachments([]);
    socket?.emit("typing:stop", { schemaVersion: CHAT_SCHEMA_VERSION, conversationId });
    try {
      await sendMutation.send(
        content,
        crypto.randomUUID(),
        currentAttachments.map((item) => item.id),
      );
    } catch {
      setDraft(conversationId, content);
      setAttachments(currentAttachments);
    }
  };

  if (disabledReason) {
    return (
      <div className="border-t border-slate-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
        {disabledReason}
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {attachments.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((item) => (
            <span
              key={item.id}
              className="flex max-w-48 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs"
            >
              <span className="truncate">{item.name}</span>
              <button
                type="button"
                aria-label={`Bỏ ${item.name}`}
                onClick={() =>
                  setAttachments((current) => current.filter((entry) => entry.id !== item.id))
                }
              >
                <X />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        {allowAttachments ? (
          <label
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Đính kèm tệp"
          >
            {uploading ? <SpinnerGap className="animate-spin" /> : <Paperclip />}
            <input
              aria-label="Chọn tệp đính kèm"
              className="sr-only"
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={upload}
              disabled={uploading || attachments.length >= 5}
            />
          </label>
        ) : null}
        <Textarea
          value={draft}
          maxLength={4_000}
          rows={1}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Nhập tin nhắn…"
          className="focus-visible:ring-primary focus-visible:border-primary max-h-32 min-h-10 resize-none rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-1"
        />
        <Button
          type="button"
          aria-label="Gửi tin nhắn"
          disabled={sendMutation.isPending || uploading || (!draft.trim() && !attachments.length)}
          onClick={() => void submit()}
          className="h-10 w-10 shrink-0 p-0"
        >
          {sendMutation.isPending ? (
            <SpinnerGap className="animate-spin" />
          ) : (
            <PaperPlaneRight weight="fill" />
          )}
        </Button>
      </div>
      <div className="mt-1 text-right text-[10px] text-slate-400">{draft.length}/4000</div>
    </div>
  );
}
