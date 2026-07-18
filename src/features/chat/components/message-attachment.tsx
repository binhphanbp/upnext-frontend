"use client";

import { File, SpinnerGap } from "@phosphor-icons/react";
import { useState } from "react";

import { getAttachmentAccess } from "../api/conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import type { MessageAttachment } from "../types/contracts";

export function MessageAttachmentItem({
  attachment,
  conversationId,
}: {
  attachment: MessageAttachment;
  conversationId: string;
}) {
  const { token } = useChatSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    if (!token || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAttachmentAccess(token, conversationId, attachment.id);
      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Không thể mở tệp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={open}
        className="mt-2 flex max-w-full items-center gap-2 rounded-lg border border-current/20 bg-white/60 px-3 py-2 text-left text-xs hover:bg-white"
      >
        {loading ? <SpinnerGap className="animate-spin" /> : <File />}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{attachment.fileAsset.originalName}</span>
          <span className="opacity-70">{formatBytes(Number(attachment.fileAsset.sizeBytes))}</span>
        </span>
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
