import { useId } from "react";
import type { OverlayId, SpecialId } from "@/lib/game/engine";

export function SpecialFace({ kind, hp }: { kind: SpecialId; hp?: 1 | 2 }) {
  if (kind === "bomb") return <BombFace />;
  if (kind === "rocketH") return <ArrowFace dir="h" />;
  if (kind === "rocketV") return <ArrowFace dir="v" />;
  if (kind === "blast") return <BlastFace />;
  return <StoneFace hp={hp ?? 2} />;
}

export function OverlayFace({ kind }: { kind: OverlayId }) {
  if (kind === "ice") return <IceOverlay />;
  if (kind === "chain") return <ChainOverlay />;
  if (kind === "vine") return <VineOverlay />;
  return <LockOverlay />;
}

export function PowerGlyph({ name }: { name: "hammer" | "refresh" | "bomb" | "freeze" }) {
  if (name === "hammer") return <HammerGlyph />;
  if (name === "refresh") return <ShuffleGlyph />;
  if (name === "bomb") return <BombGlyph />;
  return <FrostGlyph />;
}

function BombFace() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className="pj-sp" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-b`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#7a628c" />
          <stop offset="38%" stopColor="#3a2448" />
          <stop offset="100%" stopColor="#120814" />
        </radialGradient>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e6c0" />
          <stop offset="100%" stopColor="#a07838" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="29.2" rx="9" ry="1.6" fill="#000" opacity="0.28" />
      <circle cx="16" cy="18.4" r="11.4" fill={`url(#${id}-b)`} />
      <circle cx="16" cy="18.4" r="11.4" fill="none" stroke="#d4b07a" strokeWidth="1.05" />
      <ellipse cx="12.2" cy="14.2" rx="4.6" ry="2.8" fill="rgba(255,255,255,0.24)" />
      <rect x="13.1" y="6.2" width="5.8" height="3.4" rx="0.9" fill={`url(#${id}-c)`} stroke="#f0e0b0" strokeWidth="0.4" />
      <path d="M19 7.2c2.6-2.8 6-2.5 7.2.4" fill="none" stroke="#f0a030" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M26.6 4.4l.9 2 2.1.85-2.1.85-.9 2-.9-2-2.1-.85 2.1-.85z" fill="#ffe27a" stroke="#fff6c8" strokeWidth="0.35" />
    </svg>
  );
}

function ArrowFace({ dir }: { dir: "h" | "v" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 32 32"
      className="pj-sp"
      aria-hidden="true"
      style={{ transform: dir === "h" ? "rotate(90deg)" : undefined }}
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#d4eeff" />
          <stop offset="100%" stopColor="#6aa8e0" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.8 L28.2 16.6 H21.6 V29 H10.4 V16.6 H3.8 Z"
        fill={`url(#${id}-a)`}
        stroke="#f4fbff"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path d="M16 5.4 L25.2 16.6 H20.2 V27.2 H16 Z" fill="rgba(20,50,110,0.28)" />
      <path d="M16 5.2 L7.4 16.6 H11.6" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M16 3.6 V14" stroke="rgba(180,230,255,0.55)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function BlastFace() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className="pj-sp" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-g`} cx="42%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#fff6c8" />
          <stop offset="55%" stopColor="#ffcf4a" />
          <stop offset="100%" stopColor="#d88810" />
        </radialGradient>
      </defs>
      <path
        d="M16 2.8l1.8 8.2 8.5-1.6-5.7 6.4 6.8 5.3-8.4-1.3-1.9 8.3-2.8-7.9-8.4 1.2 5.5-6.6L3.8 9.4l8.5 1.6z"
        fill={`url(#${id}-g)`}
        stroke="#fff4c8"
        strokeWidth="1.05"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StoneFace({ hp }: { hp: 1 | 2 }) {
  const heavy = hp === 1;
  return (
    <svg viewBox="0 0 32 32" className="pj-sp is-fill" aria-hidden="true">
      <path d="M3 4.2 L16.6 2.8 15 16.4 3.4 15.2 Z" fill="rgba(255,255,255,0.18)" />
      <path d="M16.6 2.8 L29.2 5 28.4 17 15 16.4 Z" fill="rgba(20,24,32,0.18)" />
      <path d="M3.4 15.2 L15 16.4 13.8 29.2 4 27.6 Z" fill="rgba(20,24,32,0.22)" />
      <path d="M15 16.4 L28.4 17 27.4 29 13.8 29.2 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M6.6 5 L12.8 14.8 L7.2 23 L15 29.2" fill="none" stroke={heavy ? "#1a1e26" : "#2c323c"} strokeWidth={heavy ? 1.8 : 1.3} strokeLinecap="round" />
      <path d="M12.8 14.8 L22.6 12.2 L26.8 21.6" fill="none" stroke={heavy ? "#1a1e26" : "#2c323c"} strokeWidth={heavy ? 1.5 : 1.1} strokeLinecap="round" />
      <path d="M22.6 12.2 L20.6 5.2" fill="none" stroke="#2c323c" strokeWidth="1" strokeLinecap="round" />
      {heavy ? <path d="M9 19 L19 21 L16.8 28" fill="none" stroke="#14181e" strokeWidth="1.4" strokeLinecap="round" /> : null}
      <path d="M6.4 6.2 L15 4.8" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

function IceOverlay() {
  return (
    <svg viewBox="0 0 32 32" className="pj-sp is-fill" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="rgba(170,220,255,0.38)" stroke="rgba(230,248,255,0.7)" strokeWidth="1.2" />
      <path d="M8 7 L14 16 L9 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.1" />
      <path d="M18 6 L22 14" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" />
    </svg>
  );
}

function ChainOverlay() {
  return (
    <svg viewBox="0 0 32 32" className="pj-sp is-fill" aria-hidden="true">
      <rect x="4" y="12.2" width="24" height="3.4" rx="1.2" fill="#c8ccd4" stroke="#5a606c" strokeWidth="0.7" />
      <rect x="4" y="17.2" width="24" height="3.4" rx="1.2" fill="#a8acb4" stroke="#5a606c" strokeWidth="0.7" />
      <circle cx="16" cy="16.4" r="4.2" fill="#d8c48a" stroke="#6a5420" strokeWidth="0.9" />
      <rect x="14.6" y="14.2" width="2.8" height="6" rx="0.6" fill="#6a5420" />
    </svg>
  );
}

function VineOverlay() {
  return (
    <svg viewBox="0 0 32 32" className="pj-sp is-fill" aria-hidden="true">
      <path d="M6 26 C10 18 8 10 14 6 C18 14 22 12 26 8" fill="none" stroke="#2f8a3c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 14 C16 12 18 16 20 13" fill="none" stroke="#4cbc58" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LockOverlay() {
  return (
    <svg viewBox="0 0 32 32" className="pj-sp" aria-hidden="true">
      <rect x="9" y="14" width="14" height="11" rx="2" fill="#e0c46a" stroke="#6a4a10" strokeWidth="1" />
      <path d="M12 14 V11 C12 7.8 14.2 6 16 6 C17.8 6 20 7.8 20 11 V14" fill="none" stroke="#d8c48a" strokeWidth="2.2" />
      <circle cx="16" cy="19.2" r="1.6" fill="#4a3410" />
    </svg>
  );
}

function HammerGlyph() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className="pj-power-glyph" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd0e8" />
          <stop offset="45%" stopColor="#ff6aa8" />
          <stop offset="100%" stopColor="#b02868" />
        </linearGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0c48a" />
          <stop offset="100%" stopColor="#7a4a18" />
        </linearGradient>
      </defs>
      <rect x="14.4" y="9.5" width="4.4" height="18.2" rx="1.4" fill={`url(#${id}-w)`} transform="rotate(-30 16 19)" />
      <path d="M5.8 12.2 L22.2 5.2 25.2 12.2 8.6 19.2 Z" fill={`url(#${id}-h)`} stroke="#ffe0f0" strokeWidth="0.8" />
      <path d="M8 10.8 L21.2 5.6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.15" />
    </svg>
  );
}

function ShuffleGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="pj-power-glyph" aria-hidden="true">
      <path d="M8.4 10 H16.4 C19.8 10 21.4 12.8 24 16.4 L26.6 19.6" fill="none" stroke="#7dff9a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M21.8 16 L27.8 19.8 21.2 23 Z" fill="#c8ffd4" />
      <path d="M8.4 22 H16.4 C19.8 22 21.4 19.2 24 15.6 L26.6 12.4" fill="none" stroke="#2ecf62" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M21.8 16 L27.8 12.2 21.2 9 Z" fill="#4ae878" />
    </svg>
  );
}

function BombGlyph() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className="pj-power-glyph" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-b`} cx="34%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#6a5478" />
          <stop offset="50%" stopColor="#2a1c38" />
          <stop offset="100%" stopColor="#0c0814" />
        </radialGradient>
      </defs>
      <circle cx="15.2" cy="18.6" r="9.4" fill={`url(#${id}-b)`} stroke="#d4b07a" strokeWidth="1.05" />
      <ellipse cx="12.4" cy="15.2" rx="3.5" ry="2.1" fill="rgba(255,255,255,0.22)" />
      <rect x="12.6" y="8.2" width="5.2" height="2.8" rx="0.8" fill="#d8c090" />
      <path d="M17.8 8.8c2.2-2.3 5-2.1 6 .3" fill="none" stroke="#e8a040" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M24.4 6.1l.75 1.6 1.65.7-1.65.7-.75 1.6-.75-1.6-1.65-.7 1.65-.7z" fill="#ffe27a" />
    </svg>
  );
}

function FrostGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="pj-power-glyph" aria-hidden="true">
      <g stroke="#e8f8ff" strokeWidth="1.85" strokeLinecap="round" fill="none">
        <path d="M16 3.8 V28.2" />
        <path d="M4.8 16 H27.2" />
        <path d="M7.4 7.4 L24.6 24.6" />
        <path d="M24.6 7.4 L7.4 24.6" />
      </g>
      <g stroke="#8ee8ff" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M16 6.8 l-2.6 2.3 M16 6.8 l2.6 2.3" />
        <path d="M16 25.2 l-2.6-2.3 M16 25.2 l2.6-2.3" />
        <path d="M6.6 16 l2.3-2.6 M6.6 16 l2.3 2.6" />
        <path d="M25.4 16 l-2.3-2.6 M25.4 16 l-2.3 2.6" />
      </g>
      <circle cx="16" cy="16" r="2.15" fill="#f4ffff" />
    </svg>
  );
}
