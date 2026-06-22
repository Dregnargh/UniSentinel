"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function shieldGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 1.15);
  s.lineTo(0.92, 0.78);
  s.lineTo(0.92, -0.05);
  s.quadraticCurveTo(0.92, -0.78, 0, -1.18);
  s.quadraticCurveTo(-0.92, -0.78, -0.92, -0.05);
  s.lineTo(-0.92, 0.78);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 4,
    curveSegments: 24,
  });
  geo.center();
  return geo;
}

function Shield() {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(shieldGeometry, []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 22), [geo]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.18;
    // gentle parallax toward the pointer
    const tx = state.pointer.y * 0.22;
    const ty = state.pointer.x * 0.35;
    g.rotation.x += (tx - g.rotation.x) * 0.04;
    g.position.x += (ty * 0.4 - g.position.x) * 0.04;
  });

  return (
    <group ref={group} scale={1.35}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          color="#0c2c4d"
          metalness={0.85}
          roughness={0.35}
          emissive="#0a3550"
          emissiveIntensity={0.6}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#39b6dc" transparent opacity={0.9} />
      </lineSegments>
      {/* inner US monogram strokes */}
      <mesh position={[0, 0, 0.3]}>
        <torusGeometry args={[0.5, 0.012, 8, 64, Math.PI * 1.3]} />
        <meshBasicMaterial color="#7fdcf2" />
      </mesh>
    </group>
  );
}

function Aura() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const N = 1400;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 2.4 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#5fc6e6"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Shard(props: ThreeElements["mesh"]) {
  return (
    <mesh {...props}>
      <octahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial
        color="#0f6e8c"
        emissive="#1aa0c4"
        emissiveIntensity={0.5}
        metalness={0.6}
        roughness={0.3}
        flatShading
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#bfe6f2" />
      <pointLight position={[-5, -2, -3]} intensity={40} color="#2f95b8" distance={20} />
      <pointLight position={[3, 2, 4]} intensity={18} color="#7fdcf2" distance={16} />

      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
        <Shield />
      </Float>
      <Aura />

      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <Shard position={[2.7, 1.3, -1]} />
      </Float>
      <Float speed={1.6} rotationIntensity={1.2} floatIntensity={1.2}>
        <Shard position={[-2.9, -1, 0.5]} scale={0.8} />
      </Float>
      <Float speed={2.4} rotationIntensity={1} floatIntensity={1.8}>
        <Shard position={[2.2, -1.7, 0.8]} scale={0.6} />
      </Float>
    </Canvas>
  );
}
