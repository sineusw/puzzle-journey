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
    <svg viewBox="0 0 32 32" className="pj-sp pj-sp-bomb" aria-hidden="true">
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
      <ellipse cx="15.3" cy="28.2" rx="10.6" ry="2.2" fill="#050208" opacity="0.5" />
      <circle cx="15.4" cy="18.2" r="11.8" fill="#0b0610" stroke="#8f6aa8" strokeWidth="1.7" />
      <circle cx="15.4" cy="18.2" r="10.5" fill={`url(#${id}-b)`} stroke="#e0b8f0" strokeWidth="0.55" />
      <path d="M8.7 13.2c2.5-4.5 8.6-6.2 13.1-2.9" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.25" />
      <ellipse cx="11.7" cy="13.7" rx="4" ry="2.4" fill="rgba(255,255,255,0.3)" />
      <rect x="12.5" y="5.6" width="6.2" height="4.2" rx="1" fill={`url(#${id}-c)`} stroke="#fff1bf" strokeWidth="0.65" />
      <path d="M18.7 7c3-3.1 6.8-2.4 7.6.4" fill="none" stroke="#d98822" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M26.5 3.1l1 2.3 2.4.95-2.4.95-1 2.3-1-2.3-2.4-.95 2.4-.95z" fill="#fff18a" stroke="#fffbd8" strokeWidth="0.5" />
      <circle cx="26.5" cy="6.35" r="1.25" fill="#ff9f20" opacity="0.8" />
    </svg>
  );
}

function ArrowFace({ dir }: { dir: "h" | "v" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 32 32"
      className="pj-sp pj-sp-arrow"
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
      <path d="M16 1.8 L29.5 16.3 H22.4 V30 H9.6 V16.3 H2.5 Z" fill="#16376f" stroke="#87d5ff" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16 3.4 L27.5 16 H20.7 V28.2 H11.3 V16 H4.5 Z" fill={`url(#${id}-a)`} stroke="#ffffff" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M16 4.8 L25.1 15.8 H19.2 V26.8 H16 Z" fill="#3976b9" opacity="0.44" />
      <path d="M15.8 4.3 L6.9 15.8 H11" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" opacity="0.92" />
      <path d="M13 27.3 V17.2" stroke="#fff" strokeWidth="1.15" strokeLinecap="round" opacity="0.58" />
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
    <svg viewBox="0 0 32 32" className="pj-sp is-fill pj-sp-stone" aria-hidden="true">
      <path d="M2.2 3.2 L16.2 2 L14.7 15.6 L2.7 14.3 Z" fill="#c4c9c5" stroke="#59615f" strokeWidth="0.65" />
      <path d="M16.2 2 L29.8 4.1 L28.4 16.3 L14.7 15.6 Z" fill="#969e9b" stroke="#4e5654" strokeWidth="0.65" />
      <path d="M2.7 14.3 L14.7 15.6 L13.2 29.8 L3.5 27.9 Z" fill="#858e8b" stroke="#454d4b" strokeWidth="0.65" />
      <path d="M14.7 15.6 L28.4 16.3 L27.7 29 L13.2 29.8 Z" fill="#adb3ae" stroke="#525a57" strokeWidth="0.65" />
      <path d="M4.2 5.2 L12.5 14.4 L7.4 22.2 L13.2 29.2" fill="none" stroke={heavy ? "#202625" : "#343b39"} strokeWidth={heavy ? 2 : 1.45} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 14.4 L21.8 11.8 L27.1 19.8" fill="none" stroke={heavy ? "#202625" : "#343b39"} strokeWidth={heavy ? 1.8 : 1.25} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.8 11.8 L19.9 4.2 M21.8 11.8 L27.7 8.3" fill="none" stroke="#343b39" strokeWidth="1.1" strokeLinecap="round" />
      {heavy ? <path d="M7.4 22.2 L18.8 21 L16.2 29.2 M18.8 21 L24.2 26.3" fill="none" stroke="#181d1c" strokeWidth="1.55" strokeLinecap="round" /> : null}
      <path d="M4.9 5.5 L14.4 4" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
      <path d="M17.8 3.9 L27.6 5.5" fill="none" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.28" />
      <path d="M25.2 23.5c-2.2-1-3.9-.2-5.2 1.2" fill="none" stroke="#6f8664" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
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
