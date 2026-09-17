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
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={p.t} />
          <stop offset="18%" stopColor={p.m} />
          <stop offset="72%" stopColor={p.f} />
          <stop offset="100%" stopColor={p.d} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.72" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-topclip`}>
          <rect x="7" y="5" width="86" height="70" rx="8" />
        </clipPath>
      </defs>
      {/* Deep silhouette and projected lower lip give the piece real thickness. */}
      <rect x="1.5" y="2" width="97" height="96" rx="12" fill={p.e} />
      <path d="M2 17 L8 6 H18 L7 22 V83 L2 91 Z" fill={`url(#${id}-left)`} />
      <path d="M98 17 L92 6 H82 L93 22 V83 L98 91 Z" fill={`url(#${id}-right)`} />
      <path d="M8 73 H92 C96 73 98 78 98 86 C98 94 92 98 84 98 H16 C8 98 2 94 2 86 C2 78 4 73 8 73 Z" fill={`url(#${id}-front)`} />

      {/* Bright bevel surrounding a recessed, jewel-like face. */}
      <rect x="5" y="3" width="90" height="74" rx="10" fill={`url(#${id}-top)`} />
      <path d="M15 7 H85 L92 14 V64 L84 73 H16 L8 65 V15 Z" fill={`url(#${id}-face)`} />
      <g clipPath={`url(#${id}-topclip)`}>
        <path d="M8 17 L17 7 H83 L91 15 L87 20 H15 Z" fill={`url(#${id}-shine)`} />
        <path d="M8 17 L16 8 V68 L8 64 Z" fill="#fff" opacity="0.14" />
        <path d="M92 17 L84 8 V68 L92 64 Z" fill="#000" opacity="0.18" />
        <path d="M14 65 H86 L82 72 H18 Z" fill="#000" opacity="0.2" />
      </g>
      <path d="M17 7.2 H83" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.68" />
      <path d="M14 10 L9.5 15 V61" fill="none" stroke="#fff" strokeWidth="1.25" strokeLinecap="round" opacity="0.4" />
      <path d="M10 75 H90" stroke={p.e} strokeWidth="2.8" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="31" cy="15" rx="11" ry="3.5" fill="#fff" opacity="0.22" />
      <path d="M14 94 H86" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.09" />
    </svg>
  );
}
