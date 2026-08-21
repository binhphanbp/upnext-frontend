"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { detectCapabilities, type LiveCapabilities } from "../api/live-driver";

export type DevicePermission = "unknown" | "prompting" | "granted" | "denied";

/**
 * The pre-flight check.
 *
 * A candidate finding out their microphone is muted *during* question three is
 * the single worst failure mode of this feature, so the setup screen proves the
 * hardware works before anything starts: real `getUserMedia`, a real analyser
 * driving the level meter, a real camera preview.
 */
export function useDeviceCheck() {
  const [capabilities, setCapabilities] = useState<LiveCapabilities>({
    microphone: false,
    speechRecognition: false,
    speechSynthesis: false,
  });
  const [permission, setPermission] = useState<DevicePermission>("unknown");
  const [level, setLevel] = useState(0);
  /** Highest level seen so far — proves the meter moved even if they stop talking. */
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => setCapabilities(detectCapabilities()), []);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(
    async (withVideo: boolean) => {
      stop();
      setPermission("prompting");
      setError(null);
      setPeak(0);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: withVideo ? { width: 640, height: 360 } : false,
        });
        streamRef.current = stream;
        setPermission("granted");

        if (videoRef.current && withVideo) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            /* autoplay blocked; the poster state covers it */
          });
        }

        const AudioContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;

        const audioContext = new AudioContextCtor();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        const buffer = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(buffer);
          let sumSquares = 0;
          for (const value of buffer) {
            const centred = (value - 128) / 128;
            sumSquares += centred * centred;
          }
          const next = Math.min(1, Math.sqrt(sumSquares / buffer.length) * 3.2);
          setLevel(next);
          setPeak((current) => Math.max(current, next));
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      } catch (caught) {
        setPermission("denied");
        setError(
          caught instanceof DOMException && caught.name === "NotAllowedError"
            ? "Bạn đã từ chối quyền truy cập. Mở lại quyền micro trong thanh địa chỉ của trình duyệt rồi thử lại."
            : "Không tìm thấy thiết bị thu âm khả dụng.",
        );
      }
    },
    [stop],
  );

  return { capabilities, permission, level, peak, error, videoRef, start, stop };
}
