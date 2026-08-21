"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createScriptedDriver,
  delay,
  InterviewAbortError,
  type InterviewDriver,
} from "../api/interview-driver";
import { createLiveDriver } from "../api/live-driver";
import { CLOSING, GREETING, SCRIPTED_TURNS, type ScriptedTurn } from "../api/mock-session";
import { buildReport } from "../lib/build-report";
import { computeDelivery, emptyDelivery } from "../lib/delivery-metrics";
import type {
  DeliverySample,
  DeliverySignals,
  InterviewErrorCode,
  InterviewPhase,
  InterviewQuestion,
  InterviewReport,
  InterviewSetup,
  QuestionScore,
  TranscriptSegment,
} from "../types";

/**
 * The session state machine.
 *
 * One async loop owns the whole interview — greet, then per turn: ask, listen,
 * evaluate, deliver feedback, wait for the candidate to continue — and every
 * await point is cancellable through a single `AbortController`. Modelling it as
 * a loop rather than a reducer over events keeps the *order* of an interview in
 * one readable place; the UI only reads the state it produces.
 *
 * Deliberately absent: pause during an answer. Freezing a live microphone
 * mid-sentence would leave the delivery metrics measuring a gap that never
 * happened, so the checkpoints are between questions — which is also where a
 * real interview can pause.
 */
export function useInterviewSession() {
  const [setup, setSetup] = useState<InterviewSetup | null>(null);
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimSegment, setInterimSegment] = useState<TranscriptSegment | null>(null);
  const [samples, setSamples] = useState<DeliverySample[]>([]);
  const [liveDelivery, setLiveDelivery] = useState<DeliverySignals>(emptyDelivery());
  const [scores, setScores] = useState<QuestionScore[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interviewerAmplitude, setInterviewerAmplitude] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<{ code: InterviewErrorCode; detail: string } | null>(null);
  /** Held in state, not just a ref, because the self-view has to re-render on it. */
  const [stream, setStream] = useState<MediaStream | null>(null);

  const driverRef = useRef<InterviewDriver | null>(null);
  const sessionAbortRef = useRef<AbortController | null>(null);
  const finishAbortRef = useRef<AbortController | null>(null);
  const continueRef = useRef<(() => void) | null>(null);
  const skipRef = useRef(false);
  const startedAtRef = useRef<number>(0);
  const startedAtIsoRef = useRef<string>("");
  const streamRef = useRef<MediaStream | null>(null);
  const answerTranscriptRef = useRef<string>("");
  const answerSamplesRef = useRef<DeliverySample[]>([]);

  useEffect(
    () => () => {
      sessionAbortRef.current?.abort();
      driverRef.current?.dispose();
    },
    [],
  );

  // Session clock. Runs whenever the interview is live, stops the moment it is not.
  useEffect(() => {
    const running =
      phase !== "idle" && phase !== "completed" && phase !== "failed" && phase !== "connecting";
    if (!running) return undefined;
    const timer = setInterval(() => setElapsedMs(performance.now() - startedAtRef.current), 250);
    return () => clearInterval(timer);
  }, [phase]);

  const pushSegment = useCallback((segment: TranscriptSegment) => {
    if (segment.isFinal) {
      setInterimSegment(null);
      setSegments((current) => [...current, segment]);
    } else {
      setInterimSegment(segment);
    }
  }, []);

  const speakLine = useCallback(
    async (driver: InterviewDriver, text: string, signal: AbortSignal) => {
      pushSegment({
        id: `int-${Math.random().toString(36).slice(2, 9)}`,
        speaker: "interviewer",
        text,
        isFinal: true,
        startedAtMs: performance.now() - startedAtRef.current,
        questionId: null,
      });
      await driver.speak(text, { signal, onAmplitude: setInterviewerAmplitude });
    },
    [pushSegment],
  );

  const waitForContinue = useCallback(
    (signal: AbortSignal) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
          reject(new InterviewAbortError());
          return;
        }
        const onAbort = () => {
          continueRef.current = null;
          reject(new InterviewAbortError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
        continueRef.current = () => {
          signal.removeEventListener("abort", onAbort);
          continueRef.current = null;
          resolve();
        };
      }),
    [],
  );

  const runSession = useCallback(
    async (driver: InterviewDriver, activeSetup: InterviewSetup, signal: AbortSignal) => {
      const turns: ScriptedTurn[] = SCRIPTED_TURNS.slice(
        0,
        Math.min(activeSetup.questionCount, SCRIPTED_TURNS.length),
      );
      const collected: QuestionScore[] = [];

      setPhase("connecting");
      await delay(900, signal);

      setPhase("interviewer_speaking");
      await speakLine(driver, GREETING, signal);

      for (const turn of turns) {
        setQuestion(turn.question);
        setPhase("interviewer_speaking");
        await speakLine(driver, turn.interviewerLine, signal);

        setPhase("listening");
        setSamples([]);
        setLiveDelivery(emptyDelivery());
        answerSamplesRef.current = [];
        answerTranscriptRef.current = "";
        skipRef.current = false;

        const finish = new AbortController();
        finishAbortRef.current = finish;

        const result = await driver.listen(turn, {
          signal,
          finishSignal: finish.signal,
          onSegment: (segment) => {
            pushSegment(segment);
            if (segment.isFinal) answerTranscriptRef.current += `${segment.text} `;
            const running = `${answerTranscriptRef.current} ${segment.isFinal ? "" : segment.text}`;
            setLiveDelivery(
              computeDelivery(
                running,
                answerSamplesRef.current,
                performance.now() - startedAtRef.current - 0,
              ),
            );
          },
          onSample: (sample) => {
            answerSamplesRef.current.push(sample);
            setMicLevel(sample.level);
            // Keep the sparkline bounded — 240 samples is 12 seconds at 20 Hz.
            setSamples((current) =>
              current.length > 240 ? [...current.slice(-239), sample] : [...current, sample],
            );
          },
        });
        finishAbortRef.current = null;
        setMicLevel(0);

        if (skipRef.current) {
          // A skipped question is recorded as unanswered rather than scored 0 —
          // the report must not imply the candidate got it wrong.
          continue;
        }

        setPhase("evaluating");
        void driver
          .speak(turn.acknowledgement, { signal, onAmplitude: setInterviewerAmplitude })
          .catch(() => {
            /* acknowledgement is cosmetic; evaluation continues */
          });

        const score = await driver.evaluate(turn, result);
        collected.push(score);
        setScores([...collected]);
        setPhase("feedback");
        await waitForContinue(signal);
      }

      setPhase("interviewer_speaking");
      await speakLine(driver, CLOSING, signal);

      setReport(
        buildReport(
          `sess-${Date.now().toString(36)}`,
          activeSetup,
          collected,
          Math.round((performance.now() - startedAtRef.current) / 1000),
          startedAtIsoRef.current,
        ),
      );
      setPhase("completed");
    },
    [pushSegment, speakLine, waitForContinue],
  );

  const start = useCallback(
    async (activeSetup: InterviewSetup) => {
      sessionAbortRef.current?.abort();
      driverRef.current?.dispose();

      const controller = new AbortController();
      sessionAbortRef.current = controller;
      startedAtRef.current = performance.now();
      startedAtIsoRef.current = new Date().toISOString();

      setSetup(activeSetup);
      setSegments([]);
      setInterimSegment(null);
      setScores([]);
      setReport(null);
      setError(null);
      setElapsedMs(0);
      setIsMuted(false);

      let driver: InterviewDriver;
      if (activeSetup.useLiveCapture) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
            video: activeSetup.cameraEnabled,
          });
          streamRef.current = stream;
          setStream(stream);
          driver = createLiveDriver(stream);
        } catch {
          setError({
            code: "MIC_PERMISSION_DENIED",
            detail:
              "Không truy cập được micro. Phiên sẽ chạy ở chế độ mô phỏng — bạn vẫn xem được toàn bộ luồng phỏng vấn.",
          });
          driver = createScriptedDriver();
        }
      } else {
        driver = createScriptedDriver();
      }
      driverRef.current = driver;

      try {
        await runSession(driver, activeSetup, controller.signal);
      } catch (caught) {
        if (caught instanceof InterviewAbortError) return;
        setError({
          code: "AI_SERVICE_UNAVAILABLE",
          detail: "Phiên phỏng vấn bị gián đoạn. Bạn có thể bắt đầu lại từ đầu.",
        });
        setPhase("failed");
      }
    },
    [runSession],
  );

  /** Ends the current answer — the candidate saying "I'm done". */
  const finishAnswer = useCallback(() => finishAbortRef.current?.abort(), []);

  const skipQuestion = useCallback(() => {
    skipRef.current = true;
    finishAbortRef.current?.abort();
  }, []);

  const continueToNext = useCallback(() => continueRef.current?.(), []);

  const repeatQuestion = useCallback(() => {
    const driver = driverRef.current;
    const signal = sessionAbortRef.current?.signal;
    if (!driver || !question || !signal) return;
    void driver.speak(question.text, { signal, onAmplitude: setInterviewerAmplitude }).catch(() => {
      /* interrupted */
    });
  }, [question]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    setIsMuted((current) => {
      const next = !current;
      for (const track of stream?.getAudioTracks() ?? []) track.enabled = !next;
      return next;
    });
  }, []);

  const endSession = useCallback(() => {
    sessionAbortRef.current?.abort();
    driverRef.current?.dispose();
    driverRef.current = null;
    streamRef.current = null;
    setStream(null);
    setPhase((current) => (current === "completed" ? current : "idle"));
    setInterviewerAmplitude(0);
    setMicLevel(0);
  }, []);

  return {
    setup,
    phase,
    question,
    segments,
    interimSegment,
    samples,
    liveDelivery,
    scores,
    report,
    interviewerAmplitude,
    micLevel,
    elapsedMs,
    isMuted,
    error,
    stream,
    /** The score for the question currently being reviewed in `feedback`. */
    latestScore: scores.at(-1) ?? null,
    start,
    finishAnswer,
    skipQuestion,
    continueToNext,
    repeatQuestion,
    toggleMute,
    endSession,
  };
}

export type InterviewSessionController = ReturnType<typeof useInterviewSession>;
