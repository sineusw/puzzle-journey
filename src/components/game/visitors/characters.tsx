import type { VisitorId } from "@/lib/game/visitors";

export function VisitorSprite({
  id,
  pose = "idle",
}: {
  id: VisitorId;
  pose?: "idle" | "act" | "react";
}) {
  const bounce = pose === "act" ? "pj-vis-bob" : pose === "react" ? "pj-vis-cheer" : "pj-vis-idle";
  return (
    <div className={`pj-vis-sprite ${bounce}`} data-visitor={id} aria-hidden="true">
      {id === "milo" ? <Milo /> : id === "luna" ? <Luna /> : id === "kai" ? <Kai /> : id === "nia" ? <Nia /> : <Pip />}
    </div>
  );
}

function Milo() {
  return (
    <svg viewBox="0 0 72 88" className="pj-vis-svg">
      <ellipse cx="36" cy="82" rx="16" ry="4" fill="#000" opacity="0.28" />
      <path d="M54 48 C70 28 68 12 58 16 C64 28 58 42 50 48 Z" fill="#6a3a1c" />
      <ellipse cx="36" cy="52" rx="16" ry="20" fill="#8a4e28" />
      <ellipse cx="36" cy="58" rx="11" ry="12" fill="#e8c9a0" />
      <circle cx="22" cy="30" r="9" fill="#8a4e28" />
      <circle cx="50" cy="30" r="9" fill="#8a4e28" />
      <circle cx="22" cy="30" r="5.2" fill="#f0d2ae" />
      <circle cx="50" cy="30" r="5.2" fill="#f0d2ae" />
      <ellipse cx="36" cy="32" rx="14" ry="13" fill="#8a4e28" />
      <ellipse cx="36" cy="34" rx="11" ry="10" fill="#f0d2ae" />
      <circle cx="31" cy="33" r="2.1" fill="#24140c" />
      <circle cx="41" cy="33" r="2.1" fill="#24140c" />
      <ellipse cx="36" cy="38.5" rx="3.2" ry="2.2" fill="#c47848" />
      <path d="M32 42 Q36 45 40 42" fill="none" stroke="#6a3a1c" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="24" y="70" width="7" height="10" rx="3" fill="#6a3a1c" />
      <rect x="41" y="70" width="7" height="10" rx="3" fill="#6a3a1c" />
      <circle cx="18" cy="56" r="5" fill="#e8c9a0" />
      <circle cx="54" cy="56" r="5" fill="#e8c9a0" />
    </svg>
  );
}

function Luna() {
  return (
    <svg viewBox="0 0 72 88" className="pj-vis-svg">
      <ellipse cx="36" cy="82" rx="15" ry="4" fill="#000" opacity="0.28" />
      <path d="M22 22 L36 4 L50 22 Z" fill="#6c3ad4" />
      <circle cx="36" cy="8" r="4" fill="#f0c14a" />
      <ellipse cx="36" cy="30" rx="11" ry="11" fill="#f3d2b4" />
      <path d="M25 26 C28 16 44 16 47 26" fill="#3b1c7a" />
      <circle cx="32" cy="30" r="1.7" fill="#2a1848" />
      <circle cx="40" cy="30" r="1.7" fill="#2a1848" />
      <path d="M33 35 Q36 37 39 35" fill="none" stroke="#c07090" strokeWidth="1.2" />
      <path d="M22 42 L36 40 L50 42 L54 74 L18 74 Z" fill="#7b44e8" />
      <path d="M28 42 L36 54 L44 42" fill="#c9a6ff" opacity="0.7" />
      <rect x="54" y="20" width="3.4" height="36" rx="1.5" fill="#e8d48a" />
      <circle cx="55.7" cy="18" r="5.2" fill="#9ee7ff" />
      <circle cx="55.7" cy="18" r="2.4" fill="#fff" />
    </svg>
  );
}

function Kai() {
  return (
    <svg viewBox="0 0 72 88" className="pj-vis-svg">
      <ellipse cx="36" cy="82" rx="16" ry="4" fill="#000" opacity="0.28" />
      <ellipse cx="36" cy="28" rx="11" ry="11" fill="#e0b48a" />
      <path d="M24 24 C28 14 44 14 48 24 L46 22 L26 22 Z" fill="#c47838" />
      <rect x="22" y="18" width="28" height="6" rx="2" fill="#8a5420" />
      <circle cx="32" cy="28" r="1.7" fill="#2a1c10" />
      <circle cx="40" cy="28" r="1.7" fill="#2a1c10" />
      <path d="M33 33 Q36 35 39 33" fill="none" stroke="#8a5420" strokeWidth="1.2" />
      <path d="M22 40 L50 40 L54 72 L18 72 Z" fill="#3d7a4a" />
      <rect x="30" y="40" width="12" height="20" fill="#f0d9a4" opacity="0.35" />
      <rect x="52" y="34" width="5" height="22" rx="1.4" fill="#8a5420" />
      <rect x="46" y="30" width="18" height="8" rx="2" fill="#c0c6d0" />
      <rect x="20" y="72" width="12" height="8" rx="2" fill="#5a3a1c" />
      <rect x="40" y="72" width="12" height="8" rx="2" fill="#5a3a1c" />
    </svg>
  );
}

function Nia() {
  return (
    <svg viewBox="0 0 72 88" className="pj-vis-svg">
      <ellipse cx="36" cy="82" rx="15" ry="4" fill="#000" opacity="0.28" />
      <ellipse cx="36" cy="30" rx="11" ry="11" fill="#c47848" />
      <path d="M20 28 L36 12 L54 30 L48 30 C44 20 28 20 24 30 Z" fill="#d8a24a" />
      <rect x="20" y="28" width="34" height="5" rx="2" fill="#8a5a20" />
      <circle cx="32" cy="30" r="1.7" fill="#2a140c" />
      <circle cx="40" cy="30" r="1.7" fill="#2a140c" />
      <path d="M33 35 Q36 37 39 35" fill="none" stroke="#6a3418" strokeWidth="1.2" />
      <path d="M22 42 L50 42 L52 72 L20 72 Z" fill="#2f6f8a" />
      <rect x="48" y="48" width="14" height="10" rx="2" fill="#f0d9a4" />
      <circle cx="16" cy="50" r="7" fill="#c9a24a" stroke="#6a4a18" strokeWidth="1.4" />
      <path d="M16 44 L16 56 M10 50 L22 50" stroke="#6a4a18" strokeWidth="1.1" />
      <rect x="22" y="72" width="11" height="8" rx="2" fill="#3a2410" />
      <rect x="40" y="72" width="11" height="8" rx="2" fill="#3a2410" />
    </svg>
  );
}

function Pip() {
  return (
    <svg viewBox="0 0 72 88" className="pj-vis-svg">
      <ellipse cx="36" cy="78" rx="14" ry="4" fill="#000" opacity="0.25" />
      <ellipse cx="36" cy="48" rx="16" ry="18" fill="#2bb24a" />
      <ellipse cx="38" cy="50" rx="10" ry="12" fill="#f0c14a" />
      <circle cx="40" cy="30" r="12" fill="#2bb24a" />
      <circle cx="44" cy="28" r="3" fill="#fff" />
      <circle cx="45" cy="28" r="1.5" fill="#1a1a1a" />
      <path d="M50 30 L62 32 L50 36 Z" fill="#f0a020" />
      <path d="M20 46 C8 36 8 58 22 54" fill="#1f8a3a" />
      <path d="M20 50 C6 62 18 70 26 60" fill="#e24a4a" />
      <path d="M32 64 L28 78 L36 70 L44 78 L40 64" fill="#c47828" />
    </svg>
  );
}
