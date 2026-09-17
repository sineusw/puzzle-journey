import { useId } from "react";

export type CubeColor =
  | "cyan"
  | "lime"
  | "pink"
  | "amber"
  | "violet"
  | "orange"
  | "azure"
  | "stone"
  | "crate"
  | "wall";

export const CUBE: Record<CubeColor, { t: string; m: string; f: string; d: string; e: string }> = {
  cyan: { t: "#c4fcff", m: "#3ad4f4", f: "#1298c4", d: "#0b6e94", e: "#053e58" },
  lime: { t: "#e8ff90", m: "#74ea32", f: "#2fb412", d: "#1c8010", e: "#0e4808" },
  pink: { t: "#ffccf6", m: "#ff54cc", f: "#e01490", d: "#a01068", e: "#5c0838" },
  amber: { t: "#fff398", m: "#ffc62e", f: "#f09800", d: "#c07000", e: "#7a4800" },
  violet: { t: "#f4d0ff", m: "#c05cff", f: "#8a22e8", d: "#5c14b0", e: "#30086a" },
  orange: { t: "#ffdea0", m: "#ff8a2a", f: "#e05a10", d: "#a84008", e: "#642004" },
  azure: { t: "#d0e0ff", m: "#4d78ff", f: "#2a48d6", d: "#1a2e9c", e: "#0c1858" },
  stone: { t: "#eef2f6", m: "#a8b0bc", f: "#6e7684", d: "#484e58", e: "#262c34" },
  crate: { t: "#f4d8a8", m: "#c89450", f: "#8a5a28", d: "#624018", e: "#3a240c" },
  wall: { t: "#9aa2ac", m: "#4a5260", f: "#2a323c", d: "#1a2028", e: "#0a0e14" },
};

export function CubeMesh({ color }: { color: CubeColor }) {
  const id = useId().replace(/:/g, "");
  const p = CUBE[color] ?? CUBE.cyan;
  return (
    <svg viewBox="0 0 100 100" className="pj-cube-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.t} />
          <stop offset="42%" stopColor={p.m} />
          <stop offset="100%" stopColor={p.f} />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.f} />
          <stop offset="100%" stopColor={p.e} />
        </linearGradient>
        <linearGradient id={`${id}-left`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={p.e} />
          <stop offset="100%" stopColor={p.d} />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={p.e} />
          <stop offset="100%" stopColor={p.d} />
        </linearGradient>
        <clipPath id={`${id}-topclip`}>
          <rect x="5" y="3" width="90" height="74" rx="9" />
        </clipPath>
      </defs>
      <rect x="1.5" y="2" width="97" height="95.5" rx="11" fill={p.e} />
      <path d="M1.5 18 L5 8 H14 L5 22 V86 L1.5 90 Z" fill={`url(#${id}-left)`} />
      <path d="M98.5 18 L95 8 H86 L95 22 V86 L98.5 90 Z" fill={`url(#${id}-right)`} />
      <path d="M8 76 H92 C96 76 98.5 80 98.5 86 C98.5 93 93 97.5 86 97.5 H14 C7 97.5 1.5 93 1.5 86 C1.5 80 4 76 8 76 Z" fill={`url(#${id}-front)`} />
      <rect x="5" y="3" width="90" height="74" rx="9" fill={`url(#${id}-top)`} />
      <g clipPath={`url(#${id}-topclip)`}>
        <path d="M5 18 L14 3 H20 L5 22 Z" fill="#fff" opacity="0.14" />
        <path d="M95 18 L86 3 H80 L95 22 Z" fill="#000" opacity="0.2" />
        <rect x="5" y="68" width="90" height="10" fill="#000" opacity="0.12" />
      </g>
      <rect x="7" y="76" width="86" height="2.2" fill={p.e} opacity="0.55" />
      <path d="M18 6.2 H82" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" opacity="0.55" />
      <ellipse cx="28" cy="16" rx="10" ry="4.2" fill="#fff" opacity="0.34" />
    </svg>
  );
}
