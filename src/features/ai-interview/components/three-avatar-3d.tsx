"use client";
import { Sparkles, Box, RotateCcw, Sliders } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { lipSyncAnalyzer, LipSyncFrame } from "../services/lipSyncAnalyzer";

interface ThreeAvatar3DProps {
  isSpeaking: boolean;
  isEvaluating?: boolean;
  isLoadingVoice?: boolean;
}

export const ThreeAvatar3D: React.FC<ThreeAvatar3DProps> = ({
  isSpeaking,
  isEvaluating = false,
  isLoadingVoice = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const morphTargetsRef = useRef<{ [key: string]: { mesh: THREE.Mesh; index: number }[] }>({});

  const [modelType, setModelType] = useState<"glb" | "procedural">("procedural");
  const [showSliders, setShowSliders] = useState<boolean>(false);
  const [rotationYDeg, setRotationYDeg] = useState<number>(0); // 0 deg faces front eye-contact

  const rotationYRadRef = useRef<number>(0);

  // Dynamic state refs (read directly inside 60 FPS requestAnimationFrame loop)
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const isEvaluatingRef = useRef<boolean>(isEvaluating);
  const isLoadingVoiceRef = useRef<boolean>(isLoadingVoice);
  const lipFrameRef = useRef<LipSyncFrame>({
    mouthOpenness: 0,
    viseme: "closed",
    volume: 0,
    pitchBand: "mid",
  });

  const [lipFrameState, setLipFrameState] = useState<LipSyncFrame>({
    mouthOpenness: 0,
    viseme: "closed",
    volume: 0,
    pitchBand: "mid",
  });

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isEvaluatingRef.current = isEvaluating;
  }, [isEvaluating]);

  useEffect(() => {
    isLoadingVoiceRef.current = isLoadingVoice;
  }, [isLoadingVoice]);

  useEffect(() => {
    rotationYRadRef.current = (rotationYDeg * Math.PI) / 180;
  }, [rotationYDeg]);

  // Subscribe to real-time Web Audio API Lip-Sync Analyser
  useEffect(() => {
    const unsub = lipSyncAnalyzer.subscribe((frame) => {
      lipFrameRef.current = frame;
      setLipFrameState(frame);
    });
    return () => unsub();
  }, []);

  // Initialize Three.js WebGL Scene ONLY ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 240;
    const height = container.clientHeight || 260;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera setup (Focus on character face & upper chest)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 100);
    camera.position.set(0, 0.12, 1.45);

    // 3. Renderer with high brightness & tone mapping
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.95;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Rotate 3D character in 360 degrees)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 3.0;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.target.set(0, 0.1, 0);
    controlsRef.current = controls;

    // 5. Bright Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 3.8);
    hemiLight.position.set(0, 5, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.0);
    keyLight.position.set(0.8, 2.0, 2.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 3.0);
    fillLight.position.set(-1.8, 1.2, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 4.5);
    rimLight.position.set(0, 2.5, -2.5);
    scene.add(rimLight);

    // 6. Direct loading of /models/upnext_character.glb with Native Morph Targets
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const modelUrl = "/models/upnext_character.glb";

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        // Auto-Center Model using Box3
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center root at (0, 0, 0)
        root.position.x = -center.x;
        root.position.y = -center.y;
        root.position.z = -center.z;

        // Default rotation facing front (0 rad)
        root.rotation.y = rotationYRadRef.current;

        // Scale model to fill viewport
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const desiredSize = 1.15;
          const scaleFactor = desiredSize / maxDim;
          root.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        // Frame camera to look at the upper chest & face of character
        camera.position.set(0, 0.12, 1.35);
        controls.target.set(0, 0.1, 0);
        controls.update();

        // Scan for Morph Targets (jawOpen, mouthSmile, viseme_O)
        morphTargetsRef.current = {};

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                m.side = THREE.DoubleSide;
                if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const std = m as THREE.MeshStandardMaterial;
                  std.roughness = 0.65;
                  std.metalness = 0.05;
                  std.emissive = new THREE.Color(0x1a1a1a);
                }
                if ((m as any).map) {
                  (m as any).map.colorSpace = THREE.SRGBColorSpace;
                  (m as any).map.needsUpdate = true;
                }
              });
            }

            // Register Native Morph Targets / Blendshapes
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
              console.log(
                "[ThreeAvatar3D] Found morph targets on mesh:",
                mesh.morphTargetDictionary,
              );
              Object.keys(mesh.morphTargetDictionary).forEach((name) => {
                const dict = mesh.morphTargetDictionary;
                const idx = dict ? dict[name] : undefined;
                if (idx === undefined) return;
                const lower = name.toLowerCase();
                if (!morphTargetsRef.current[lower]) {
                  morphTargetsRef.current[lower] = [];
                }
                morphTargetsRef.current[lower]?.push({ mesh, index: idx });
              });
            }
          }
        });

        modelRootRef.current = root;
        scene.add(root);
        setModelType("glb");
      },
      undefined,
      (err) => {
        console.error("[ThreeAvatar3D] Could not load GLB:", err);
      },
    );

    // 7. 60 FPS GPU Render & Morph Target Animation Loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentLip = lipFrameRef.current;
      const isCurrentlySpeaking = isSpeakingRef.current;
      const isCurrentlyEvaluating = isEvaluatingRef.current || isLoadingVoiceRef.current;
      const rawOpenness = currentLip.mouthOpenness / 100;
      const opennessRatio = isCurrentlySpeaking ? Math.min(1.0, rawOpenness * 1.5) : 0;

      // Update OrbitControls
      controls.update();

      // 1. GPU ACCELERATED MORPH TARGET INFLUENCES
      const morphs = morphTargetsRef.current;

      // jawOpen (Lower jaw & lower lip drop)
      const jawKeys = ["jawopen", "mouthopen", "viseme_aa", "mouth_open", "jaw_open"];
      jawKeys.forEach((k) => {
        morphs[k]?.forEach(({ mesh, index }) => {
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = opennessRatio;
          }
        });
      });

      // mouthSmile (Gentle smiling expression when idle, slight smile when speaking)
      const smileKeys = ["mouthsmile", "smile", "mouth_smile"];
      const targetSmile = isCurrentlySpeaking ? 0.15 : 0.35;
      smileKeys.forEach((k) => {
        morphs[k]?.forEach(({ mesh, index }) => {
          if (mesh.morphTargetInfluences) {
            const current = mesh.morphTargetInfluences[index] ?? 0;
            mesh.morphTargetInfluences[index] = current + (targetSmile - current) * 0.1;
          }
        });
      });

      // viseme_O (Pucker lips on O and U sounds)
      const oKeys = ["viseme_o", "viseme_u", "o_shape", "mouth_o"];
      const targetO =
        isCurrentlySpeaking && currentLip.viseme === "o_shape" ? opennessRatio * 0.8 : 0;
      oKeys.forEach((k) => {
        morphs[k]?.forEach(({ mesh, index }) => {
          if (mesh.morphTargetInfluences) {
            const current = mesh.morphTargetInfluences[index] ?? 0;
            mesh.morphTargetInfluences[index] = current + (targetO - current) * 0.2;
          }
        });
      });

      // 2. 3D MODEL ROOT CADENCE, BREATHING & GESTURES
      if (modelRootRef.current) {
        const root = modelRootRef.current;
        const baseY = rotationYRadRef.current;

        // Idle Breathing float
        root.position.y = Math.sin(elapsed * 2.2) * 0.012;

        if (isCurrentlySpeaking) {
          // Energetic speaking cadence (gentle head/body nod + volume pulse)
          root.rotation.x = Math.sin(elapsed * 12) * 0.035;
          root.rotation.y = baseY + Math.sin(elapsed * 2.8) * 0.045;
          root.rotation.z = Math.sin(elapsed * 4) * 0.015;
          // Subtle volume pulse
          const speechPulse = 1.0 + opennessRatio * 0.025;
          root.scale.set(root.scale.x, root.scale.x * speechPulse, root.scale.x);
        } else if (isCurrentlyEvaluating) {
          // Thinking tilt
          root.rotation.z = -0.06;
          root.rotation.x = -0.04;
          root.rotation.y = baseY + 0.06;
        } else {
          // Gentle listening movement
          root.rotation.set(0, baseY + Math.sin(elapsed * 1.1) * 0.02, 0);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 240;
      const h = containerRef.current.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Dynamic Ambient Glow Behind 3D Stage */}
      <div
        className={`absolute -inset-4 rounded-3xl opacity-75 blur-2xl transition-all duration-500 ${
          isSpeaking
            ? "animate-pulse bg-gradient-to-tr from-emerald-500/40 via-teal-500/30 to-indigo-500/30"
            : isEvaluating || isLoadingVoice
              ? "animate-pulse-slow bg-gradient-to-tr from-purple-500/40 via-indigo-500/30 to-cyan-500/30"
              : "bg-gradient-to-tr from-slate-700/20 via-emerald-950/20 to-slate-900/20"
        }`}
      />

      {/* 3D WebGL Canvas Viewport Card */}
      <div
        className={`relative h-56 w-52 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-slate-900/95 via-slate-950/90 to-slate-950 shadow-2xl transition-all duration-300 sm:h-64 sm:w-60 ${
          isSpeaking
            ? "scale-[1.02] border-emerald-400/80 shadow-emerald-500/30"
            : isEvaluating || isLoadingVoice
              ? "scale-[0.98] rotate-[-1deg] border-purple-400/80 shadow-purple-500/30"
              : "border-slate-800 shadow-slate-950/80"
        }`}
      >
        {/* Three.js Canvas Container */}
        <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

        {/* Top Action Buttons */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/85 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow">
          <Box className="h-3 w-3 text-emerald-400" />
          <span>{modelType === "glb" ? "3D GLB Real" : "3D UpNext"}</span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => setShowSliders(!showSliders)}
            title="Mở thanh chỉnh góc xoay"
            className="rounded-md border border-slate-800 bg-slate-950/80 p-1.5 text-[10px] text-slate-400 transition hover:bg-slate-800 hover:text-emerald-400"
          >
            <Sliders className="h-3 w-3" />
          </button>
          <button
            onClick={handleResetCamera}
            title="Xoay lại góc nhìn ban đầu"
            className="rounded-md border border-slate-800 bg-slate-950/80 p-1.5 text-[10px] text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        {/* Visual Angle Slider Overlay (When user clicks Sliders icon) */}
        {showSliders && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex flex-col gap-1.5 rounded-xl border border-slate-700 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
              <span>Chỉnh góc quay mặt:</span>
              <span className="font-mono text-emerald-400">{rotationYDeg}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={rotationYDeg}
              onChange={(e) => setRotationYDeg(parseInt(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <button
                onClick={() => setRotationYDeg(0)}
                className="rounded bg-slate-800 px-1.5 py-0.5 font-semibold text-emerald-400 hover:bg-slate-700"
              >
                Nhìn thẳng (0°)
              </button>
              <button
                onClick={() => setRotationYDeg(-90)}
                className="rounded bg-slate-800 px-1.5 py-0.5 hover:bg-slate-700"
              >
                Góc -90°
              </button>
              <button
                onClick={() => setRotationYDeg(90)}
                className="rounded bg-slate-800 px-1.5 py-0.5 hover:bg-slate-700"
              >
                Góc +90°
              </button>
              <button
                onClick={() => setShowSliders(false)}
                className="rounded bg-emerald-600/30 px-1.5 py-0.5 font-bold text-emerald-300 hover:bg-emerald-600/50"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute right-2 bottom-1 text-[9px] text-slate-500">
          Kéo chuột để xoay 3D
        </div>
      </div>

      {/* Character Info Pill with Real-time Equalizer */}
      <div className="relative z-10 mt-2 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/90 px-3.5 py-1.5 text-xs shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-[11px] tracking-wider text-transparent uppercase">
            UpNext 3D Recruiter
          </span>
        </div>

        {/* Live Audio Equalizer Bars when speaking */}
        {isSpeaking ? (
          <div className="ml-1 flex h-3 items-center gap-0.5">
            <span
              className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
              style={{ height: `${Math.max(4, (lipFrameState.volume / 100) * 14)}px` }}
            />
            <span
              className="w-1 rounded-full bg-teal-400 transition-all duration-75"
              style={{ height: `${Math.max(4, ((lipFrameState.volume * 1.2) / 100) * 14)}px` }}
            />
            <span
              className="w-1 rounded-full bg-emerald-300 transition-all duration-75"
              style={{ height: `${Math.max(4, (lipFrameState.mouthOpenness / 100) * 14)}px` }}
            />
            <span
              className="w-1 rounded-full bg-emerald-500 transition-all duration-75"
              style={{ height: `${Math.max(4, ((lipFrameState.volume * 0.8) / 100) * 14)}px` }}
            />
          </div>
        ) : isEvaluating || isLoadingVoice ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300">
            <Sparkles className="h-3 w-3 animate-spin text-amber-400" /> Đang chuẩn bị...
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">Đang lắng nghe</span>
        )}
      </div>
    </div>
  );
};
