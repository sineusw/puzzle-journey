/**
 * Calm jungle ambience behind the game: drifting fireflies, falling leaves,
 * a couple of butterflies and swaying fronds. Pure CSS animation of
 * transform/opacity (compositor-only), so it costs almost nothing, and it
 * stops for players who prefer reduced motion.
 */

import { memo, type CSSProperties } from "react";

// Fixed pseudo-random layout so it never changes between renders.
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const FIREFLIES = Array.from({ length: 12 }, (_, i) => ({
  left: `${4 + rand(i + 1) * 92}%`,
  top: `${10 + rand(i + 31) * 82}%`,
  dx: `${(rand(i + 61) - 0.5) * 60}px`,
  dy: `${-20 - rand(i + 91) * 50}px`,
  dur: `${7 + rand(i + 121) * 7}s`,
  blink: `${2 + rand(i + 151) * 2.5}s`,
  delay: `${-rand(i + 181) * 10}s`,
  size: `${3 + rand(i + 211) * 3}px`,
}));

const LEAVES = Array.from({ length: 5 }, (_, i) => ({
  left: `${rand(i + 7) * 90}%`,
  dur: `${14 + rand(i + 17) * 10}s`,
  delay: `${-rand(i + 27) * 24}s`,
  drift: `${40 + rand(i + 37) * 80}px`,
  hue: i % 3,
  scale: 0.7 + rand(i + 47) * 0.6,
}));

const LEAF_COLORS = ["#5fbf6a", "#9ccf4e", "#3d9a63"];

function Leaf({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M3 21C3 11 9 4 21 3c-1 12-8 18-18 18Z" fill={color} />
      <path d="M4 20 18 6" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function Butterfly({ color }: { color: string }) {
  // Each wing is its own element so the flap is a compositor-only transform.
  return (
    <span className="pj-bfly-body">
      <span className="pj-wing pj-wing-l">
        <svg viewBox="0 0 20 30" width="13" height="20" aria-hidden="true">
          <path d="M20 15C14 2 2 2 4 12c1 5 8 6 16 3Z" fill={color} />
          <path d="M20 16C12 18 6 24 10 27c4 2 8-4 10-11Z" fill={color} opacity="0.8" />
        </svg>
      </span>
      <span className="pj-wing pj-wing-r">
        <svg viewBox="20 0 20 30" width="13" height="20" aria-hidden="true">
          <path d="M20 15C26 2 38 2 36 12c-1 5-8 6-16 3Z" fill={color} />
          <path d="M20 16C28 18 34 24 30 27c-4 2-8-4-10-11Z" fill={color} opacity="0.8" />
        </svg>
      </span>
    </span>
  );
}

function Frond({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 120" width="160" height="120" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M0 6C50 4 110 24 156 80" stroke="#1f5a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        const x = 156 * t;
        const y = 6 + 74 * t * t;
        return <path key={i} d={`M${x} ${y}q${8 - i} ${22 + i * 2} ${-6 - i} ${34 + i * 2}`} stroke="#2f7d4f" strokeWidth="7" fill="none" strokeLinecap="round" opacity={0.95 - i * 0.04} />;
      })}
    </svg>
  );
}

export const JungleAmbience = memo(function JungleAmbience() {
  return (
    <div className="pj-ambient" aria-hidden="true" data-testid="ambient">
      <div className="pj-frond is-l">
        <Frond />
      </div>
      <div className="pj-frond is-r">
        <Frond flip />
      </div>
      {FIREFLIES.map((f, i) => (
        <span
          key={`f${i}`}
          className="pj-firefly"
          style={{ left: f.left, top: f.top, width: f.size, height: f.size, "--dx": f.dx, "--dy": f.dy, "--dur": f.dur, "--blink": f.blink, animationDelay: `${f.delay}, ${f.delay}` } as CSSProperties}
        />
      ))}
      {LEAVES.map((l, i) => (
        <span
          key={`l${i}`}
          className="pj-leaf"
          style={{ left: l.left, "--dur": l.dur, "--drift": l.drift, "--s": l.scale, animationDelay: l.delay } as CSSProperties}
        >
          <span className="pj-leaf-spin">
            <Leaf color={LEAF_COLORS[l.hue]!} />
          </span>
        </span>
      ))}
      <span className="pj-butterfly is-a">
        <Butterfly color="#ffb84a" />
      </span>
      <span className="pj-butterfly is-b">
        <Butterfly color="#7ad8ff" />
      </span>
    </div>
  );
});
