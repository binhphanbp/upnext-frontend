"use client";
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

    // 4. Fixed Cinematic Camera (All interactions locked: no rotation, no zoom, no pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
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
        const scaleFactor = 0.855; // Reduced 10% from 0.95

        root.scale.set(scaleFactor, scaleFactor, scaleFactor);
        root.position.x = -center.x * scaleFactor;
        root.position.y = -headLevel * scaleFactor + 0.05; // Placed inside chair headrest
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
    const startPerfTime = performance.now();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startPerfTime) * 0.001;
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative h-full w-full select-none">
      {/* 3D WebGL Canvas Container (Full size of 16:9 Stage - Locked Fixed Camera) */}
      <div
        ref={containerRef}
        className="pointer-events-none h-full w-full cursor-default select-none"
      />

      {/* Fallback Mascot Avatar while 3D Model loads */}
      {modelType !== "glb" && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <div className="relative -mt-4 flex animate-pulse flex-col items-center">
            <img
              src="/upnext_avatar.png"
              alt="AI Recruiter"
              className="h-44 w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
            />
            <div className="mt-2 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-0.5 text-[10px] text-emerald-400 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
              <span>Đang tải 3D Avatar...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
