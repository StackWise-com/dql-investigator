"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";

const COMMANDS = [
  { text: "fetch", color: "#22d3ee", pos: [-3, 1.5, -2] },
  { text: "filter", color: "#34d399", pos: [3, 0.5, -3] },
  { text: "sort", color: "#fbbf24", pos: [-2.5, -1, -1] },
  { text: "summarize", color: "#a78bfa", pos: [2.5, -1.5, -2.5] },
  { text: "parse", color: "#f472b6", pos: [0, 2, -4] },
  { text: "fieldsAdd", color: "#fb923c", pos: [-3.5, -2, -3] },
  { text: "dedup", color: "#60a5fa", pos: [3.5, 2, -1] },
  { text: "limit", color: "#f87171", pos: [0, -2.5, -2] },
];

interface StreamConfig {
  curve: THREE.CatmullRomCurve3;
  color: string;
  speed: number;
  count: number;
  tubeRadius: number;
}

function createStreamPath(offsetX: number, offsetY: number, offsetZ: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 + offsetX;
    const x = Math.cos(angle) * (3 + offsetX) + Math.sin(t * 4) * 1.5;
    const y = Math.sin(angle * 0.7) * (2 + offsetY) + Math.cos(t * 3) * 1.2;
    const z = -2 - t * 4 + offsetZ;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

function PipelineTube({ curve, radius }: { curve: THREE.CatmullRomCurve3; radius: number }) {
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, radius, 8, false);
  }, [curve, radius]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color="#0f172a"
        transparent
        opacity={0.25}
        roughness={0.1}
        metalness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ParticleStream({ curve, color, speed, count }: Omit<StreamConfig, "tubeRadius">) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      t: i / count,
      offset: Math.random() * 0.02,
    }));
  }, [count]);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      p.t += (speed + p.offset) * delta * 0.15;
      if (p.t > 1) p.t -= 1;
      const pos = curve.getPointAt(p.t);
      dummy.position.copy(pos);
      const scale = 0.5 + Math.sin(p.t * Math.PI) * 0.5;
      dummy.scale.setScalar(0.03 + scale * 0.04);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function FloatingCommand({ text, color, pos }: { text: string; color: string; pos: [number, number, number] }) {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={pos}>
        {/* Glass backing */}
        <mesh>
          <planeGeometry args={[text.length * 0.35 + 0.3, 0.7]} />
          <meshPhysicalMaterial
            color="#0f172a"
            transparent
            opacity={0.4}
            roughness={0.2}
            metalness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Text
          fontSize={0.35}
          color={color}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/geistmono/v1/or3nQ6P12-Y9XqYLvP_kVbWR_8K8.woff2"
          letterSpacing={0.05}
        >
          {text}
        </Text>
        {/* Glow ring */}
        <mesh>
          <ringGeometry args={[text.length * 0.2 + 0.1, text.length * 0.2 + 0.15, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>
  );
}

function MouseCamera() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(0, 0, 5));

  useMemo(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(() => {
    target.current.x = mouse.current.x * 0.8;
    target.current.y = mouse.current.y * 0.6;
    camera.position.x += (target.current.x - camera.position.x) * 0.02;
    camera.position.y += (target.current.y - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -2);
  });

  return null;
}

function Scene() {
  const streams = useMemo<StreamConfig[]>(() => {
    const colors = ["#22d3ee", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];
    return colors.map((color, i) => ({
      curve: createStreamPath(i * 1.2 - 3, i * 0.8 - 2, i * 0.5 - 1),
      color,
      speed: 0.8 + Math.random() * 0.4,
      count: 40,
      tubeRadius: 0.06,
    }));
  }, []);

  return (
    <>
      <MouseCamera />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#22d3ee" />
      <pointLight position={[-5, -3, 2]} intensity={0.8} color="#fbbf24" />
      <pointLight position={[0, 4, -4]} intensity={0.6} color="#a78bfa" />
      <pointLight position={[-4, 2, -2]} intensity={0.5} color="#34d399" />

      {streams.map((s, i) => (
        <group key={i}>
          <PipelineTube curve={s.curve} radius={s.tubeRadius} />
          <ParticleStream
            curve={s.curve}
            color={s.color}
            speed={s.speed}
            count={s.count}
          />
        </group>
      ))}

      {COMMANDS.map((cmd) => (
        <FloatingCommand
          key={cmd.text}
          text={cmd.text}
          color={cmd.color}
          pos={cmd.pos as [number, number, number]}
        />
      ))}

      {/* Central core node */}
      <mesh>
        <icosahedronGeometry args={[0.4, 2]} />
        <meshPhysicalMaterial
          color="#0f172a"
          emissive="#22d3ee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </>
  );
}

export function LoginScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#020617"));
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
