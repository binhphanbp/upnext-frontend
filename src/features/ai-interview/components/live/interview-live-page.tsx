"use client";

import { ChatText, Gauge, Microphone, MonitorPlay } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { InterviewSessionController } from "../../hooks/use-interview-session";
import { formatDuration } from "../../lib/delivery-metrics";
import { CandidateVideo } from "./candidate-video";
import { CoachingRail } from "./coaching-rail";
import { InlineFeedback } from "./inline-feedback";
import { InterviewerStage } from "./interviewer-stage";
import { LiveTranscript } from "./live-transcript";
import { QuestionCard } from "./question-card";
import { SessionControls } from "./session-controls";

/**
 * The live session.
 *
 * Dark surface on purpose. This is the one screen in UpNext where the user is
 * performing rather than browsing: the dark stage removes competing brightness,
 * makes the speaking/listening states read from a distance, and matches the
 * mental model people already carry from video-call software. Every other AI
 * screen stays light.
 *
 * Layout logic: the right rail (transcript + coaching) is reference material and
 * never moves. The left column is the *current task* — it swaps between "the
 * interviewer is asking / you are answering" and "here is how that went". Since
 * the transcript stays put, the answer being discussed is still on screen while
 * the feedback is read.
 */
export function InterviewLivePage({
  controller,
  onExit,
}: {
  controller: InterviewSessionController;
  onExit: () => void;
}) {
  const t = useTranslations("AiInterview");
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"transcript" | "coaching">("transcript");

  const { phase, question, setup, latestScore } = controller;
  const isFeedback = phase === "feedback" && latestScore !== null;
  const isLastQuestion = question !== null && question.index === question.total;

  const rail = (
    <>
      <div className="min-h-0 flex-1 overflow-hidden">
        <LiveTranscript
          segments={controller.segments}
          interimSegment={controller.interimSegment}
          className="h-full"
        />
      </div>
      <div className="shrink-0 border-t border-slate-800 p-4">
        <CoachingRail
          delivery={controller.liveDelivery}
          samples={controller.samples}
          isActive={phase === "listening"}
        />
      </div>
    </>
  );

  return (
    <section
      aria-label={t("live.title")}
      className="flex h-[calc(100dvh-9rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.8)] md:h-[calc(100dvh-10.5rem)]"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
        >
          <MonitorPlay weight="fill" className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-slate-50">
            {setup?.jobTitle ?? t("live.title")}
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Microphone weight="fill" aria-hidden className="size-3" />
            {t(setup?.useLiveCapture ? "live.modeLive" : "live.modeSimulated")}
          </p>
        </div>

        {question ? (
          <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
            {Array.from({ length: question.total }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index + 1 < question.index && "w-4 bg-emerald-500",
                  index + 1 === question.index && "w-6 bg-emerald-400",
                  index + 1 > question.index && "w-4 bg-slate-700",
                )}
              />
            ))}
          </div>
        ) : null}

        <span className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 tabular-nums">
          {formatDuration(controller.elapsedMs)}
        </span>
      </header>

      {controller.error ? (
        <p className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs leading-relaxed text-amber-200">
          {controller.error.detail}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          {isFeedback ? (
            <InlineFeedback
              score={latestScore}
              onContinue={controller.continueToNext}
              isLastQuestion={isLastQuestion}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <InterviewerStage phase={phase} amplitude={controller.interviewerAmplitude} />
              {question ? (
                <QuestionCard
                  question={question}
                  isAnswering={phase === "listening"}
                  onRepeat={controller.repeatQuestion}
                  onSkip={controller.skipQuestion}
                  className="w-full max-w-xl"
                />
              ) : (
                <p className="max-w-sm text-center text-sm leading-relaxed text-slate-400">
                  {t("live.connecting")}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 w-full max-w-[220px] self-center lg:self-start">
            <CandidateVideo
              stream={controller.stream}
              micLevel={controller.micLevel}
              isMuted={controller.isMuted}
              isCameraEnabled={setup?.cameraEnabled ?? false}
            />
          </div>
        </div>

        {/* Desktop rail */}
        <aside className="hidden w-[340px] shrink-0 flex-col border-l border-slate-800 lg:flex">
          {rail}
        </aside>

        {/* Mobile: the same two panels behind a toggle rather than stacked, so
            the stage keeps its vertical space on a phone. */}
        <div className="flex max-h-[42dvh] min-h-0 shrink-0 flex-col border-t border-slate-800 lg:hidden">
          <div
            role="tablist"
            aria-label={t("live.paneSwitcher")}
            className="flex shrink-0 gap-1 px-3 pt-2"
          >
            {(
              [
                { id: "transcript", label: t("transcript.title"), icon: ChatText },
                { id: "coaching", label: t("coaching.title"), icon: Gauge },
              ] as const
            ).map((pane) => (
              <button
                key={pane.id}
                type="button"
                role="tab"
                aria-selected={mobilePane === pane.id}
                onClick={() => setMobilePane(pane.id)}
                className={cn(
                  "upnext-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  mobilePane === pane.id
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                <pane.icon aria-hidden className="size-3.5" />
                {pane.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {mobilePane === "transcript" ? (
              <LiveTranscript
                segments={controller.segments}
                interimSegment={controller.interimSegment}
                className="h-full"
              />
            ) : (
              <div className="p-4">
                <CoachingRail
                  delivery={controller.liveDelivery}
                  samples={controller.samples}
                  isActive={phase === "listening"}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SessionControls
        phase={phase}
        isMuted={controller.isMuted}
        canMute={Boolean(controller.stream)}
        onFinishAnswer={controller.finishAnswer}
        onToggleMute={controller.toggleMute}
        onEnd={() => setIsEndDialogOpen(true)}
        className="shrink-0"
      />

      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("endDialog.title")}</DialogTitle>
            <DialogDescription>{t("endDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsEndDialogOpen(false)}>
              {t("endDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsEndDialogOpen(false);
                controller.endSession();
                onExit();
              }}
            >
              {t("endDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
