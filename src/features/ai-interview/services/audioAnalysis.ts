import { AudioMetrics } from "../types";

export class AudioAnalysisService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // DSP Audio Filtering Nodes (Noise & Background Music Isolation)
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private vocalBoostFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;

  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainArray: Uint8Array<ArrayBuffer> | null = null;
  private isRunning: boolean = false;
  private isNoiseSuppressionEnabled: boolean = true;

  private speakingThreshold: number = 9; // RMS volume 0-100 threshold
  private ambientNoiseFloor: number = 3; // Dynamically tracks ambient background noise
  private totalSpeakingSeconds: number = 0;
  private totalSilenceSeconds: number = 0;
  private lastSampleTime: number = 0;
  private pitchSamples: number[] = [];

  public init(mediaStream: MediaStream, enableNoiseSuppression: boolean = true): boolean {
    try {
      this.isNoiseSuppressionEnabled = enableNoiseSuppression;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);

      // Initialize DSP Voice Isolation & Noise Suppression Chain
      this.setupDSPChain();

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.timeDomainArray = new Uint8Array(this.analyser.fftSize);

      this.isRunning = true;
      this.lastSampleTime = performance.now();
      return true;
    } catch (err) {
      console.error("[AudioAnalysis] Failed to initialize AudioContext:", err);
      return false;
    }
  }

  /**
   * Setup Realtime DSP Filter Chain:
   * Source -> Highpass (85Hz) -> Lowpass (3500Hz) -> Vocal Boost (1800Hz) -> Compressor -> Analyser
   */
  private setupDSPChain() {
    if (!this.audioContext || !this.sourceNode || !this.analyser) return;

    try {
      this.sourceNode.disconnect();
    } catch (e) {}

    if (this.isNoiseSuppressionEnabled) {
      // 1. High-Pass Filter: Cuts off sub-bass rumble, AC hum, keyboard desk thumps, low music bass (< 85Hz)
      this.highPassFilter = this.audioContext.createBiquadFilter();
      this.highPassFilter.type = "highpass";
      this.highPassFilter.frequency.setValueAtTime(85, this.audioContext.currentTime);
      this.highPassFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

      // 2. Low-Pass Filter: Cuts off high-frequency hiss, fan noise, cymbals, ambient music treble (> 3600Hz)
      this.lowPassFilter = this.audioContext.createBiquadFilter();
      this.lowPassFilter.type = "lowpass";
      this.lowPassFilter.frequency.setValueAtTime(3600, this.audioContext.currentTime);
      this.lowPassFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

      // 3. Human Speech Presence Peaking Filter: Boosts vocal clarity (1500Hz - 2500Hz)
      this.vocalBoostFilter = this.audioContext.createBiquadFilter();
      this.vocalBoostFilter.type = "peaking";
      this.vocalBoostFilter.frequency.setValueAtTime(1800, this.audioContext.currentTime);
      this.vocalBoostFilter.gain.setValueAtTime(3.5, this.audioContext.currentTime);
      this.vocalBoostFilter.Q.setValueAtTime(1.2, this.audioContext.currentTime);

      // 4. Dynamics Compressor / Noise Gate: Smooths vocal dynamics and attenuates steady background floor
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-28, this.audioContext.currentTime);
      this.compressorNode.knee.setValueAtTime(10, this.audioContext.currentTime);
      this.compressorNode.ratio.setValueAtTime(6, this.audioContext.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);

      // Connect DSP chain
      this.sourceNode.connect(this.highPassFilter);
      this.highPassFilter.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.vocalBoostFilter);
      this.vocalBoostFilter.connect(this.compressorNode);
      this.compressorNode.connect(this.analyser);
    } else {
      // Bypass filters
      this.sourceNode.connect(this.analyser);
    }
  }

  /**
   * Toggle Noise Suppression & Music Filter at runtime
   */
  public setNoiseSuppression(enabled: boolean) {
    if (this.isNoiseSuppressionEnabled === enabled) return;
    this.isNoiseSuppressionEnabled = enabled;
    this.setupDSPChain();
  }

  public getIsNoiseSuppressionEnabled(): boolean {
    return this.isNoiseSuppressionEnabled;
  }

  public getLiveMetrics(): AudioMetrics {
    if (!this.isRunning || !this.analyser || !this.dataArray || !this.timeDomainArray) {
      return this.getDefaultAudioMetrics();
    }

    const now = performance.now();
    const deltaSec = (now - this.lastSampleTime) / 1000;
    this.lastSampleTime = now;

    // 1. Get frequency & time domain data
    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getByteTimeDomainData(this.timeDomainArray);

    // 2. Calculate RMS Volume (0-100)
    let sumSquares = 0;
    for (let i = 0; i < this.timeDomainArray.length; i++) {
      const sample = this.timeDomainArray[i] ?? 128;
      const normalized = (sample - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.timeDomainArray.length);
    // Scale RMS logarithmically to human perception (0 to 100)
    const volume = Math.min(100, Math.round(rms * 220));

    // Dynamic ambient noise floor tracking (adapts to background music / fan / room noise)
    if (volume < this.speakingThreshold) {
      this.ambientNoiseFloor = this.ambientNoiseFloor * 0.95 + volume * 0.05;
    }

    // Voice threshold with noise suppression: must rise above dynamic ambient noise floor
    const dynamicThreshold = this.isNoiseSuppressionEnabled
      ? Math.max(this.speakingThreshold, this.ambientNoiseFloor + 5)
      : this.speakingThreshold;

    const isSpeaking = volume >= dynamicThreshold;
    if (isSpeaking) {
      this.totalSpeakingSeconds += deltaSec;
    } else {
      this.totalSilenceSeconds += deltaSec;
    }

    // 3. Determine volume level state
    let volumeLevel: AudioMetrics["volumeLevel"] = "silent";
    if (volume < 5) {
      volumeLevel = "silent";
    } else if (volume < 18) {
      volumeLevel = "too_quiet";
    } else if (volume <= 75) {
      volumeLevel = "optimal";
    } else {
      volumeLevel = "too_loud";
    }

    // 4. Estimate approximate fundamental Pitch (Hz) via Autocorrelation
    const pitch = isSpeaking
      ? this.detectPitch(this.timeDomainArray, this.audioContext?.sampleRate || 44100)
      : 0;
    if (pitch > 50 && pitch < 500) {
      this.pitchSamples.push(pitch);
      if (this.pitchSamples.length > 30) this.pitchSamples.shift();
    }

    // Calculate Pitch Stability (0-100): lower variance = steadier confident voice
    let pitchStability = 85;
    if (this.pitchSamples.length > 5) {
      const mean = this.pitchSamples.reduce((a, b) => a + b, 0) / this.pitchSamples.length;
      const variance =
        this.pitchSamples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.pitchSamples.length;
      const stdDev = Math.sqrt(variance);
      // stdDev < 15 is very steady, > 45 is erratic/trembling
      pitchStability = Math.max(20, Math.min(100, Math.round(100 - (stdDev / 50) * 80)));
    }

    return {
      volume,
      volumeLevel,
      isSpeaking,
      pitch: Math.round(pitch),
      pitchStability,
      speechRateWPM: 0, // Will be computed in speech recognition service
      fillerWordsCount: 0,
      fillerWordsDetected: [],
      totalSilenceSeconds: Math.round(this.totalSilenceSeconds * 10) / 10,
      totalSpeakingSeconds: Math.round(this.totalSpeakingSeconds * 10) / 10,
      isNoiseFiltered: this.isNoiseSuppressionEnabled,
      ambientNoiseLevel: Math.round(this.ambientNoiseFloor),
    };
  }

  /**
   * Get raw frequency spectrum and time domain data for Visualizer
   */
  public getVisualizerData(): { frequencyData: Uint8Array; timeDomainData: Uint8Array } | null {
    if (!this.analyser || !this.dataArray || !this.timeDomainArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getByteTimeDomainData(this.timeDomainArray);
    return {
      frequencyData: this.dataArray,
      timeDomainData: this.timeDomainArray,
    };
  }

  /**
   * Pitch detection algorithm using normalized autocorrelation
   */
  private detectPitch(buffer: Uint8Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let sumOfSquares = 0;
    const floatBuffer = new Float32Array(SIZE);

    for (let i = 0; i < SIZE; i++) {
      const sample = buffer[i] ?? 128;
      const val = (sample - 128) / 128;
      floatBuffer[i] = val;
      sumOfSquares += val * val;
    }

    const rms = Math.sqrt(sumOfSquares / SIZE);
    if (rms < 0.04) return 0; // too quiet to detect pitch reliably

    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      const val = floatBuffer[i] ?? 0;
      if (Math.abs(val) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      const val = floatBuffer[SIZE - i] ?? 0;
      if (Math.abs(val) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmedBuffer = floatBuffer.subarray(r1, r2);
    const c = new Float32Array(trimmedBuffer.length);
    for (let i = 0; i < trimmedBuffer.length; i++) {
      for (let j = 0; j < trimmedBuffer.length - i; j++) {
        const tbJ = trimmedBuffer[j] ?? 0;
        const tbJI = trimmedBuffer[j + i] ?? 0;
        c[i] = (c[i] ?? 0) + tbJ * tbJI;
      }
    }

    let d = 0;
    while ((c[d] ?? 0) > (c[d + 1] ?? 0)) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmedBuffer.length; i++) {
      const cVal = c[i] ?? 0;
      if (cVal > maxval) {
        maxval = cVal;
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 > 0 && maxval > 0.01) {
      return sampleRate / T0;
    }
    return 0;
  }

  public resetTimers() {
    this.totalSpeakingSeconds = 0;
    this.totalSilenceSeconds = 0;
    this.pitchSamples = [];
  }

  public dispose() {
    this.isRunning = false;
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        console.warn(e);
      }
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn(e);
      }
    }
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
  }

  public getDefaultAudioMetrics(): AudioMetrics {
    return {
      volume: 0,
      volumeLevel: "silent",
      isSpeaking: false,
      pitch: 0,
      pitchStability: 80,
      speechRateWPM: 0,
      fillerWordsCount: 0,
      fillerWordsDetected: [],
      totalSilenceSeconds: 0,
      totalSpeakingSeconds: 0,
      isNoiseFiltered: this.isNoiseSuppressionEnabled,
      ambientNoiseLevel: 0,
    };
  }
}
