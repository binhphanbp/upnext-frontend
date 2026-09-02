import { appLogger } from "./logger";

export interface AudioChunkListener {
  (chunkBlob: Blob): void;
}

export class AudioRecorderService {
  // 1. Full session recording
  private fullMediaRecorder: MediaRecorder | null = null;
  private fullRecordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;

  // 2. Segment / Speech Chunk Recorder (Visual Mouth VAD)
  private segmentRecorder: MediaRecorder | null = null;
  private segmentChunks: Blob[] = [];
  private isSegmentActive: boolean = false;
  private speechFramesCount: number = 0;
  private speechDurationMs: number = 0;
  private lastSpeechTimestamp: number = 0;
  private silenceStartTime: number = 0;
  private segmentStartTime: number = 0;
  private onChunkCallback: AudioChunkListener | null = null;

  private readonly SILENCE_DURATION_MS = 1000; // 1.0s of continuous closed mouth
  private readonly MIN_SPEECH_FRAMES = 4; // User must actively talk for at least 4 frames
  private readonly MIN_SPEECH_DURATION_MS = 350; // At least 350ms of cumulative speech

  public init(stream: MediaStream): boolean {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      appLogger.error("AUDIO_REC", "No audio tracks found in stream!");
      return false;
    }
    // Isolate ONLY audio tracks so MediaRecorder doesn't fail on video tracks
    this.stream = new MediaStream(audioTracks);
    appLogger.info(
      "AUDIO_REC",
      `AudioRecorder initialized with ${audioTracks.length} audio track(s). Ready.`,
    );
    return true;
  }

  private createMediaRecorder(stream: MediaStream): MediaRecorder {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        try {
          return new MediaRecorder(stream, { mimeType: type });
        } catch (e) {}
      }
    }
    return new MediaRecorder(stream);
  }

  public start(onChunkReady?: AudioChunkListener): boolean {
    if (!this.stream) {
      appLogger.error("AUDIO_REC", "start() called but this.stream is null");
      return false;
    }

    this.onChunkCallback = onChunkReady || null;
    this.fullRecordedChunks = [];
    this.segmentChunks = [];
    this.isSegmentActive = false;
    this.speechFramesCount = 0;
    this.speechDurationMs = 0;
    this.lastSpeechTimestamp = 0;
    this.silenceStartTime = 0;

    try {
      this.fullMediaRecorder = this.createMediaRecorder(this.stream);

      this.fullMediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.fullRecordedChunks.push(event.data);
        }
      };

      this.fullMediaRecorder.start(250);
      this.isRecording = true;
      appLogger.info(
        "AUDIO_REC",
        `Full session recorder started with MIME: ${this.fullMediaRecorder.mimeType || "default"}`,
      );
      return true;
    } catch (e: any) {
      appLogger.error("AUDIO_REC", `Failed to start MediaRecorder: ${e?.message || e}`, e);
      return false;
    }
  }

  /**
   * Feed Visual Mouth Tracking & Audio state from Face Mesh
   * - Starts segment only on verified mouth speech
   * - Real silence pause = 1.0s continuously with mouth closed
   * - NEVER spams API when candidate is resting / silent
   */
  public feedMouthAndVoiceActivity(
    isMouthTalking: boolean,
    isMouthMoving: boolean,
    mouthOpenness: number = 0,
    _audioVolume: number = 0,
  ) {
    if (!this.isRecording || !this.stream) return;

    // Strict speech detection: confirmed talking or sustained open lips
    const isSpeaking = isMouthTalking || (isMouthMoving && mouthOpenness >= 15);
    const now = performance.now();

    if (isSpeaking) {
      this.silenceStartTime = 0; // Reset silence timer when candidate is talking

      if (!this.isSegmentActive) {
        appLogger.vad(
          `👄 Candidate began speaking: Mouth=${mouthOpenness}%. Starting speech segment recording...`,
        );
        this.startNewSegment(now);
      } else {
        this.speechFramesCount++;
        const delta = now - (this.lastSpeechTimestamp || now);
        if (delta > 0 && delta < 500) {
          this.speechDurationMs += delta;
        }
      }
      this.lastSpeechTimestamp = now;
    } else {
      // Mouth is closed / resting
      if (this.isSegmentActive) {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = now;
          appLogger.vad(
            `🤐 Candidate closed mouth. Starting 1.0s real pause timer (recorded ${this.speechFramesCount} speech frames, ~${Math.round(
              this.speechDurationMs,
            )}ms speech)...`,
          );
        } else if (now - this.silenceStartTime >= this.SILENCE_DURATION_MS) {
          // Exactly 1.0s of continuous closed mouth reached!
          if (
            this.speechFramesCount >= this.MIN_SPEECH_FRAMES &&
            this.speechDurationMs >= this.MIN_SPEECH_DURATION_MS
          ) {
            appLogger.vad(
              `🎯 Real Pause reached 1.0s! Dispatching 1 speech chunk (~${Math.round(
                this.speechDurationMs,
              )}ms speech) to Backend STT.`,
            );
            this.finishCurrentSegment();
          } else {
            appLogger.vad(
              `Pause reached 1.0s but speech was negligible (${this.speechFramesCount} frames, ${Math.round(
                this.speechDurationMs,
              )}ms). Discarding segment — NO API call sent to Backend.`,
            );
            this.cancelCurrentSegment();
          }
        }
      }
      // If !this.isSegmentActive: candidate is just resting quietly -> DO ABSOLUTELY NOTHING (Zero API spam)
    }
  }

  /**
   * Backward-compatible helper for audio-only updates
   */
  public feedVoiceActivity(volumeOrSpeaking: number | boolean) {
    const isSpeaking =
      typeof volumeOrSpeaking === "number" ? volumeOrSpeaking >= 12 : Boolean(volumeOrSpeaking);
    this.feedMouthAndVoiceActivity(
      isSpeaking,
      isSpeaking,
      isSpeaking ? 30 : 0,
      typeof volumeOrSpeaking === "number" ? volumeOrSpeaking : 0,
    );
  }

  private startNewSegment(startTime: number) {
    if (!this.stream) return;

    try {
      this.segmentChunks = [];
      this.segmentRecorder = this.createMediaRecorder(this.stream);

      this.segmentRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.segmentChunks.push(event.data);
        }
      };

      this.segmentRecorder.start(100);
      this.isSegmentActive = true;
      this.segmentStartTime = startTime;
      this.silenceStartTime = 0;
      appLogger.vad(
        `Segment recorder started (MIME: ${this.segmentRecorder.mimeType || "default"})`,
      );
    } catch (e: any) {
      appLogger.error("AUDIO_REC", `Failed to start segment recorder: ${e?.message || e}`, e);
    }
  }

  private finishCurrentSegment() {
    if (!this.segmentRecorder || this.segmentRecorder.state === "inactive") {
      this.isSegmentActive = false;
      this.speechFramesCount = 0;
      this.speechDurationMs = 0;
      this.silenceStartTime = 0;
      return;
    }

    const currentRec = this.segmentRecorder;
    this.isSegmentActive = false;
    this.speechFramesCount = 0;
    this.speechDurationMs = 0;
    this.silenceStartTime = 0;

    currentRec.onstop = () => {
      if (this.segmentChunks.length > 0 && this.onChunkCallback) {
        const mimeType = currentRec.mimeType || "audio/webm";
        const chunkBlob = new Blob(this.segmentChunks, { type: mimeType });
        this.segmentChunks = [];
        appLogger.vad(
          `Speech chunk ready: ${chunkBlob.size} bytes (${mimeType}). Dispatching to Backend STT callback.`,
        );
        this.onChunkCallback(chunkBlob);
      } else {
        appLogger.warn("VAD", "Segment stopped but segmentChunks was empty.");
      }
    };

    try {
      if (currentRec.state === "recording") {
        currentRec.requestData();
      }
      currentRec.stop();
    } catch (e: any) {
      appLogger.error("AUDIO_REC", `Segment stop error: ${e?.message || e}`, e);
    }
  }

  private cancelCurrentSegment() {
    this.isSegmentActive = false;
    this.speechFramesCount = 0;
    this.speechDurationMs = 0;
    this.silenceStartTime = 0;
    if (this.segmentRecorder && this.segmentRecorder.state !== "inactive") {
      try {
        this.segmentRecorder.stop();
      } catch (e) {}
    }
    this.segmentChunks = [];
  }

  public async stop(): Promise<Blob | null> {
    if (this.isSegmentActive && this.speechFramesCount >= this.MIN_SPEECH_FRAMES) {
      this.finishCurrentSegment();
    } else if (this.isSegmentActive) {
      this.cancelCurrentSegment();
    }

    return new Promise((resolve) => {
      if (!this.fullMediaRecorder || this.fullMediaRecorder.state === "inactive") {
        this.isRecording = false;
        resolve(this.getFullBlob());
        return;
      }

      this.fullMediaRecorder.onstop = () => {
        this.isRecording = false;
        resolve(this.getFullBlob());
      };

      try {
        this.fullMediaRecorder.stop();
      } catch (e) {
        console.warn("[AudioRecorder] Stop error:", e);
        this.isRecording = false;
        resolve(this.getFullBlob());
      }
    });
  }

  public getFullBlob(): Blob | null {
    if (this.fullRecordedChunks.length === 0) return null;
    const mimeType = this.fullMediaRecorder?.mimeType || "audio/webm";
    return new Blob(this.fullRecordedChunks, { type: mimeType });
  }

  public async getBase64(): Promise<string | null> {
    const blob = this.getFullBlob();
    if (!blob) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/aac",
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }
}
