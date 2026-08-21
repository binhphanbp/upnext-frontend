"use client";

import { useEffect } from "react";

import { useInterviewSession } from "../hooks/use-interview-session";
import { InterviewLivePage } from "./live/interview-live-page";
import { InterviewReportPage } from "./report/interview-report-page";
import { InterviewSetupPage } from "./setup/interview-setup-page";

/**
 * `/{locale}/candidate/ai-interview` — setup, session and report on one route.
 *
 * A live interview must not survive a navigation: changing routes would tear
 * down the `MediaStream` and the session state machine mid-answer. Keeping all
 * three views under one route makes that structurally impossible rather than a
 * rule someone has to remember. Historical reports get their own addressable
 * route once sessions are persisted server-side.
 */
export function AiInterviewPage() {
  const controller = useInterviewSession();
  const { phase, report, endSession } = controller;

  const isLive = phase !== "idle" && phase !== "completed" && phase !== "failed";

  // Closing the tab mid-interview loses the session. The browser only allows a
  // generic prompt, but a generic prompt beats silently discarding the work.
  useEffect(() => {
    if (!isLive) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isLive]);

  if (phase === "completed" && report) {
    return <InterviewReportPage report={report} onRestart={endSession} />;
  }

  if (isLive) {
    return <InterviewLivePage controller={controller} onExit={endSession} />;
  }

  return <InterviewSetupPage onStart={(setup) => void controller.start(setup)} />;
}
