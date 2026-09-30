"use client";

import { useEffect, useMemo } from "react";

export const BURST_DURATION_MS = 1700;
const FEATHER_COUNT = 22;

interface Particle {
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  scale: number;
}

export function QuantaBurst({
  x,
  y,
  reducedMotion,
  onDone,
  filter,
}: {
  x: number;
  y: number;
  reducedMotion: boolean;
  onDone: () => void;
  filter?: string;
}) {
  const feathers = useMemo<Particle[]>(
    () =>
      Array.from({ length: FEATHER_COUNT }, (_, index) => {
        const angle =
          (index / FEATHER_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const distance = 70 + Math.random() * 110;
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance * 0.8 - 40,
          rot: (Math.random() - 0.5) * 720,
          delay: Math.random() * 80,
          scale: 0.7 + Math.random() * 0.6,
        };
      }),
    []
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      onDone,
      reducedMotion ? 500 : BURST_DURATION_MS
    );
    return () => window.clearTimeout(timeout);
  }, [onDone, reducedMotion]);

  return (
    <div
      className="quanta-burst"
      style={{ transform: `translate(${x}px, ${y}px)`, filter }}
      aria-hidden="true"
    >
      <span className="quanta-burst-poof" />
      {!reducedMotion &&
        feathers.map((feather, index) => (
          <span
            key={index}
            className="quanta-burst-feather"
            style={
              {
                "--dx": `${feather.dx}px`,
                "--dy": `${feather.dy}px`,
                "--rot": `${feather.rot}deg`,
                "--scale": feather.scale,
                animationDelay: `${feather.delay}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      {!reducedMotion && (
        <>
          <span
            className="quanta-burst-eye"
            style={{ "--dx": "-58px" } as React.CSSProperties}
          />
          <span
            className="quanta-burst-eye"
            style={
              { "--dx": "54px", animationDelay: "40ms" } as React.CSSProperties
            }
          />
        </>
      )}
    </div>
  );
}
