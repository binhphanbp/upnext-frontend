"use client";

import { useEffect, useState } from "react";

import { CheckCircle, X } from "./marketing-icons";

export type HomeActionFeedback = {
  actionLabel?: string;
  id: string;
  message: string;
  onAction?: () => void;
  tone: "error" | "success";
};

type HomeActionToastProps = {
  feedback: HomeActionFeedback | null;
  onDismiss: () => void;
};

export function HomeActionToast({ feedback, onDismiss }: HomeActionToastProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!feedback || isInteracting) return undefined;

    const timeout = window.setTimeout(onDismiss, 6500);
    return () => window.clearTimeout(timeout);
  }, [feedback, isInteracting, onDismiss]);

  useEffect(() => {
    setIsInteracting(false);
  }, [feedback?.id]);

  if (!feedback) return null;

  const isError = feedback.tone === "error";

  return (
    <div
      className={`marketing-home-action-toast${isError ? " is-error" : ""}`}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsInteracting(false);
        }
      }}
      onFocusCapture={() => setIsInteracting(true)}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      <span className="marketing-home-action-toast-icon" aria-hidden="true">
        {isError ? <X size={20} weight="bold" /> : <CheckCircle size={20} weight="fill" />}
      </span>
      <output
        className="marketing-home-action-toast-message"
        aria-live={isError ? "assertive" : "polite"}
      >
        {feedback.message}
      </output>
      {feedback.actionLabel && feedback.onAction ? (
        <button
          type="button"
          className="marketing-home-action-toast-action"
          onClick={() => {
            feedback.onAction?.();
            onDismiss();
          }}
        >
          {feedback.actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="marketing-home-action-toast-dismiss"
        aria-label="Đóng thông báo"
        onClick={onDismiss}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
