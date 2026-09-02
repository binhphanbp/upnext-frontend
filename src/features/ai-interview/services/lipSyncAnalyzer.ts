export type VisemeShape = "closed" | "small" | "medium" | "wide" | "o_shape" | "smile";

export interface LipSyncFrame {
  mouthOpenness: number; // 0 - 100%
  viseme: VisemeShape;
  volume: number; // 0 - 100
  pitchBand: "low" | "mid" | "high";
}

type LipSyncListener = (frame: LipSyncFrame) => void;

export class LipSyncAnalyzerService {
  private static instance: LipSyncAnalyzerService;

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  private animFrameId: number | null = null;
  private listeners: Set<LipSyncListener> = new Set();

  private smoothedOpenness = 0;
  private isAnalyzing = false;

  public static getInstance(): LipSyncAnalyzerService {
    if (!LipSyncAnalyzerService.instance) {
      LipSyncAnalyzerService.instance = new LipSyncAnalyzerService();
    }
    return LipSyncAnalyzerService.instance;
  }

  private initAudioContext(): boolean {
    if (typeof window === "undefined") return false;
    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      if (!this.analyser && this.audioCtx) {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.4;
      }
      return true;
    } catch (e) {
      console.warn("[LipSync] Failed to init AudioContext:", e);
      return false;
    }
  }

  public attachAudio(audio: HTMLAudioElement) {
    if (typeof window === "undefined") return;
    if (this.currentAudioElement === audio) return;
    this.detachAudio();

    this.initAudioContext();
    if (!this.audioCtx || !this.analyser) return;

    try {
      this.currentAudioElement = audio;

      // Create MediaElementSource attached to the active playing audio
      this.sourceNode = this.audioCtx.createMediaElementSource(audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.startAnalyzing();
    } catch (e) {
      console.warn("[LipSync] Could not attach MediaElementSource (CORS or re-use):", e);
      this.startFallbackAnalyzing();
    }
  }

  public detachAudio() {
    this.stopAnalyzing();
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // Ignore disconnect error
      }
      this.sourceNode = null;
    }
    this.currentAudioElement = null;
    this.broadcastFrame({
      mouthOpenness: 0,
      viseme: "closed",
      volume: 0,
      pitchBand: "mid",
    });
  }

  public subscribe(listener: LipSyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private broadcastFrame(frame: LipSyncFrame) {
    this.listeners.forEach((fn) => fn(frame));
  }

  private startAnalyzing() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    const dataArray = new Uint8Array(this.analyser?.frequencyBinCount || 256);

    const loop = () => {
      if (!this.isAnalyzing || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Extract voice frequency energy (Human vocal speech band ~ 300Hz - 3400Hz)
      let sum = 0;
      let lowEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;

      const binCount = dataArray.length;
      for (let i = 0; i < binCount; i++) {
        const val = dataArray[i] ?? 0;
        sum += val;
        if (i < binCount * 0.25) lowEnergy += val;
        else if (i < binCount * 0.65) midEnergy += val;
        else highEnergy += val;
      }

      const avgVolume = sum / binCount;
      const normalizedVolume = Math.min(100, Math.round((avgVolume / 128) * 100));

      let targetOpenness = 0;
      let viseme: VisemeShape = "closed";
      let pitchBand: "low" | "mid" | "high" = "mid";

      if (normalizedVolume > 4) {
        targetOpenness = Math.min(100, Math.round(((normalizedVolume - 4) / 50) * 100));

        if (lowEnergy > midEnergy && lowEnergy > highEnergy) {
          pitchBand = "low";
          viseme = targetOpenness > 60 ? "o_shape" : "small";
        } else if (highEnergy > midEnergy) {
          pitchBand = "high";
          viseme = targetOpenness > 50 ? "wide" : "small";
        } else {
          pitchBand = "mid";
          if (targetOpenness > 65) viseme = "wide";
          else if (targetOpenness > 35) viseme = "medium";
          else viseme = "small";
        }
      } else {
        targetOpenness = 0;
        viseme = "smile";
      }

      const attack = 0.45;
      const decay = 0.25;
      const factor = targetOpenness > this.smoothedOpenness ? attack : decay;
      this.smoothedOpenness += (targetOpenness - this.smoothedOpenness) * factor;

      this.broadcastFrame({
        mouthOpenness: Math.round(this.smoothedOpenness),
        viseme: this.smoothedOpenness < 8 ? "closed" : viseme,
        volume: normalizedVolume,
        pitchBand,
      });

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private startFallbackAnalyzing() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    let phase = 0;
    const loop = () => {
      if (!this.isAnalyzing) return;

      phase += 0.22;
      const raw = Math.sin(phase) * 0.5 + Math.sin(phase * 2.3) * 0.3 + 0.5;
      const openness = Math.max(0, Math.min(100, Math.round(raw * 85)));

      const visemes: VisemeShape[] = ["small", "medium", "wide", "o_shape"];
      const nextViseme = visemes[Math.floor((phase * 1.5) % visemes.length)] ?? "small";
      const viseme = openness < 15 ? "closed" : nextViseme;

      this.broadcastFrame({
        mouthOpenness: openness,
        viseme,
        volume: openness,
        pitchBand: "mid",
      });

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopAnalyzing() {
    this.isAnalyzing = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.smoothedOpenness = 0;
  }
}

export const lipSyncAnalyzer = LipSyncAnalyzerService.getInstance();
