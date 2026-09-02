import type * as FaceApiTypes from "@vladmandic/face-api";

import { FaceMetrics, EmotionType } from "../types";

let faceapiInstance: typeof import("@vladmandic/face-api") | null = null;

async function getFaceApi(): Promise<typeof import("@vladmandic/face-api") | null> {
  if (typeof window === "undefined") return null;
  if (!faceapiInstance) {
    faceapiInstance = await import("@vladmandic/face-api");
  }
  return faceapiInstance;
}

let modelsLoaded = false;
let isLoading = false;

export async function loadFaceDetectionModels(modelsPath = "/models"): Promise<boolean> {
  if (modelsLoaded) return true;
  const faceapi = await getFaceApi();
  if (!faceapi) return false;

  if (isLoading) {
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return modelsLoaded;
  }

  isLoading = true;
  try {
    // Configure WebGL backend for hardware GPU acceleration
    if ((faceapi.tf as any)?.ready) {
      try {
        if ((faceapi.tf as any).findBackend?.("webgl")) {
          await (faceapi.tf as any).setBackend("webgl");
        }
        await (faceapi.tf as any).ready();
        const env = (faceapi.tf as any).env?.();
        if (env) {
          env.set("WEBGL_CPU_FORWARD", false);
          env.set("WEBGL_PACK", true);
        }
      } catch (beErr) {
        console.warn("[FaceDetection] WebGL backend warning:", beErr);
      }
    }

    // Load Tiny Face Detector, Face Expression Net, and Face Landmark 68 Net
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
    ]);

    modelsLoaded = true;
    console.log("[FaceDetection] All models loaded successfully with WebGL from", modelsPath);
    return true;
  } catch (error) {
    console.warn(
      "[FaceDetection] Failed to load models from local path, trying CDN fallback...",
      error,
    );
    try {
      const cdnPath = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(cdnPath),
        faceapi.nets.faceExpressionNet.loadFromUri(cdnPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(cdnPath),
      ]);
      modelsLoaded = true;
      console.log("[FaceDetection] Models loaded from CDN fallback successfully");
      return true;
    } catch (fallbackError) {
      console.error("[FaceDetection] Failed to load models from CDN as well:", fallbackError);
      return false;
    }
  } finally {
    isLoading = false;
  }
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

export interface DetectionResult {
  metrics: FaceMetrics;
  rawDetection?: any | undefined;
}

// Candidate Face Lock State
interface FaceAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
  lastSeenTime: number;
}

let lockedCandidateAnchor: FaceAnchor | null = null;
let prevMouthLandmarks: Array<{ x: number; y: number }> | null = null;
const mouthActivityWindow: boolean[] = [];

export function lockCandidateFace(box?: { x: number; y: number; width: number; height: number }) {
  if (box) {
    lockedCandidateAnchor = {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      lastSeenTime: performance.now(),
    };
  } else {
    lockedCandidateAnchor = null;
  }
}

export function resetCandidateFaceLock() {
  lockedCandidateAnchor = null;
  prevMouthLandmarks = null;
  mouthActivityWindow.length = 0;
}

/**
 * Detect face, expressions, mouth movement & lock onto the primary candidate face
 */
export async function detectFaceMetrics(
  videoElement: HTMLVideoElement | HTMLCanvasElement,
): Promise<DetectionResult> {
  const faceapi = await getFaceApi();
  if (!faceapi || !modelsLoaded) {
    return {
      metrics: getDefaultFaceMetrics(),
    };
  }

  try {
    // inputSize 224 yields optimal balance of 60fps latency and high accuracy
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.4,
    });

    const allDetections = await faceapi
      .detectAllFaces(videoElement, options)
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!allDetections || allDetections.length === 0) {
      return {
        metrics: getDefaultFaceMetrics(),
      };
    }

    const now = performance.now();
    const videoWidth = (videoElement as HTMLVideoElement).videoWidth || videoElement.width || 640;
    const videoHeight =
      (videoElement as HTMLVideoElement).videoHeight || videoElement.height || 480;
    const videoCenterX = videoWidth / 2;
    const videoCenterY = videoHeight / 2;

    const firstDetection = allDetections[0];
    if (!firstDetection) {
      return {
        metrics: getDefaultFaceMetrics(),
      };
    }

    // 1. Candidate Face Locking Strategy
    let candidateDetection = firstDetection;

    if (!lockedCandidateAnchor || now - lockedCandidateAnchor.lastSeenTime > 5000) {
      // Find face closest to center with largest area to establish candidate lock
      let bestScore = -Infinity;
      for (const det of allDetections) {
        const b = det.detection.box;
        const centerX = b.x + b.width / 2;
        const centerY = b.y + b.height / 2;
        const distFromCenter = Math.hypot(centerX - videoCenterX, centerY - videoCenterY);
        const area = b.width * b.height;
        // Higher score for large face near the center
        const score = area / (1 + distFromCenter * 1.5);
        if (score > bestScore) {
          bestScore = score;
          candidateDetection = det;
        }
      }
      lockedCandidateAnchor = {
        x: candidateDetection.detection.box.x,
        y: candidateDetection.detection.box.y,
        width: candidateDetection.detection.box.width,
        height: candidateDetection.detection.box.height,
        lastSeenTime: now,
      };
    } else {
      // Lock exists: find detection closest to the locked candidate anchor
      let minDistance = Infinity;
      let matchedDet = candidateDetection;

      for (const det of allDetections) {
        const b = det.detection.box;
        const curCenterX = b.x + b.width / 2;
        const curCenterY = b.y + b.height / 2;
        const anchorCenterX = lockedCandidateAnchor.x + lockedCandidateAnchor.width / 2;
        const anchorCenterY = lockedCandidateAnchor.y + lockedCandidateAnchor.height / 2;

        const posDist = Math.hypot(curCenterX - anchorCenterX, curCenterY - anchorCenterY);
        const sizeDist =
          Math.abs(b.width - lockedCandidateAnchor.width) +
          Math.abs(b.height - lockedCandidateAnchor.height);
        const totalDist = posDist + sizeDist * 0.5;

        if (totalDist < minDistance) {
          minDistance = totalDist;
          matchedDet = det;
        }
      }

      candidateDetection = matchedDet;
      // Smoothly update anchor position to track natural candidate motion
      lockedCandidateAnchor = {
        x: lockedCandidateAnchor.x * 0.7 + candidateDetection.detection.box.x * 0.3,
        y: lockedCandidateAnchor.y * 0.7 + candidateDetection.detection.box.y * 0.3,
        width: lockedCandidateAnchor.width * 0.8 + candidateDetection.detection.box.width * 0.2,
        height: lockedCandidateAnchor.height * 0.8 + candidateDetection.detection.box.height * 0.2,
        lastSeenTime: now,
      };
    }

    const foreignFacesCount = Math.max(0, allDetections.length - 1);
    const { detection: boxData, expressions, landmarks } = candidateDetection;
    const box = boxData.box;

    // Format raw emotions to 0-100 percentages
    const emotions: Record<EmotionType, number> = {
      neutral: Math.round((expressions.neutral || 0) * 100),
      happy: Math.round((expressions.happy || 0) * 100),
      sad: Math.round((expressions.sad || 0) * 100),
      angry: Math.round((expressions.angry || 0) * 100),
      fearful: Math.round((expressions.fearful || 0) * 100),
      disgusted: Math.round((expressions.disgusted || 0) * 100),
      surprised: Math.round((expressions.surprised || 0) * 100),
    };

    // Find dominant emotion
    let dominantEmotion: EmotionType = "neutral";
    let maxVal = -1;
    (Object.keys(emotions) as EmotionType[]).forEach((emo) => {
      if (emotions[emo] > maxVal) {
        maxVal = emotions[emo];
        dominantEmotion = emo;
      }
    });

    // Compute Head Pose & Gaze / Eye Contact using 68 landmarks
    const positions = landmarks.positions;
    const noseTip = positions[30] ?? { x: 0, y: 0 }; // point 30: tip of nose
    const leftEye = positions[36] ?? { x: 0, y: 0 }; // outer left eye
    const rightEye = positions[45] ?? { x: 0, y: 0 }; // outer right eye
    const chin = positions[8] ?? { x: 0, y: 0 }; // bottom of chin

    // Midpoint between eyes
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) || 1;

    // Yaw & Pitch
    const yawRatio = (noseTip.x - eyeMidX) / eyeDistance;
    const yaw = Math.round(yawRatio * 60);
    const noseToEyeY = noseTip.y - eyeMidY;
    const noseToChinY = chin.y - noseTip.y;
    const pitchRatio = (noseToEyeY - noseToChinY * 0.7) / eyeDistance;
    const pitch = Math.round(pitchRatio * 45);
    const roll = Math.round(
      (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI,
    );

    // Eye Contact
    const yawPenalty = Math.max(0, Math.abs(yaw) - 8) * 3.5;
    const pitchPenalty = Math.max(0, Math.abs(pitch) - 8) * 3.5;
    const eyeContactScore = Math.max(0, Math.min(100, Math.round(100 - yawPenalty - pitchPenalty)));
    const isLookingAtCamera = eyeContactScore >= 60;
    const smileScore = emotions.happy;

    // Confidence
    const positiveFactor = emotions.neutral * 0.65 + emotions.happy * 0.35;
    const negativePenalty =
      emotions.fearful * 1.2 + emotions.angry * 1.0 + emotions.sad * 0.8 + emotions.disgusted * 0.6;
    const gazeFactor = eyeContactScore * 0.2;
    const confidenceScore = Math.max(
      10,
      Math.min(100, Math.round(positiveFactor * 0.8 + gazeFactor - negativePenalty * 0.6)),
    );

    // 2. Precise Inner-Lip Tracking (True Inner MAR & Nose-relative Velocity)
    // Inner lip points: 60 (left), 64 (right), 62 (top), 66 (bottom), 61 & 67, 63 & 65
    const p62 = positions[62] ?? { x: 0, y: 0 };
    const p66 = positions[66] ?? { x: 0, y: 0 };
    const p61 = positions[61] ?? { x: 0, y: 0 };
    const p67 = positions[67] ?? { x: 0, y: 0 };
    const p63 = positions[63] ?? { x: 0, y: 0 };
    const p65 = positions[65] ?? { x: 0, y: 0 };
    const p60 = positions[60] ?? { x: 0, y: 0 };
    const p64 = positions[64] ?? { x: 0, y: 0 };

    const innerHeight1 = Math.hypot(p62.x - p66.x, p62.y - p66.y);
    const innerHeight2 = Math.hypot(p61.x - p67.x, p61.y - p67.y);
    const innerHeight3 = Math.hypot(p63.x - p65.x, p63.y - p65.y);
    const avgInnerHeight = (innerHeight1 + innerHeight2 + innerHeight3) / 3;

    const innerWidth = Math.hypot(p60.x - p64.x, p60.y - p64.y) || 1;
    const innerMar = avgInnerHeight / innerWidth;

    // Scale Inner MAR to 0-100% percentage:
    // Closed resting mouth: innerMar <= 0.09 -> mouthOpenness = 0%
    // Talking open mouth: innerMar ~ 0.16 - 0.45 -> mouthOpenness = 25% - 100%
    let mouthOpenness = 0;
    if (innerMar > 0.09) {
      mouthOpenness = Math.min(100, Math.round(((innerMar - 0.09) / 0.26) * 100));
    }

    // Calculate Head-Pose Invariant Lip Movement Velocity (offset relative to nose tip)
    const currentMouthPts = positions.slice(48, 68);
    let motionDelta = 0;
    if (prevMouthLandmarks && prevMouthLandmarks.length === currentMouthPts.length) {
      let sumDist = 0;
      for (let i = 0; i < currentMouthPts.length; i++) {
        const cur = currentMouthPts[i];
        const prev = prevMouthLandmarks[i];
        if (!cur || !prev) continue;
        const curRelX = cur.x - noseTip.x;
        const curRelY = cur.y - noseTip.y;
        const prevRelX = prev.x;
        const prevRelY = prev.y;
        sumDist += Math.hypot(curRelX - prevRelX, curRelY - prevRelY);
      }
      motionDelta = sumDist / (eyeDistance * currentMouthPts.length);
    }
    prevMouthLandmarks = currentMouthPts.map((p: { x: number; y: number }) => ({
      x: p.x - noseTip.x,
      y: p.y - noseTip.y,
    }));

    // Instantaneous mouth moving condition (needs actual open lips OR deliberate lip motion)
    const isCurrentlyTalking = mouthOpenness >= 20 || (innerMar >= 0.13 && motionDelta >= 0.018);

    // Sliding window for smoothed mouth talking state (debounce filter)
    mouthActivityWindow.push(isCurrentlyTalking);
    if (mouthActivityWindow.length > 8) mouthActivityWindow.shift();
    const talkingFrames = mouthActivityWindow.filter(Boolean).length;
    const isMouthTalking = talkingFrames >= 4;
    const isMouthMoving = talkingFrames >= 3;

    const metrics: FaceMetrics = {
      detected: true,
      isLockedCandidate: true,
      foreignFacesCount,
      box: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
      dominantEmotion,
      emotions,
      confidenceScore,
      eyeContactScore,
      isLookingAtCamera,
      smileScore,
      mouthOpenness,
      isMouthMoving,
      isMouthTalking,
      headPose: {
        yaw,
        pitch,
        roll,
      },
    };

    return {
      metrics,
      rawDetection: candidateDetection,
    };
  } catch (error) {
    console.error("[FaceDetection] Error in detectFaceMetrics:", error);
    return {
      metrics: getDefaultFaceMetrics(),
    };
  }
}

export function getDefaultFaceMetrics(): FaceMetrics {
  return {
    detected: false,
    isLockedCandidate: false,
    foreignFacesCount: 0,
    dominantEmotion: "neutral",
    emotions: {
      neutral: 100,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    },
    confidenceScore: 70,
    eyeContactScore: 80,
    isLookingAtCamera: true,
    smileScore: 0,
    mouthOpenness: 0,
    isMouthMoving: false,
    isMouthTalking: false,
    headPose: { yaw: 0, pitch: 0, roll: 0 },
  };
}

/**
 * Draw face bounding box, emotions, and landmarks onto a 2D canvas
 */
export function drawFaceDetectionHUD(
  canvas: HTMLCanvasElement,
  videoWidth: number,
  videoHeight: number,
  result: DetectionResult,
  options: {
    showLandmarks?: boolean;
    showBox?: boolean;
    showEmotionBadge?: boolean;
    showGazeGuide?: boolean;
    isMirrored?: boolean;
  } = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    showLandmarks = true,
    showBox = true,
    showEmotionBadge = true,
    showGazeGuide = true,
    isMirrored = true,
  } = options;

  // Match canvas dimensions to video
  if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { metrics, rawDetection } = result;

  if (!metrics.detected || !rawDetection || !metrics.box) {
    // Draw "No face detected" guide overlay if desired
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(
      canvas.width * 0.25,
      canvas.height * 0.15,
      canvas.width * 0.5,
      canvas.height * 0.7,
    );
    ctx.setLineDash([]);
    return;
  }

  const { x, y, width, height } = metrics.box;
  // Calculate horizontal position matching the mirrored video
  const drawBoxX = isMirrored ? canvas.width - x - width : x;

  // 1. Draw sleek Cyber Bounding Box with Corner Accents
  if (showBox) {
    const isGoodGaze = metrics.isLookingAtCamera;
    const boxColor = metrics.isMouthTalking
      ? "rgba(16, 185, 129, 0.95)"
      : isGoodGaze
        ? "rgba(99, 102, 241, 0.85)"
        : "rgba(245, 158, 11, 0.85)";
    const cornerLength = Math.min(width, height) * 0.22;

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2.5;

    // Corner brackets
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(drawBoxX, y + cornerLength);
    ctx.lineTo(drawBoxX, y);
    ctx.lineTo(drawBoxX + cornerLength, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(drawBoxX + width - cornerLength, y);
    ctx.lineTo(drawBoxX + width, y);
    ctx.lineTo(drawBoxX + width, y + cornerLength);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(drawBoxX, y + height - cornerLength);
    ctx.lineTo(drawBoxX, y + height);
    ctx.lineTo(drawBoxX + cornerLength, y);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(drawBoxX + width - cornerLength, y + height);
    ctx.lineTo(drawBoxX + width, y + height);
    ctx.lineTo(drawBoxX + width, y + height - cornerLength);
    ctx.stroke();

    // Subtle inner fill
    ctx.fillStyle = metrics.isMouthTalking
      ? "rgba(16, 185, 129, 0.06)"
      : isGoodGaze
        ? "rgba(99, 102, 241, 0.05)"
        : "rgba(245, 158, 11, 0.05)";
    ctx.fillRect(drawBoxX, y, width, height);

    // Locked Candidate Tag below box
    const tagHeight = 18;
    const tagWidth = 150;
    const tagX = drawBoxX + (width - tagWidth) / 2;
    const tagY = y + height + 6;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, tagX, tagY, tagWidth, tagHeight, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10B981";
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔒 ĐÃ KHÓA ỨNG VIÊN CHÍNH", tagX + tagWidth / 2, tagY + tagHeight / 2);
    ctx.textAlign = "start";
  }

  // 2. Draw subtle Face Landmarks
  if (showLandmarks && rawDetection.landmarks) {
    const positions = rawDetection.landmarks.positions;
    for (let i = 0; i < positions.length; i++) {
      const pt = positions[i];
      if (!pt) continue;
      const drawPtX = isMirrored ? canvas.width - pt.x : pt.x;
      // Highlight mouth points (48-67) distinctly in emerald when speaking
      const isMouthPt = i >= 48 && i <= 67;
      if (isMouthPt) {
        ctx.fillStyle = metrics.isMouthTalking ? "#10B981" : "#A78BFA";
        ctx.beginPath();
        ctx.arc(drawPtX, pt.y, metrics.isMouthTalking ? 2.5 : 1.8, 0, 2 * Math.PI);
        ctx.fill();
      } else if (i % 2 === 0 || i >= 36) {
        ctx.fillStyle = "rgba(129, 140, 248, 0.6)";
        ctx.beginPath();
        ctx.arc(drawPtX, pt.y, 1.6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // 3. Draw Emotion & Mouth Status Floating HUD Badge above head
  if (showEmotionBadge) {
    const badgeHeight = 28;
    const badgeWidth = Math.max(210, width * 0.95);
    const badgeX = Math.max(
      10,
      Math.min(canvas.width - badgeWidth - 10, drawBoxX + (width - badgeWidth) / 2),
    );
    const badgeY = Math.max(10, y - badgeHeight - 12);

    // Badge background
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = metrics.isMouthTalking
      ? "rgba(16, 185, 129, 0.7)"
      : "rgba(99, 102, 241, 0.5)";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Emotion text & emoji
    const emotionEmojiMap: Record<EmotionType, string> = {
      happy: "😊 Vui vẻ",
      neutral: "😐 Điềm tĩnh",
      sad: "😔 Buồn bã",
      angry: "😠 Căng thẳng",
      fearful: "😨 Lo lắng",
      disgusted: "😒 Bối rối",
      surprised: "😲 Bất ngờ",
    };

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = "middle";

    const label = `${emotionEmojiMap[metrics.dominantEmotion]} • ${
      metrics.isMouthTalking ? "👄 Đang nói" : "🤐 Im lặng"
    }`;
    ctx.fillText(label, badgeX + 10, badgeY + badgeHeight / 2);

    // Mouth Openness indicator pill
    const pillText = `${metrics.mouthOpenness}%`;
    ctx.font = "700 10px monospace";
    ctx.fillStyle = metrics.isMouthTalking ? "#10B981" : "#94A3B8";
    ctx.textAlign = "right";
    ctx.fillText(pillText, badgeX + badgeWidth - 10, badgeY + badgeHeight / 2);
    ctx.textAlign = "start";
  }

  // 4. Warning overlay when foreign faces attempt to enter frame
  if ((metrics.foreignFacesCount || 0) > 0) {
    const warnHeight = 26;
    const warnWidth = 360;
    const warnX = (canvas.width - warnWidth) / 2;
    const warnY = 12;

    ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, warnX, warnY, warnWidth, warnHeight, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `⚠️ CẢNH BÁO: Phát hiện ${metrics.foreignFacesCount} người lạ! Đang cô lập ứng viên.`,
      warnX + warnWidth / 2,
      warnY + warnHeight / 2,
    );
    ctx.textAlign = "start";
  }

  // 5. Gaze orientation helper arrow if looking off-center
  if (showGazeGuide && !metrics.isLookingAtCamera) {
    const centerX = drawBoxX + width / 2;
    ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
    ctx.font = "500 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡ Nhìn thẳng vào Camera để tăng điểm Eye-contact", centerX, y + height + 36);
    ctx.textAlign = "start";
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
