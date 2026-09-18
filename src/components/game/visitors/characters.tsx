import { useId, type ReactNode } from "react";
import type { VisitorId } from "@/lib/game/visitors";

type VisitorPose = "idle" | "act" | "react";

export function VisitorSprite({ id, pose = "idle" }: { id: VisitorId; pose?: VisitorPose }) {
  const motion = pose === "act" ? "pj-vis-bob" : pose === "react" ? "pj-vis-cheer" : "pj-vis-idle";
  return (
    <div className={`pj-vis-sprite ${motion}`} data-visitor={id} data-pose={pose} aria-hidden="true">
      <span className="pj-vis-aura" />
      {id === "milo" ? <Milo /> : id === "luna" ? <Luna /> : id === "kai" ? <Kai /> : id === "nia" ? <Nia /> : <Pip />}
    </div>
  );
}

function Art({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 96 116" className="pj-vis-svg" aria-hidden="true">{children}</svg>;
}

function Milo() {
  const id = useId().replace(/:/g, "");
  return (
    <Art>
      <defs>
        <radialGradient id={`${id}-fur`} cx="32%" cy="22%" r="78%"><stop stopColor="#d58a48" /><stop offset=".52" stopColor="#8b4723" /><stop offset="1" stopColor="#4a2414" /></radialGradient>
        <radialGradient id={`${id}-skin`} cx="38%" cy="25%" r="75%"><stop stopColor="#fff0cb" /><stop offset=".56" stopColor="#e9bd84" /><stop offset="1" stopColor="#ad6f42" /></radialGradient>
        <linearGradient id={`${id}-vest`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#39c7e9" /><stop offset=".55" stopColor="#167cae" /><stop offset="1" stopColor="#0b3f70" /></linearGradient>
        <filter id={`${id}-soft`} x="-35%" y="-35%" width="170%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#080c18" floodOpacity=".68" /></filter>
      </defs>
      <ellipse className="pj-vis-floor-shadow" cx="48" cy="108" rx="25" ry="5.8" />
      <g filter={`url(#${id}-soft)`}>
        <path d="M72 70c22-8 22-33 10-35-8-1-11 8-5 12 5 4 7-5 3-7" fill="none" stroke={`url(#${id}-fur)`} strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="48" cy="76" rx="24" ry="29" fill={`url(#${id}-fur)`} stroke="#4a2414" strokeWidth="1.5" />
        <path d="M28 62c9-8 31-8 40 0l-4 28c-10 8-24 8-33 0z" fill={`url(#${id}-vest)`} stroke="#06385e" strokeWidth="1.4" />
        <path d="M47 59v36M34 63c5 2 8 2 13-1M60 63c-5 2-8 2-13-1" fill="none" stroke="#9eeeff" strokeWidth="1.4" opacity=".55" />
        <ellipse cx="21" cy="42" rx="12" ry="14" fill={`url(#${id}-fur)`} stroke="#4a2414" strokeWidth="1.4" />
        <ellipse cx="75" cy="42" rx="12" ry="14" fill={`url(#${id}-fur)`} stroke="#4a2414" strokeWidth="1.4" />
        <ellipse cx="21" cy="43" rx="6.5" ry="8" fill={`url(#${id}-skin)`} /><ellipse cx="75" cy="43" rx="6.5" ry="8" fill={`url(#${id}-skin)`} />
        <ellipse cx="48" cy="42" rx="28" ry="27" fill={`url(#${id}-fur)`} stroke="#4a2414" strokeWidth="1.6" />
        <path d="M31 41c0-14 9-22 17-22s17 8 17 22c0 15-8 24-17 24S31 56 31 41z" fill={`url(#${id}-skin)`} />
        <ellipse cx="48" cy="51" rx="16" ry="13" fill="#f2cf9a" opacity=".94" />
        <path d="M29 28c8-11 30-14 40 1-12-4-26-4-40-1z" fill="#6a331d" />
        <ellipse cx="40" cy="42" rx="4.4" ry="5.2" fill="#fff" /><ellipse cx="57" cy="42" rx="4.4" ry="5.2" fill="#fff" />
        <circle cx="41.2" cy="43" r="2.25" fill="#20120b" /><circle cx="55.8" cy="43" r="2.25" fill="#20120b" />
        <circle cx="40.4" cy="41.8" r=".8" fill="#fff" /><circle cx="55" cy="41.8" r=".8" fill="#fff" />
        <ellipse cx="48" cy="50" rx="4" ry="3" fill="#7e3b27" />
        <path d="M40 56c5 5 12 5 17 0" fill="#fff4da" stroke="#7e3b27" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M29 70c-10 1-16 9-13 16 2 5 8 4 11 1M67 70c10 1 16 9 13 16-2 5-8 4-11 1" fill="none" stroke={`url(#${id}-fur)`} strokeWidth="8" strokeLinecap="round" />
        <path d="M34 94l-3 10M62 94l3 10" stroke="#522817" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="29" cy="104" rx="9" ry="4.5" fill="#e4b97f" /><ellipse cx="67" cy="104" rx="9" ry="4.5" fill="#e4b97f" />
        <path d="M33 32c5-3 10-3 14-1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".2" />
      </g>
    </Art>
  );
}

function Luna() {
  const id = useId().replace(/:/g, "");
  return (
    <Art>
      <defs>
        <radialGradient id={`${id}-face`} cx="34%" cy="22%" r="75%"><stop stopColor="#fff4de" /><stop offset=".65" stopColor="#e9bda0" /><stop offset="1" stopColor="#a96366" /></radialGradient>
        <linearGradient id={`${id}-robe`} x1=".1" y1="0" x2=".9" y2="1"><stop stopColor="#d998ff" /><stop offset=".32" stopColor="#8a4ce8" /><stop offset=".75" stopColor="#4a239c" /><stop offset="1" stopColor="#25125e" /></linearGradient>
        <linearGradient id={`${id}-hat`} x1=".15" y1="0" x2=".8" y2="1"><stop stopColor="#b982ff" /><stop offset=".6" stopColor="#6232c7" /><stop offset="1" stopColor="#29115f" /></linearGradient>
        <filter id={`${id}-soft`} x="-35%" y="-35%" width="175%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#09071c" floodOpacity=".72" /></filter>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <ellipse className="pj-vis-floor-shadow" cx="47" cy="108" rx="25" ry="5.8" />
      <g filter={`url(#${id}-soft)`}>
        <path d="M24 52c-5 14-9 39-8 51h64c1-12-3-37-9-51-11-10-36-10-47 0z" fill={`url(#${id}-robe)`} stroke="#26105d" strokeWidth="1.7" />
        <path d="M47 50L34 98M49 51l14 47M35 60c9 6 18 6 27 0" fill="none" stroke="#e1bcff" strokeWidth="1.6" opacity=".38" />
        <path d="M17 102h62c-6 7-18 9-31 9s-25-2-31-9z" fill="#26105d" />
        <path d="M29 47c-12 4-18 18-12 23 4 4 10-2 14-9M67 47c10 3 15 12 15 20" fill="none" stroke={`url(#${id}-robe)`} strokeWidth="10" strokeLinecap="round" />
        <ellipse cx="48" cy="43" rx="21" ry="23" fill="#3b185f" />
        <ellipse cx="48" cy="42" rx="17" ry="19" fill={`url(#${id}-face)`} stroke="#925b75" strokeWidth="1.1" />
        <path d="M30 39c0-17 10-25 20-24 11 1 18 10 17 24-8-7-12-12-14-18-3 9-11 15-23 18z" fill="#281044" />
        <path d="M27 22L45 2c3-3 7-1 8 2l8 20z" fill={`url(#${id}-hat)`} stroke="#28105f" strokeWidth="1.5" />
        <path d="M19 24c12-4 42-4 57 1-4 8-51 8-57-1z" fill={`url(#${id}-hat)`} stroke="#27105c" strokeWidth="1.5" />
        <path d="M35 17c7-3 15-3 21-1" stroke="#f2d1ff" strokeWidth="2" strokeLinecap="round" opacity=".45" />
        <path d="M43 2l4-1 4 3-3 4z" fill="#ffe48a" filter={`url(#${id}-glow)`} />
        <ellipse cx="41" cy="43" rx="3.5" ry="4.3" fill="#fff" /><ellipse cx="56" cy="43" rx="3.5" ry="4.3" fill="#fff" />
        <circle cx="42" cy="43.7" r="1.8" fill="#392057" /><circle cx="55" cy="43.7" r="1.8" fill="#392057" />
        <path d="M43 51c4 3 8 3 11 0" fill="none" stroke="#a94f73" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M79 65L87 27" stroke="#d9bb78" strokeWidth="4" strokeLinecap="round" />
        <path d="M87 19l2.1 5.2 5.4 2.2-5.4 2.2-2.1 5.2-2.1-5.2-5.4-2.2 5.4-2.2z" fill="#b7f0ff" stroke="#fff" strokeWidth="1" filter={`url(#${id}-glow)`} />
        <circle cx="80" cy="66" r="4.5" fill={`url(#${id}-face)`} />
      </g>
    </Art>
  );
}

function Kai() {
  const id = useId().replace(/:/g, "");
  return (
    <Art>
      <defs>
        <radialGradient id={`${id}-face`} cx="34%" cy="24%" r="78%"><stop stopColor="#f7d7ac" /><stop offset=".6" stopColor="#cf905a" /><stop offset="1" stopColor="#884a2d" /></radialGradient>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6ee390" /><stop offset=".5" stopColor="#278c55" /><stop offset="1" stopColor="#0c4c34" /></linearGradient>
        <linearGradient id={`${id}-hat`} x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#ffe57b" /><stop offset=".55" stopColor="#f0a918" /><stop offset="1" stopColor="#9b5708" /></linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5f8ff" /><stop offset=".35" stopColor="#aeb8c6" /><stop offset="1" stopColor="#555f6e" /></linearGradient>
        <filter id={`${id}-soft`} x="-35%" y="-35%" width="180%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="2.3" floodColor="#07120c" floodOpacity=".72" /></filter>
      </defs>
      <ellipse className="pj-vis-floor-shadow" cx="47" cy="108" rx="27" ry="5.8" />
      <g filter={`url(#${id}-soft)`}>
        <path d="M26 58c-4 12-4 31-2 42h48c2-11 2-30-2-42-10-10-34-10-44 0z" fill={`url(#${id}-shirt)`} stroke="#0b4b31" strokeWidth="1.5" />
        <path d="M33 54l15 17 15-17M48 70v30" fill="none" stroke="#c9ffd5" strokeWidth="1.4" opacity=".4" />
        <path d="M25 67c-11 4-15 17-9 22 5 4 10-2 13-8M69 66c9 3 13 11 12 18" fill="none" stroke={`url(#${id}-face)`} strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="48" cy="42" rx="20" ry="22" fill={`url(#${id}-face)`} stroke="#784228" strokeWidth="1.25" />
        <path d="M31 35c2-16 31-18 35 0-10-5-25-5-35 0z" fill="#382417" />
        <path d="M28 28c1-13 10-21 20-21 11 0 19 8 21 21z" fill={`url(#${id}-hat)`} stroke="#8d5109" strokeWidth="1.4" />
        <path d="M22 28c10-3 43-3 52 1-6 7-46 7-52-1z" fill={`url(#${id}-hat)`} stroke="#895008" strokeWidth="1.4" />
        <path d="M36 12c7-4 16-3 22 1" stroke="#fff4b3" strokeWidth="2.2" strokeLinecap="round" opacity=".55" />
        <ellipse cx="41" cy="42" rx="3.2" ry="4" fill="#fff" /><ellipse cx="56" cy="42" rx="3.2" ry="4" fill="#fff" />
        <circle cx="41.7" cy="42.5" r="1.65" fill="#2d1b10" /><circle cx="55.3" cy="42.5" r="1.65" fill="#2d1b10" />
        <path d="M42 51c4 3 8 3 12 0" fill="none" stroke="#82482f" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M34 99l-2 7M62 99l2 7" stroke="#674127" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="30" cy="106" rx="10" ry="4" fill="#3f2b1e" /><ellipse cx="66" cy="106" rx="10" ry="4" fill="#3f2b1e" />
        <path d="M80 85L69 53" stroke="#7d4921" strokeWidth="4.6" strokeLinecap="round" />
        <path d="M58 48l23-8c5-2 8 10 3 12l-22 7z" fill={`url(#${id}-metal)`} stroke="#4f5964" strokeWidth="1.2" />
        <circle cx="80" cy="85" r="4.5" fill={`url(#${id}-face)`} />
      </g>
    </Art>
  );
}

function Nia() {
  const id = useId().replace(/:/g, "");
  return (
    <Art>
      <defs>
        <radialGradient id={`${id}-face`} cx="35%" cy="23%" r="76%"><stop stopColor="#f1bd8a" /><stop offset=".58" stopColor="#b9653e" /><stop offset="1" stopColor="#6e3528" /></radialGradient>
        <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5bd7e8" /><stop offset=".45" stopColor="#237da0" /><stop offset="1" stopColor="#0d405f" /></linearGradient>
        <linearGradient id={`${id}-hat`} x1=".1" y1="0" x2=".9" y2="1"><stop stopColor="#f3d17a" /><stop offset=".52" stopColor="#bf7b24" /><stop offset="1" stopColor="#754414" /></linearGradient>
        <radialGradient id={`${id}-glass`} cx="35%" cy="30%" r="72%"><stop stopColor="#d9fbff" /><stop offset=".45" stopColor="#59bcd3" /><stop offset="1" stopColor="#12495c" /></radialGradient>
        <filter id={`${id}-soft`} x="-35%" y="-35%" width="180%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="2.3" floodColor="#06111a" floodOpacity=".72" /></filter>
      </defs>
      <ellipse className="pj-vis-floor-shadow" cx="48" cy="108" rx="25" ry="5.8" />
      <g filter={`url(#${id}-soft)`}>
        <path d="M25 57c-5 12-5 32-3 43h52c2-12 1-31-4-43-10-10-35-10-45 0z" fill={`url(#${id}-coat)`} stroke="#0a405d" strokeWidth="1.6" />
        <path d="M39 53l9 13 10-13M48 65v35M29 76h12" fill="none" stroke="#b7f6ff" strokeWidth="1.4" opacity=".48" />
        <ellipse cx="48" cy="41" rx="20" ry="22" fill={`url(#${id}-face)`} stroke="#693326" strokeWidth="1.2" />
        <path d="M29 40c0-16 8-25 20-25 12 0 20 9 19 25-7-5-10-11-12-17-6 8-15 13-27 17z" fill="#301d24" />
        <path d="M28 26L45 8c2-2 5-2 7 0l18 18z" fill={`url(#${id}-hat)`} stroke="#704113" strokeWidth="1.4" />
        <path d="M17 27c16-5 46-5 62 0-8 7-53 8-62 0z" fill={`url(#${id}-hat)`} stroke="#704113" strokeWidth="1.4" />
        <path d="M35 17c8-4 17-4 25 0" stroke="#fff0ae" strokeWidth="2" strokeLinecap="round" opacity=".42" />
        <ellipse cx="41" cy="42" rx="3.3" ry="4" fill="#fff" /><ellipse cx="56" cy="42" rx="3.3" ry="4" fill="#fff" />
        <circle cx="41.7" cy="42.6" r="1.7" fill="#24151b" /><circle cx="55.3" cy="42.6" r="1.7" fill="#24151b" />
        <path d="M42 51c4 3 8 3 12 0" fill="none" stroke="#76392f" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M25 67c-11 3-15 13-11 18 4 5 10 1 14-5M70 67c8 1 13 8 14 15" fill="none" stroke={`url(#${id}-face)`} strokeWidth="9" strokeLinecap="round" />
        <circle cx="15" cy="85" r="11" fill="#d6a83a" stroke="#5d3914" strokeWidth="1.5" />
        <circle cx="15" cy="85" r="8" fill={`url(#${id}-glass)`} stroke="#fff3b1" strokeWidth="1" />
        <path d="M15 78l2 6-2 8-2-7z" fill="#ff635c" stroke="#fff" strokeWidth=".6" />
        <path d="M37 99l-2 7M61 99l2 7" stroke="#5b3425" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="33" cy="106" rx="10" ry="4" fill="#2e251f" /><ellipse cx="65" cy="106" rx="10" ry="4" fill="#2e251f" />
      </g>
    </Art>
  );
}

function Pip() {
  const id = useId().replace(/:/g, "");
  return (
    <Art>
      <defs>
        <radialGradient id={`${id}-green`} cx="30%" cy="20%" r="78%"><stop stopColor="#a8ff72" /><stop offset=".44" stopColor="#38c65a" /><stop offset="1" stopColor="#08723d" /></radialGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#29a8e8" /><stop offset=".5" stopColor="#1764bd" /><stop offset="1" stopColor="#26358f" /></linearGradient>
        <linearGradient id={`${id}-chest`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff28a" /><stop offset=".55" stopColor="#f1bd2f" /><stop offset="1" stopColor="#d57217" /></linearGradient>
        <linearGradient id={`${id}-beak`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff070" /><stop offset=".55" stopColor="#f59a19" /><stop offset="1" stopColor="#bd4612" /></linearGradient>
        <filter id={`${id}-soft`} x="-40%" y="-40%" width="190%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#06140c" floodOpacity=".72" /></filter>
      </defs>
      <ellipse className="pj-vis-floor-shadow" cx="48" cy="108" rx="23" ry="5.5" />
      <g filter={`url(#${id}-soft)`}>
        <path d="M30 74c-17 5-24 19-18 24 5 4 13-5 22-11" fill={`url(#${id}-wing)`} stroke="#183b88" strokeWidth="1.4" />
        <path d="M66 74c17 5 24 19 18 24-5 4-13-5-22-11" fill={`url(#${id}-wing)`} stroke="#183b88" strokeWidth="1.4" />
        <path d="M37 88l-8 20 18-13 3 14 10-18z" fill="#e84e48" stroke="#75211f" strokeWidth="1.4" />
        <ellipse cx="48" cy="71" rx="24" ry="30" fill={`url(#${id}-green)`} stroke="#086439" strokeWidth="1.5" />
        <ellipse cx="49" cy="76" rx="16" ry="22" fill={`url(#${id}-chest)`} opacity=".94" />
        <ellipse cx="48" cy="40" rx="23" ry="22" fill={`url(#${id}-green)`} stroke="#086439" strokeWidth="1.5" />
        <path d="M29 34c5-15 26-23 38-8-13-5-26-2-38 8z" fill="#54df62" opacity=".8" />
        <ellipse cx="40" cy="40" rx="7" ry="8" fill="#fff" /><ellipse cx="57" cy="40" rx="7" ry="8" fill="#fff" />
        <circle cx="42" cy="41" r="3.3" fill="#142219" /><circle cx="55" cy="41" r="3.3" fill="#142219" />
        <circle cx="41" cy="39.5" r="1.1" fill="#fff" /><circle cx="54" cy="39.5" r="1.1" fill="#fff" />
        <path d="M47 44c8-5 18-4 25 2-7 8-17 10-25 5z" fill={`url(#${id}-beak)`} stroke="#9d4312" strokeWidth="1.3" />
        <path d="M48 48c8 1 15 0 21-2" fill="none" stroke="#8e3912" strokeWidth="1" />
        <path d="M20 80c7 0 12 4 17 10M76 80c-7 0-12 4-17 10" fill="none" stroke="#7eeeff" strokeWidth="2" opacity=".4" />
        <path d="M42 98l-2 8M56 98l2 8" stroke="#9d5b1c" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 107h12M52 107h12" stroke="#d88927" strokeWidth="3" strokeLinecap="round" />
      </g>
    </Art>
  );
}
