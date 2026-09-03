import { Language } from "../types";
import { apiClient } from "./apiClient";
import { lipSyncAnalyzer } from "./lipSyncAnalyzer";

export interface TTSOptions {
  language: Language;
  rate?: number | undefined; // 0.5 - 2.0 (default 1.0)
  pitch?: number | undefined; // 0 - 2.0 (default 1.0)
  voiceId?: string | undefined; // e.g. 'vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'
  onStart?: (() => void) | undefined;
  onEnd?: (() => void) | undefined;
  onBoundary?: ((charIndex: number) => void) | undefined;
  onError?: ((err: unknown) => void) | undefined;
}

export class SpeechSynthesisService {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private objectUrlToRevoke: string | null = null;

  /**
   * Speak strictly using Backend Neural TTS (Studio Quality Natural Voices)
   * Fetches audio blob from BE first so question text only renders when voice is 100% ready.
   */
  public async speak(text: string, options: TTSOptions): Promise<void> {
    this.stop();

    const cleanText = text.trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    try {
      const selectedVoice =
        options.voiceId || (options.language === "vi" ? "vi-VN-NamMinhNeural" : "en-US-GuyNeural");

      const streamUrl = apiClient.getTTSStreamUrl(cleanText, selectedVoice, options.rate ?? 1.0);

      // Fetch the generated voice from Backend first
      const res = await fetch(streamUrl);
      if (!res.ok) {
        throw new Error(`TTS server responded with status ${res.status}`);
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("TTS returned empty audio blob");
      }

      const audioUrl = URL.createObjectURL(blob);
      this.objectUrlToRevoke = audioUrl;

      await this.speakWithBackendAudio(audioUrl, options);
    } catch (backendError) {
      console.error("[TTS] Backend Neural TTS error (No browser fallback used):", backendError);
      this.isSpeaking = false;
      options.onError?.(backendError);
      options.onEnd?.();
    }
  }

  /**
   * Play in-memory audio blob generated strictly by Backend Neural TTS
   */
  private speakWithBackendAudio(audioSrc: string, options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = audioSrc;
      this.currentAudio = audio;

      audio.onplay = () => {
        this.isSpeaking = true;
        lipSyncAnalyzer.attachAudio(audio);
        options.onStart?.();
      };

      audio.onended = () => {
        this.isSpeaking = false;
        lipSyncAnalyzer.detachAudio();
        this.currentAudio = null;
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (err) => {
        console.warn("[TTS] Audio element playback error:", err);
        this.isSpeaking = false;
        lipSyncAnalyzer.detachAudio();
        this.currentAudio = null;
        reject(err);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn("[TTS] Play error / Autoplay policy:", playErr);
          this.isSpeaking = false;
          lipSyncAnalyzer.detachAudio();
          this.currentAudio = null;
          reject(playErr);
        });
      }
    });
  }

  public stop() {
    lipSyncAnalyzer.detachAudio();
    if (this.currentAudio) {
      try {
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = "";
        this.currentAudio.load();
      } catch {
        // Ignore stop error
      }
      this.currentAudio = null;
    }
    if (this.objectUrlToRevoke) {
      try {
        URL.revokeObjectURL(this.objectUrlToRevoke);
      } catch {
        // Ignore revoke error
      }
      this.objectUrlToRevoke = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel error
      }
    }
    this.isSpeaking = false;
  }

  public pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  public resume() {
    if (this.currentAudio) {
      this.currentAudio.play().catch(() => {});
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
