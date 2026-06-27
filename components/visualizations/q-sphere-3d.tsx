"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import type { QSpherePoint } from "@/lib/quantum-state";
import { phaseToColor } from "@/lib/quantum-state";

interface QSphereSceneProps {
  points: QSpherePoint[];
  blochVector: { x: number; y: number; z: number } | null;
  numQubits: number;
}

function WireframeSphere() {
  return (
    <Sphere args={[1, 36, 36]}>
      <meshBasicMaterial color="#484f58" wireframe transparent opacity={0.4} />
    </Sphere>
  );
}

function EquatorRing() {
  const ringPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(angle), 0, Math.sin(angle)]);
    }
    return pts;
  }, []);

  return <Line points={ringPoints} color="#484f58" lineWidth={1} />;
}

function StatePoint({ point }: { point: QSpherePoint }) {
  const color = phaseToColor(point.phase);
  const size = Math.max(0.05, point.amplitude * 0.2);

  return (
    <mesh position={[point.x * 0.95, point.y * 0.95, point.z * 0.95]}>
      <sphereGeometry args={[size, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.4}
      />
    </mesh>
  );
}

function BlochVector({
  vector,
}: {
  vector: { x: number; y: number; z: number };
}) {
  const linePoints = useMemo(
    (): [number, number, number][] => [
      [0, 0, 0],
      [vector.x * 0.95, vector.y * 0.95, vector.z * 0.95],
    ],
    [vector]
  );

  return (
    <group>
      <Line points={linePoints} color="#58a6ff" lineWidth={2} />
      <mesh
        position={[vector.x * 0.95, vector.y * 0.95, vector.z * 0.95]}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#58a6ff"
          emissive="#58a6ff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function Scene({ points, blochVector, numQubits }: QSphereSceneProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 4, 4]} intensity={0.9} />
      <directionalLight position={[-3, -2, -3]} intensity={0.25} />
      <WireframeSphere />
      <EquatorRing />
      <Line
        points={[
          [0, -1.15, 0],
          [0, 1.15, 0],
        ]}
        color="#388bfd"
        lineWidth={1}
        transparent
        opacity={0.45}
      />
      {numQubits === 1 && blochVector ? (
        <BlochVector vector={blochVector} />
      ) : (
        points.map((p) => <StatePoint key={p.label} point={p} />)
      )}
      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={3.5}
        autoRotate={points.length > 0 || !!blochVector}
        autoRotateSpeed={0.8}
      />
    </>
  );
}

export function QSphere3D(props: QSphereSceneProps) {
  return (
    <Canvas
      camera={{ position: [1.8, 1.2, 2.2], fov: 42 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
