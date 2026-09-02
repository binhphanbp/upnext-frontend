"use client";
import { Box, RotateCcw, Sliders } from "lucide-react";
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
  const bonesRef = useRef<{ [key: string]: THREE.Bone }>({});

  const [modelType, setModelType] = useState<"glb" | "procedural">("procedural");
  const [showSliders, setShowSliders] = useState<boolean>(false);
  const [rotationYDeg, setRotationYDeg] = useState<number>(0);

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
    });
    return () => unsub();
  }, []);

  // Initialize Three.js WebGL Scene ONLY ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera setup: Aligned with office chair in anh-nen.png
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 100);
    camera.position.set(0, 0.0, 1.28);

    // 3. Renderer with high brightness & tone mapping
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Rotate 3D character in 360 degrees)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.4;
    controls.maxDistance = 2.5;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.target.set(0, -0.02, 0); // Focus on head/face in chair
    controlsRef.current = controls;

    // 5. Studio Lighting Rig (Exposure 1.0 balanced)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.6);
    hemiLight.position.set(0, 5, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(0.8, 2.0, 2.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(-1.8, 1.2, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.8);
    rimLight.position.set(0, 2.5, -2.5);
    scene.add(rimLight);

    // 6. Direct loading of /models/upnext_character.glb with Full Skeleton + Morph Targets
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const modelUrl = "/models/upnext_character.glb";

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        // Auto-Center Model using Box3
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());

        // Focus on Head & Chest level (Head is at Y~1.65, Chest is at Y~1.35)
        // Shift model so head is placed right inside the chair headrest
        const headLevel = 1.62;
        const scaleFactor = 0.95;

        root.scale.set(scaleFactor, scaleFactor, scaleFactor);
        root.position.x = -center.x * scaleFactor;
        root.position.y = -headLevel * scaleFactor + 0.08; // Place head at Y ~ +0.08 (chair headrest level)
        root.position.z = -center.z * scaleFactor;

        // Default rotation facing front (0 rad)
        root.rotation.y = rotationYRadRef.current;

        // Frame camera directly at face level
        camera.position.set(0, 0.0, 1.28);
        controls.target.set(0, -0.02, 0);
        controls.update();

        // Scan for Morph Targets & Skeleton Bones
        morphTargetsRef.current = {};
        bonesRef.current = {};

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
                  std.emissive = new THREE.Color(0x050505);
                }
                if ((m as any).map) {
                  (m as any).map.colorSpace = THREE.SRGBColorSpace;
                  (m as any).map.needsUpdate = true;
                }
              });
            }

            // Register Native Morph Targets / Blendshapes
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
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

          // Register 52 Skeleton Bones
          if ((child as THREE.Bone).isBone) {
            const bone = child as THREE.Bone;
            const bName = bone.name.toLowerCase();
            bonesRef.current[bName] = bone;
          }
        });

        // RELAX ARMS FROM T-POSE INTO NATURAL SITTING INTERVIEW POSE
        const bones = bonesRef.current;
        if (bones["leftarm"]) {
          bones["leftarm"].rotateX(1.25);
          bones["leftarm"].rotateZ(0.15);
        }
        if (bones["rightarm"]) {
          bones["rightarm"].rotateX(1.25);
          bones["rightarm"].rotateZ(-0.15);
        }
        if (bones["leftforearm"]) {
          bones["leftforearm"].rotateX(0.45);
          bones["leftforearm"].rotateZ(0.2);
        }
        if (bones["rightforearm"]) {
          bones["rightforearm"].rotateX(0.45);
          bones["rightforearm"].rotateZ(-0.2);
        }
        if (bones["leftshoulder"]) bones["leftshoulder"].rotateZ(-0.05);
        if (bones["rightshoulder"]) bones["rightshoulder"].rotateZ(0.05);

        modelRootRef.current = root;
        scene.add(root);
        setModelType("glb");
      },
      undefined,
      (err) => {
        console.error("[ThreeAvatar3D] Could not load GLB:", err);
      },
    );

    // 7. 60 FPS GPU Render, Skeleton Bone Articulation & Morph Target Animation Loop
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

      // 1. GPU ACCELERATED FACIAL MORPH TARGET INFLUENCES
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

      // 2. 52-BONE SKELETON KINEMATICS (Head, Neck, Spine Breathing & Cadence)
      const bones = bonesRef.current;
      const headBone = bones["head"];
      const neckBone = bones["neck"];
      const spineBone = bones["spine2"] || bones["spine1"] || bones["spine"];

      if (headBone) {
        if (isCurrentlySpeaking) {
          headBone.rotation.x = Math.sin(elapsed * 10) * 0.04;
          headBone.rotation.y = Math.sin(elapsed * 3) * 0.035;
          headBone.rotation.z = Math.sin(elapsed * 4.5) * 0.015;
        } else if (isCurrentlyEvaluating) {
          headBone.rotation.z = -0.06;
          headBone.rotation.x = -0.04;
          headBone.rotation.y = 0.05;
        } else {
          headBone.rotation.set(0, Math.sin(elapsed * 1.1) * 0.02, 0);
        }
      }

      if (neckBone && isCurrentlySpeaking) {
        neckBone.rotation.x = Math.sin(elapsed * 10) * 0.02;
      }

      if (spineBone) {
        spineBone.rotation.x = Math.sin(elapsed * 2.2) * 0.015;
      }

      // 3. Model Root Base Positioning
      if (modelRootRef.current) {
        const root = modelRootRef.current;
        const baseY = rotationYRadRef.current;
        root.rotation.y = baseY;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 800;
      const h = containerRef.current.clientHeight || 450;
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
    <div className="relative h-full w-full select-none">
      {/* 3D WebGL Canvas Container (Full size of 16:9 Stage) */}
      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Model Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-emerald-400 shadow backdrop-blur-md">
        <Box className="h-3.5 w-3.5 text-emerald-400" />
        <span>{modelType === "glb" ? "3D AI Recruiter" : "3D UpNext"}</span>
      </div>

      {/* Top Right Controls (Angle & Reset) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setShowSliders(!showSliders)}
          title="Mở thanh chỉnh góc xoay"
          className="rounded-lg border border-slate-700/80 bg-slate-950/80 p-2 text-xs text-slate-400 shadow backdrop-blur-md transition hover:bg-slate-800 hover:text-emerald-400"
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleResetCamera}
          title="Xoay lại góc nhìn ban đầu"
          className="rounded-lg border border-slate-700/80 bg-slate-950/80 p-2 text-xs text-slate-400 shadow backdrop-blur-md transition hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Visual Angle Slider Overlay */}
      {showSliders && (
        <div className="absolute inset-x-4 top-14 z-20 ml-auto flex max-w-sm flex-col gap-2 rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
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
          <div className="flex justify-between text-[10px] text-slate-400">
            <button
              onClick={() => setRotationYDeg(0)}
              className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-emerald-400 hover:bg-slate-700"
            >
              Nhìn thẳng (0°)
            </button>
            <button
              onClick={() => setRotationYDeg(-90)}
              className="rounded bg-slate-800 px-2 py-0.5 hover:bg-slate-700"
            >
              Góc -90°
            </button>
            <button
              onClick={() => setRotationYDeg(90)}
              className="rounded bg-slate-800 px-2 py-0.5 hover:bg-slate-700"
            >
              Góc +90°
            </button>
            <button
              onClick={() => setShowSliders(false)}
              className="rounded bg-emerald-600/30 px-2 py-0.5 font-bold text-emerald-300 hover:bg-emerald-600/50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 left-3 rounded bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-500 backdrop-blur-sm">
        Kéo chuột để xoay 3D
      </div>
    </div>
  );
};
