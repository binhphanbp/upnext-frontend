/**
 * The seam between the interview UI and whatever is actually producing speech,
 * transcript and scores.
 *
 * Three implementations are foreseen and all satisfy the same interface, so the
 * session state machine in `use-interview-session.ts` never branches on them:
 *
 *   scriptedDriver  — this file. Deterministic, offline, demo-safe.
 *   liveDriver      — `live-driver.ts`. Real microphone, browser STT and TTS.
 *   realtimeDriver  — future. A WebSocket to `upnext-ai` doing streaming STT →
 *                     LLM → TTS with barge-in.
 */

import { computeDelivery } from "../lib/delivery-metrics";
import type { DeliverySample, DeliverySignals, QuestionScore, TranscriptSegment } from "../types";
import { initialQuestionScore, type ScriptedTurn } from "./mock-session";

export class InterviewAbortError extends Error {
  constructor() {
    super("interview-aborted");
    this.name = "InterviewAbortError";
  }
}

export type SpeakContext = {
  signal: AbortSignal;
  /** 0–1 envelope driving the interviewer's waveform. */
  onAmplitude: (level: number) => void;
};

export type ListenContext = {
  signal: AbortSignal;
  /** Fires for interim and final results alike; `isFinal` distinguishes them. */
  onSegment: (segment: TranscriptSegment) => void;
  onSample: (sample: DeliverySample) => void;
  /** Aborts when the candidate presses "Trả lời xong" — ends the turn early. */
  finishSignal: AbortSignal;
};

export type ListenResult = {
  transcript: string;
  samples: DeliverySample[];
  elapsedMs: number;
};

export type InterviewDriver = {
  readonly kind: "scripted" | "live";
  /** Rejects with `InterviewAbortError` when interrupted. */
  speak: (text: string, context: SpeakContext) => Promise<void>;
  listen: (turn: ScriptedTurn, context: ListenContext) => Promise<ListenResult>;
  evaluate: (turn: ScriptedTurn, result: ListenResult) => Promise<QuestionScore>;
  dispose: () => void;
};

export function delay(ms: number, ...signals: AbortSignal[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signals.some((signal) => signal.aborted)) {
      reject(new InterviewAbortError());
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      for (const signal of signals) signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new InterviewAbortError());
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    for (const signal of signals) signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Vietnamese speech runs roughly 13–15 characters per second at an interview
 * pace. Used to size the caption timing when no real audio duration exists.
 */
export function estimateSpeechMs(text: string): number {
  return Math.max(1_200, Math.round((text.length / 14) * 1_000));
}

/**
 * Drives the waveform while a line is spoken. The envelope is synthesised
 * rather than measured: `speechSynthesis` exposes no output stream to analyse,
 * and the bars are an affordance ("it is talking"), not a measurement.
 */
export function animateSpeech(durationMs: number, context: SpeakContext): () => void {
  const startedAt = performance.now();
  let frame = 0;

  const tick = () => {
    if (context.signal.aborted) return;
    const elapsed = performance.now() - startedAt;
    if (elapsed >= durationMs) {
      context.onAmplitude(0);
      return;
    }
    // Two detuned sines plus jitter reads as speech rather than a metronome.
    const base = 0.45 + 0.32 * Math.sin(elapsed / 90) + 0.18 * Math.sin(elapsed / 37);
    const jitter = (Math.random() - 0.5) * 0.18;
    // Fade in and out so lines start and end softly.
    const envelope = Math.min(1, elapsed / 220, (durationMs - elapsed) / 260);
    context.onAmplitude(Math.max(0, Math.min(1, (base + jitter) * envelope)));
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    context.onAmplitude(0);
  };
}

function scriptedSampler(context: ListenContext, startedAt: number, samples: DeliverySample[]) {
  // 20 Hz matches what the live analyser produces, so both drivers feed the
  // delivery metrics identically shaped data.
  const interval = setInterval(() => {
    const atMs = performance.now() - startedAt;
    // Silence between chunks is what makes `longestPauseMs` meaningful.
    const level = Math.max(0, 0.55 + 0.3 * Math.sin(atMs / 140) + (Math.random() - 0.5) * 0.25);
    const sample: DeliverySample = { atMs, wpm: 0, level: Math.min(1, level) };
    samples.push(sample);
    context.onSample(sample);
  }, 50);
  return () => clearInterval(interval);
}

export function createScriptedDriver(): InterviewDriver {
  return {
    kind: "scripted",

    async speak(text, context) {
      const durationMs = estimateSpeechMs(text);
      const stopAnimation = animateSpeech(durationMs, context);
      try {
        await delay(durationMs, context.signal);
      } finally {
        stopAnimation();
      }
    },

    async listen(turn, context) {
      const startedAt = performance.now();
      const samples: DeliverySample[] = [];
      const stopSampling = scriptedSampler(context, startedAt, samples);
      const segmentId = `seg-${turn.question.id}`;
      let committed = "";
      let pending = "";

      try {
        for (const chunk of turn.candidateChunks) {
          await delay(chunk.delayMs, context.signal, context.finishSignal);
          pending += chunk.text;
          context.onSegment({
            id: `${segmentId}-${committed.length}`,
            speaker: "candidate",
            text: pending.trim(),
            isFinal: false,
            startedAtMs: performance.now() - startedAt,
            questionId: turn.question.id,
          });
          if (chunk.commits) {
            committed += pending;
            context.onSegment({
              id: `${segmentId}-${committed.length}`,
              speaker: "candidate",
              text: pending.trim(),
              isFinal: true,
              startedAtMs: performance.now() - startedAt,
              questionId: turn.question.id,
            });
            pending = "";
          }
        }
        // A beat of silence is how a person signals they are done.
        await delay(900, context.signal, context.finishSignal);
      } catch (error) {
        // `finishSignal` firing is the candidate ending their turn, not a fault.
        if (!(error instanceof InterviewAbortError) || context.signal.aborted) {
          stopSampling();
          throw error;
        }
      } finally {
        stopSampling();
      }

      const transcript = (committed + pending).trim() || turn.score.fallbackTranscript;
      return { transcript, samples, elapsedMs: performance.now() - startedAt };
    },

    async evaluate(turn, result) {
      // Scores are fixtures; delivery is measured from whatever actually happened.
      await delay(1_400, new AbortController().signal);
      const delivery: DeliverySignals = computeDelivery(
        result.transcript,
        result.samples,
        result.elapsedMs,
      );
      return { ...initialQuestionScore(turn), transcript: result.transcript, delivery };
    },

    dispose() {},
  };
}
