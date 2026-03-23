"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bottle profile — 8-segment LatheGeometry (octagonal cross-section).
 * This produces a faceted, architectural silhouette — the language of luxury
 * fragrance houses like Chanel, Roja Dove, and Parfums de Marly.
 * Points: [radius, height], bottom-to-top.
 */
function buildBottlePoints(): THREE.Vector2[] {
  return [
    // Closed base disc
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.180, 0.000),
    new THREE.Vector2(0.200, 0.008),
    // Lower chamfer
    new THREE.Vector2(0.200, 0.016),
    // Body — straight, tall walls
    new THREE.Vector2(0.200, 0.018),
    new THREE.Vector2(0.200, 0.900),
    // Shoulder — defined angular taper (luxury bottles have a clear break here)
    new THREE.Vector2(0.198, 0.910),
    new THREE.Vector2(0.170, 0.950),
    new THREE.Vector2(0.110, 0.990),
    // Neck — slim and precise
    new THREE.Vector2(0.075, 1.010),
    new THREE.Vector2(0.070, 1.015),
    new THREE.Vector2(0.070, 1.160),
    // Cap seat — slight outward ring
    new THREE.Vector2(0.078, 1.175),
    new THREE.Vector2(0.080, 1.180),
  ];
}

/**
 * Cap — a tall, dominant, square-shouldered cap.
 * Great fragrance caps are as important as the bottle itself.
 */
function buildCapPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.078, 0.000),
    new THREE.Vector2(0.080, 0.002),
    // Flare outward to match bottle body width
    new THREE.Vector2(0.192, 0.022),
    new THREE.Vector2(0.200, 0.030),
    // Tall straight sides
    new THREE.Vector2(0.200, 0.310),
    // Top chamfer
    new THREE.Vector2(0.194, 0.325),
    new THREE.Vector2(0.160, 0.340),
    new THREE.Vector2(0.000, 0.345),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MATERIALS
// ─────────────────────────────────────────────────────────────────────────────

function useMaterials(liquidLevel: number) {
  return useMemo(() => {
    // Crystal glass — very clear with the faintest cool blue-grey tint.
    // High-end perfume glass (Baccarat, Saint-Louis crystal) has this quality.
    const glass = new THREE.MeshPhysicalMaterial({
      transmission: 0.92,
      roughness: 0.025,
      metalness: 0.0,
      thickness: 0.55,
      ior: 1.52,
      reflectivity: 0.45,
      color: new THREE.Color("#ddeeff"),
      attenuationColor: new THREE.Color("#a0c4e8"),
      attenuationDistance: 3.5,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.85,
      envMapIntensity: 2.2,
    });

    // Gold cap — brushed metal. Slightly warm, not gaudy.
    const cap = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#c4a055"),
      roughness: 0.18,
      metalness: 0.90,
      envMapIntensity: 2.5,
    });

    // Amber liquid — jewel-like, the colour of fine cognac or aged parfum.
    const liquid = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#b87010"),
      roughness: 0.04,
      metalness: 0.0,
      transmission: 0.40,
      thickness: 0.5,
      ior: 1.38,
      transparent: true,
      opacity: 0.90,
      side: THREE.FrontSide,
      envMapIntensity: 1.2,
    });

    // Liquid surface meniscus plane
    const meniscus = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#d4a030"),
      roughness: 0.02,
      metalness: 0.0,
      transparent: true,
      opacity: 0.55,
      transmission: 0.6,
      side: THREE.FrontSide,
    });

    return { glass, cap, liquid, meniscus };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquidLevel]);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTLE MESH
// ─────────────────────────────────────────────────────────────────────────────

function BottleMesh({ liquidLevel }: { liquidLevel: number }) {
  const mats = useMaterials(liquidLevel);

  const bottleGeo = useMemo(
    () => new THREE.LatheGeometry(buildBottlePoints(), 8, Math.PI / 8, Math.PI * 2),
    []
  );

  const capGeo = useMemo(
    () => new THREE.LatheGeometry(buildCapPoints(), 8, Math.PI / 8, Math.PI * 2),
    []
  );

  // Liquid cylinder — occupies the interior of the bottle body
  const liquidGeo = useMemo(
    () => new THREE.CylinderGeometry(0.175, 0.175, 1, 8, 1, false, Math.PI / 8),
    []
  );
  // Meniscus disc at the top of the liquid
  const meniscusGeo = useMemo(
    () => new THREE.CircleGeometry(0.170, 8, Math.PI / 8),
    []
  );

  // Liquid fills from y=0.02 (bottom of body interior) up to shoulder
  const bodyFillableH = 0.85; // body height minus some clearance
  const liquidH = bodyFillableH * Math.max(0.04, liquidLevel);
  const liquidBaseY = 0.020;
  const liquidCenterY = liquidBaseY + liquidH / 2;
  const liquidTopY = liquidBaseY + liquidH;

  return (
    // Offset so the whole bottle is vertically centered in the canvas
    <group position={[0, -0.78, 0]}>

      {/* ── Glass body ── */}
      <mesh geometry={bottleGeo} material={mats.glass} castShadow receiveShadow />

      {/* ── Liquid fill ── */}
      <mesh
        geometry={liquidGeo}
        material={mats.liquid}
        position={[0, liquidCenterY, 0]}
        scale={[1, liquidH, 1]}
        renderOrder={0}
      />

      {/* ── Liquid surface (meniscus) ── */}
      <mesh
        geometry={meniscusGeo}
        material={mats.meniscus}
        position={[0, liquidTopY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      />

      {/* ── Cap — sits just above the neck seat ── */}
      <mesh
        geometry={capGeo}
        material={mats.cap}
        position={[0, 1.180, 0]}
        castShadow
      />

      {/* ── Subtle shadow disc beneath bottle ── */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.22, 32]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.18}
          roughness={1}
          metalness={0}
        />
      </mesh>

    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENES
// ─────────────────────────────────────────────────────────────────────────────

function BottleScene({ liquidLevel, rotationY }: { liquidLevel: number; rotationY: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotationY;
    }
  });

  return (
    <group ref={groupRef}>
      <BottleMesh liquidLevel={liquidLevel} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTING — product-photography style
// ─────────────────────────────────────────────────────────────────────────────

function Lights() {
  return (
    <>
      {/* Key — warm, directional, upper-left-front */}
      <directionalLight
        position={[-2.5, 4.0, 3.5]}
        intensity={2.4}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Rim — cool blue, separates bottle from dark background */}
      <directionalLight
        position={[4.0, 1.5, -3.5]}
        intensity={1.6}
        color="#b8d4ff"
      />
      {/* Kick — warm amber uplighting from below (catches the glass base) */}
      <pointLight
        position={[0, -3.5, 1.5]}
        intensity={1.0}
        color="#d4820a"
        distance={8}
      />
      {/* Subtle fill from front-right */}
      <pointLight
        position={[3, 0.5, 3]}
        intensity={0.5}
        color="#ffffff"
        distance={10}
      />
      {/* Very dark ambient — keeps shadows from going pure black */}
      <ambientLight intensity={0.12} color="#1a1008" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED CANVAS
// ─────────────────────────────────────────────────────────────────────────────

export function Bottle3DCanvas({
  liquidLevel,
  rotationY,
  height = 400,
}: {
  liquidLevel: number;
  rotationY: number;
  autoRotate?: boolean;
  height?: number;
}) {
  return (
    <Canvas
      style={{ height, width: "100%" }}
      camera={{ position: [0, 0, 3.6], fov: 30 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      shadows={{ type: THREE.PCFShadowMap }}
    >
      <Lights />
      <Suspense fallback={null}>
        <Environment preset="studio" />
      </Suspense>
      <BottleScene liquidLevel={liquidLevel} rotationY={rotationY} />
    </Canvas>
  );
}
