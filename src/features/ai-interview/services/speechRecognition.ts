import { Language } from "../types";

// Declare SpeechRecognition interfaces for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface SpeechRecognitionCallbacks {
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onWpmChange?: (wpm: number) => void;
  onFillerWordDetected?: (filler: string, totalCount: number) => void;
  onError?: (error: string) => void;
}

const VIETNAMESE_FILLERS = [
  "à",
  "ờ",
  "ừm",
  "ơ",
  "ừ",
  "kiểu như",
  "kiểu",
  "thì là",
  "nói chung là",
  "như là",
  "thế là",
  "đấy",
  "dạ",
];

const ENGLISH_FILLERS = [
  "um",
  "uh",
  "er",
  "ah",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "i mean",
  "right",
];

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldRestart: boolean = false;
  private language: Language = "vi";
  private callbacks: SpeechRecognitionCallbacks | null = null;

  private finalTranscript: string = "";
  private currentInterim: string = "";
  private startTime: number = 0;
  private detectedFillers: string[] = [];

  constructor() {
    if (typeof window === "undefined") return;
    // Check support
    const win = window as unknown as IWindow;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("[STT] SpeechRecognition API is not supported in this browser.");
    }
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private initRecognitionInstance() {
    const win = window as unknown as IWindow;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    try {
      if (this.recognition) {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        try {
          this.recognition.abort();
        } catch (e) {}
      }

      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = this.language === "vi" ? "vi-VN" : "en-US";

      rec.onstart = () => {
        this.isListening = true;
        console.log("[STT] Recognition started successfully on language:", rec.lang);
      };

      rec.onresult = (event: any) => {
        let finalAccum = "";
        let interimAccum = "";

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0]?.transcript || "";

          if (result.isFinal) {
            finalAccum += text + " ";
          } else {
            interimAccum += text;
          }
        }

        this.finalTranscript = finalAccum;
        this.currentInterim = interimAccum;
        const fullText = (finalAccum + " " + interimAccum).trim();

        if (fullText) {
          this.checkFillerWords(fullText);
        }

        const words = fullText.split(/\s+/).filter(Boolean);
        const elapsedMinutes = Math.max(0.05, (performance.now() - this.startTime) / 60000);
        const wpm = Math.round(words.length / elapsedMinutes);

        if (this.callbacks) {
          this.callbacks.onTranscriptChange(fullText, false);
          if (this.callbacks.onWpmChange) {
            this.callbacks.onWpmChange(wpm);
          }
        }
      };

      rec.onerror = (event: any) => {
        console.info(
          "[STT] Browser WebSpeech status:",
          event.error,
          "(Using Backend VAD STT as primary)",
        );
        if (
          event.error === "network" ||
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          this.shouldRestart = false;
          // Silent fallback to Backend VAD Chunking - no annoying red/yellow banners
        } else if (event.error === "audio-capture") {
          this.callbacks?.onError?.(
            "Không thể thu âm từ Microphone. Vui lòng kiểm tra quyền thiết bị.",
          );
        }
      };

      rec.onend = () => {
        this.isListening = false;
        console.log("[STT] Recognition ended. shouldRestart:", this.shouldRestart);
        if (this.shouldRestart) {
          setTimeout(() => {
            if (this.shouldRestart && !this.isListening) {
              try {
                this.recognition = this.initRecognitionInstance();
                this.recognition?.start();
              } catch (e) {
                console.warn("[STT] Auto-restart attempt:", e);
              }
            }
          }, 80);
        }
      };

      return rec;
    } catch (e) {
      console.error("[STT] Failed to create SpeechRecognition instance:", e);
      return null;
    }
  }

  public start(language: Language = "vi", callbacks: SpeechRecognitionCallbacks) {
    if (!this.isSupported()) {
      callbacks.onError?.(
        "Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Google Chrome hoặc Microsoft Edge.",
      );
      return;
    }

    this.language = language;
    this.callbacks = callbacks;
    this.finalTranscript = "";
    this.currentInterim = "";
    this.detectedFillers = [];
    this.startTime = performance.now();
    this.shouldRestart = true;

    try {
      this.recognition = this.initRecognitionInstance();
      if (this.recognition) {
        this.recognition.start();
      }
    } catch (e) {
      console.warn("[STT] Error during start():", e);
    }
  }

  public stop(): string {
    this.shouldRestart = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    const finalResult = (this.finalTranscript + " " + this.currentInterim).trim();
    if (this.callbacks) {
      this.callbacks.onTranscriptChange(finalResult, true);
    }
    return finalResult;
  }

  public getFinalTranscript(): string {
    return (this.finalTranscript + " " + this.currentInterim).trim();
  }

  public getDetectedFillers(): string[] {
    return [...this.detectedFillers];
  }

  private checkFillerWords(chunk: string) {
    const list = this.language === "vi" ? VIETNAMESE_FILLERS : ENGLISH_FILLERS;
    const lower = chunk.toLowerCase();

    for (const filler of list) {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = lower.match(regex);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          this.detectedFillers.push(filler);
          if (this.callbacks?.onFillerWordDetected) {
            this.callbacks.onFillerWordDetected(filler, this.detectedFillers.length);
          }
        }
      }
    }
  }
}
