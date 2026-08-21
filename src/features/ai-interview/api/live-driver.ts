"use client";

/**
 * Live driver — real microphone, real browser speech APIs.
 *
 * This exists so the interview is not a mime show: the level meter reads the
 * actual input, the transcript is the candidate's actual words, and the
 * interviewer actually speaks. Scoring is still fixture-backed (there is no LLM
 * behind this yet) but it scores the *real* transcript, and every delivery
 * metric is measured, not scripted.
 *
 * Capability notes:
 *   - `SpeechRecognition` is Chromium/Safari only and routes audio through a
 *     vendor service. The consent panel states this before it is ever started.
 *   - `speechSynthesis` is universal but voice availability varies; a missing
 *     vi-VN voice degrades to the default voice rather than failing.
 *   - Anything unsupported falls back to the scripted driver at selection time,
 *     so the session always runs.
 */

import { computeDelivery } from "../lib/delivery-metrics";
import type { DeliverySample, QuestionScore, TranscriptSegment } from "../types";
import {
  animateSpeech,
  delay,
  InterviewAbortError,
  type InterviewDriver,
} from "./interview-driver";
import { initialQuestionScore } from "./mock-session";

type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternative;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number } & Record<number, SpeechRecognitionResult>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export type LiveCapabilities = {
  microphone: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
};

export function detectCapabilities(): LiveCapabilities {
  if (typeof window === "undefined") {
    return { microphone: false, speechRecognition: false, speechSynthesis: false };
  }
  return {
    microphone: Boolean(navigator.mediaDevices?.getUserMedia),
    speechRecognition: getSpeechRecognition() !== null,
    speechSynthesis: "speechSynthesis" in window,
  };
}

function pickVietnameseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("vi")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    null
  );
}

export function createLiveDriver(stream: MediaStream): InterviewDriver {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  const audioContext = AudioContextCtor ? new AudioContextCtor() : null;
  const analyser = audioContext?.createAnalyser() ?? null;
  if (audioContext && analyser) {
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.65;
    audioContext.createMediaStreamSource(stream).connect(analyser);
  }
  const buffer = analyser ? new Uint8Array(analyser.fftSize) : null;

  /** Root-mean-square of the current frame, normalised to roughly 0–1. */
  const readLevel = (): number => {
    if (!analyser || !buffer) return 0;
    analyser.getByteTimeDomainData(buffer);
    let sumSquares = 0;
    for (const value of buffer) {
      const centred = (value - 128) / 128;
      sumSquares += centred * centred;
    }
    // ×3.2 lifts conversational speech into the upper half of the meter without
    // clipping; shouting still saturates, which is the correct feedback.
    return Math.min(1, Math.sqrt(sumSquares / buffer.length) * 3.2);
  };

  return {
    kind: "live",

    async speak(text, context) {
      if (!("speechSynthesis" in window)) {
        const fallbackMs = Math.max(1_200, (text.length / 14) * 1_000);
        const stop = animateSpeech(fallbackMs, context);
        try {
          await delay(fallbackMs, context.signal);
        } finally {
          stop();
        }
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVietnameseVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? "vi-VN";
      utterance.rate = 1.02;
      utterance.pitch = 1;

      // Estimate is only for the waveform; the promise settles on the real event.
      const stopAnimation = animateSpeech(Math.max(1_200, (text.length / 14) * 1_000), context);

      try {
        await new Promise<void>((resolve, reject) => {
          const onAbort = () => {
            window.speechSynthesis.cancel();
            reject(new InterviewAbortError());
          };
          if (context.signal.aborted) {
            onAbort();
            return;
          }
          context.signal.addEventListener("abort", onAbort, { once: true });
          const settle = () => {
            context.signal.removeEventListener("abort", onAbort);
            resolve();
          };
          utterance.onend = settle;
          // A synthesis error must not strand the session — treat it as spoken.
          utterance.onerror = settle;
          window.speechSynthesis.speak(utterance);
        });
      } finally {
        stopAnimation();
      }
    },

    async listen(turn, context) {
      const startedAt = performance.now();
      const samples: DeliverySample[] = [];
      let committed = "";
      let interim = "";

      const sampler = setInterval(() => {
        const sample: DeliverySample = {
          atMs: performance.now() - startedAt,
          wpm: 0,
          level: readLevel(),
        };
        samples.push(sample);
        context.onSample(sample);
      }, 50);

      const Recognition = getSpeechRecognition();
      let recognition: SpeechRecognitionLike | null = null;

      const emit = (text: string, isFinal: boolean) => {
        const segment: TranscriptSegment = {
          id: `live-${turn.question.id}-${committed.length}-${isFinal ? "f" : "i"}`,
          speaker: "candidate",
          text: text.trim(),
          isFinal,
          startedAtMs: performance.now() - startedAt,
          questionId: turn.question.id,
        };
        context.onSegment(segment);
      };

      if (Recognition) {
        recognition = new Recognition();
        recognition.lang = "vi-VN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
          interim = "";
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            if (!result) continue;
            const text = result[0].transcript;
            if (result.isFinal) {
              committed += `${text} `;
              emit(text, true);
            } else {
              interim += text;
            }
          }
          if (interim) emit(interim, false);
        };
        // Chrome ends recognition on silence; restart until the turn is over.
        recognition.onend = () => {
          if (!context.finishSignal.aborted && !context.signal.aborted) {
            try {
              recognition?.start();
            } catch {
              /* already restarting */
            }
          }
        };
        recognition.onerror = () => {
          /* transient; `onend` restarts */
        };
        try {
          recognition.start();
        } catch {
          recognition = null;
        }
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const onFinish = () => {
            cleanup();
            resolve();
          };
          const onAbort = () => {
            cleanup();
            reject(new InterviewAbortError());
          };
          const cleanup = () => {
            context.finishSignal.removeEventListener("abort", onFinish);
            context.signal.removeEventListener("abort", onAbort);
          };
          if (context.signal.aborted) {
            onAbort();
            return;
          }
          if (context.finishSignal.aborted) {
            onFinish();
            return;
          }
          context.finishSignal.addEventListener("abort", onFinish, { once: true });
          context.signal.addEventListener("abort", onAbort, { once: true });
        });
      } finally {
        clearInterval(sampler);
        if (recognition) {
          recognition.onend = null;
          recognition.abort();
        }
      }

      const transcript = `${committed} ${interim}`.trim();
      return { transcript, samples, elapsedMs: performance.now() - startedAt };
    },

    async evaluate(turn, result) {
      await delay(1_400, new AbortController().signal);
      // Rubric scores remain fixtures until `upnext-ai` exists, but they are
      // attached to the transcript that was actually spoken, and every delivery
      // number below is measured from the real microphone input.
      const score: QuestionScore = {
        ...initialQuestionScore(turn),
        transcript: result.transcript || turn.score.fallbackTranscript,
        delivery: computeDelivery(result.transcript, result.samples, result.elapsedMs),
      };
      return score;
    },

    dispose() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      for (const track of stream.getTracks()) track.stop();
      void audioContext?.close();
    },
  };
}
