import type { CSSProperties } from "react";

const SPOTS = [
  { x: 18, y: 18, d: 0, c: "#ff5f9e" },
  { x: 80, y: 14, d: 380, c: "#ffc93c" },
  { x: 50, y: 8, d: 760, c: "#5fd2ff" },
  { x: 26, y: 34, d: 1140, c: "#6fe05a" },
  { x: 74, y: 32, d: 1520, c: "#c26bff" },
];

/** CSS-only fireworks behind a celebration screen (repeats a few times). */
export function Fireworks() {
  return (
    <div className="pj-fireworks" aria-hidden="true">
      {SPOTS.map((s, i) => (
        <span
          key={i}
          className="pj-fw"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              ["--c" as string]: s.c,
              animationDelay: `${s.d}ms`,
            } as CSSProperties
          }
        >
          {Array.from({ length: 16 }, (_, j) => (
            <i
              key={j}
              style={
                { ["--a" as string]: `${j * 22.5}deg`, animationDelay: `${s.d}ms` } as CSSProperties
              }
            />
          ))}
        </span>
      ))}
    </div>
  );
}
