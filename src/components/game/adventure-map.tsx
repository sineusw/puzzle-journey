import { useEffect, useRef, useState } from "react";
import { Lock, Play, Star } from "lucide-react";
import { ADVENTURE, UNLOCKS, WORLD_SIZE, goalLabel, worldOf } from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { SpecialFace } from "./tile-art";
import * as audio from "@/lib/game/audio";

const BIOME: Array<[string, string]> = [
  ["#ffc93c", "#b8641a"],
  ["#5fd2ff", "#1a6fb8"],
  ["#6fe05a", "#1d7a3a"],
  ["#c26bff", "#5a1fa8"],
  ["#ff7a5c", "#a8281f"],
  ["#bfefff", "#3a7fb8"],
  ["#ff9a3c", "#7a3a12"],
  ["#9fb8ff", "#3a4fb8"],
];

/** Per-world scenery: sky/sea colors and the critters and props that float around the map. */
const THEME: Array<{ sky: [string, string, string]; decor: string[]; fx: "sun" | "bubbles" | "leaves" | "sparkle" | "embers" | "snow" | "stars" }> = [
  { sky: ["#58d6ff", "#1aa3d8", "#0b5fa0"], decor: ["🌴", "🐚", "🦀", "⛱️", "🐠", "🌴", "🐬", "⛵"], fx: "sun" },
  { sky: ["#2fd3c8", "#138ea8", "#08406e"], decor: ["🐠", "🐙", "🪸", "🐢", "🐡", "🪸", "🦑", "🐳"], fx: "bubbles" },
  { sky: ["#7be36a", "#2e9a4c", "#0f4a2c"], decor: ["🌿", "🦜", "🐒", "🌺", "🍌", "🌴", "🐸", "🦋"], fx: "leaves" },
  { sky: ["#b57bff", "#5b2aa8", "#1c0f45"], decor: ["💎", "🔮", "🦇", "💠", "🍄", "💎", "🕯️", "🪨"], fx: "sparkle" },
  { sky: ["#ff8a5c", "#b8301f", "#3a0d0d"], decor: ["🌋", "🔥", "🪨", "🦎", "🔥", "🐉", "🌶️", "🪨"], fx: "embers" },
  { sky: ["#d8f4ff", "#7cc2ea", "#2a5f9c"], decor: ["❄️", "🐧", "⛄", "🏔️", "🦭", "❄️", "🧊", "🐻‍❄️"], fx: "snow" },
  { sky: ["#3fa0d8", "#1b4f86", "#0b1f3f"], decor: ["🏴‍☠️", "⚓", "🦜", "💰", "🦈", "🗺️", "🦀", "⛵"], fx: "sun" },
  { sky: ["#ffd1ec", "#9cc8ff", "#4a6fd8"], decor: ["☁️", "🌈", "🕊️", "🏰", "🎈", "☁️", "🦄", "🪁"], fx: "sparkle" },
  { sky: ["#3a4f9c", "#1b2560", "#070b26"], decor: ["🌙", "⭐", "🦉", "🌸", "🪷", "✨", "🐸", "🌟"], fx: "stars" },
];
// Gaps between the rows of the trail where scenery can sit without covering an island or the path.
const DECOR_SLOTS: Array<[number, number, number]> = [
  [7, 96, 1], [93, 72, 1], [7, 53, 1.1], [93, 34, 1], [7, 16, 1.1], [50, 63, 0.8], [50, 26, 0.8], [93, 96, 0.9],
];
const JX = [-3, 4, -2, 3, -4, 2, 3, -3, 4, -2, 2, -4, 3, -2, 0];
const JY = [1, -3, 2, 3, -2, 1, -2, 3, -3, 2, -1, 3, -3, 1, 0];

/** Where island k (0-14) of a world sits on its page: a snake of 5 rows x 3 columns, in % of the map. */
function spot(k: number): { x: number; y: number } {
  const row = Math.floor(k / 3);
  const col = k % 3;
  const c = row % 2 === 0 ? col : 2 - col;
  return { x: 20 + c * 30 + (JX[k] ?? 0), y: 88 - row * 19 + (JY[k] ?? 0) };
}

export function AdventureMap() {
  const unlocked = useGame((s) => s.profile.adventure.unlocked);
  const stars = useGame((s) => s.profile.adventure.stars);
  const startAdventure = useGame((s) => s.startAdventure);
  const current = Math.min(unlocked, ADVENTURE.length);
  const [sel, setSel] = useState(current);
  // One world per page: big islands, no scrolling. Arrows flip between worlds.
  const worlds = Math.ceil(ADVENTURE.length / WORLD_SIZE);
  const [page, setPage] = useState(Math.floor((current - 1) / WORLD_SIZE));
  useEffect(() => setPage(Math.floor((current - 1) / WORLD_SIZE)), [current]);
  const total = Object.values(stars).reduce((a, b) => a + b, 0);
  const level = ADVENTURE.find((l) => l.id === sel) ?? ADVENTURE[0]!;
  const locked = level.id > unlocked;
  const isles = ADVENTURE.slice(page * WORLD_SIZE, page * WORLD_SIZE + WORLD_SIZE);
  const pts = isles.map((_, k) => spot(k));
  // Smooth winding trail (Catmull-Rom through every island), with a wide swing at each turn.
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]!;
    if (Math.abs(prev.y - p.y) > 10) {
      const mx = p.x < 50 ? Math.min(p.x, prev.x) - 13 : Math.max(p.x, prev.x) + 13;
      return `C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
    }
    const a = pts[i - 2] && Math.abs(pts[i - 2]!.y - prev.y) < 10 ? pts[i - 2]! : prev;
    const d = pts[i + 1] && Math.abs(pts[i + 1]!.y - p.y) < 10 ? pts[i + 1]! : p;
    return `C ${prev.x + (p.x - a.x) / 6} ${prev.y + (p.y - a.y) / 6}, ${p.x - (d.x - prev.x) / 6} ${p.y - (d.y - prev.y) / 6}, ${p.x} ${p.y}`;
  });
  const theme = THEME[page % THEME.length]!;
  const doneUpTo = Math.max(0, Math.min(isles.length, current - page * WORLD_SIZE));
  const [c1, c2] = BIOME[page % BIOME.length]!;
  // Juice: which way the world slid in, and a burst on the island just tapped.
  const [dir, setDir] = useState<0 | 1 | -1>(0);
  const [tap, setTap] = useState<{ id: number; n: number; bad: boolean } | null>(null);
  const tapIsle = (id: number, isLocked: boolean) => {
    setTap((t) => ({ id, n: (t?.n ?? 0) + 1, bad: isLocked }));
    if (isLocked) audio.feelNope();
    else {
      audio.sfxUi();
      audio.vibrate(12);
    }
    if (sel === id && !isLocked) startAdventure(id);
    else setSel(id);
  };
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);
  const swallowClick = useRef(false);
  const flip = (d: number) => {
    const next = Math.max(0, Math.min(worlds - 1, page + d));
    if (next !== page) {
      setDir(d > 0 ? 1 : -1);
      audio.sfxUi();
      audio.vibrate(18);
    }
    setPage(next);
    const first = ADVENTURE[next * WORLD_SIZE];
    if (first) setSel(Math.min(Math.max(first.id, Math.min(current, first.id + WORLD_SIZE - 1)), first.id + WORLD_SIZE - 1));
  };

  return (
    <div
      className="pj-advmap-wrap"
      onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY, t: Date.now() })}
      onPointerUp={(e) => {
        const st = swipe.current;
        swipe.current = null;
        if (!st) return;
        const dx = e.clientX - st.x;
        const dy = e.clientY - st.y;
        // A quick sideways swipe flips to the next / previous world.
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - st.t < 700) {
          swallowClick.current = true;
          window.setTimeout(() => (swallowClick.current = false), 50);
          flip(dx < 0 ? 1 : -1);
        }
      }}
      onClickCapture={(e) => {
        if (swallowClick.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      style={{ touchAction: "pan-y" }}
    >
      <div className="pj-advmap-head is-paged" style={{ ["--c1" as string]: c1, ["--c2" as string]: c2 }}>
        <button type="button" className="pj-world-arrow" onClick={() => flip(-1)} disabled={page === 0} aria-label="Previous world">‹</button>
        <div className="pj-world-title">
          <b>World {page + 1}</b>
          <span>{worldOf(isles[0]?.id ?? 1).name}</span>
        </div>
        <span className="pj-world-stars">
          <Star className="size-4 text-gold" fill="currentColor" /> {total}
        </span>
        <button type="button" className="pj-world-arrow" onClick={() => flip(1)} disabled={page >= worlds - 1} aria-label="Next world">›</button>
      </div>
      <div
        key={page}
        className={`pj-advmap is-paged is-scene fx-${theme.fx}${dir > 0 ? " slide-l" : dir < 0 ? " slide-r" : ""}`}
        style={{ ["--c1" as string]: c1, ["--c2" as string]: c2, ["--sky1" as string]: theme.sky[0], ["--sky2" as string]: theme.sky[1], ["--sky3" as string]: theme.sky[2] }}
      >
        <div className="pj-scene-waves" aria-hidden="true" />
        <div className="pj-scene-glow" aria-hidden="true" />
        <div className="pj-scene-cloud is-a" aria-hidden="true" />
        <div className="pj-scene-cloud is-b" aria-hidden="true" />
        <div className="pj-scene-motes" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-(i * 1.3) % 9}s`, animationDuration: `${7 + (i % 5) * 1.7}s` }} />
          ))}
        </div>
        {DECOR_SLOTS.map(([x, y, sc], i) => (
          <span
            key={`${page}-${i}`}
            className="pj-scene-decor"
            aria-hidden="true"
            style={{ left: `${x}%`, top: `${y}%`, ["--sc" as string]: sc, animationDelay: `${-i * 0.7}s` }}
          >
            {theme.decor[i % theme.decor.length]}
          </span>
        ))}
        <svg className="pj-advmap-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={path.join(" ")} className="is-road" vectorEffect="non-scaling-stroke" />
          <path d={path.join(" ")} className="is-bg" vectorEffect="non-scaling-stroke" />
          {doneUpTo > 1 ? <path d={path.slice(0, doneUpTo).join(" ")} className="is-done" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        <div className="pj-scene-shine" aria-hidden="true" />
        {isles.map((l, k) => {
          const p = pts[k]!;
          const isLocked = l.id > unlocked;
          const isCurrent = l.id === current;
          const s = stars[String(l.id)] ?? 0;
          const intro = l.introduces ? UNLOCKS[l.introduces] : null;
          return (
            <button
              key={l.id}
              type="button"
              data-node={l.id}
              data-testid={`adv-${l.id}`}
              className={`pj-node is-pop${tap?.id === l.id ? (tap.bad ? " is-nope" : " is-tapped") : ""}${l.boss ? " is-boss" : ""}${isLocked ? " is-locked" : ""}${isCurrent ? " is-current" : ""}${sel === l.id ? " is-sel" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, ["--c1" as string]: c1, ["--c2" as string]: c2, ["--i" as string]: k }}
              onClick={() => tapIsle(l.id, isLocked)}
              aria-label={`Island ${l.id}, ${l.name}${isLocked ? ", locked" : ""}`}
            >
              {l.boss ? <span className="pj-node-crown" aria-hidden="true">👑</span> : null}
              <span className="pj-node-disc">{isLocked ? <Lock className="size-5" /> : l.id}</span>
              {intro && !isLocked ? (
                <span className="pj-node-new" title={intro.name}>
                  {intro.kind === "visitor" ? <img src={intro.art} alt="" /> : intro.special ? <SpecialFace kind={intro.special} /> : <img src={intro.art} alt="" />}
                </span>
              ) : null}
              <span className="pj-node-stars" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <Star key={n} className={n <= s ? "is-on" : ""} fill={n <= s ? "currentColor" : "none"} />
                ))}
              </span>
              {isCurrent ? <span className="pj-node-rays" aria-hidden="true" /> : null}
              {isCurrent ? <span className="pj-node-ring" aria-hidden="true" /> : null}
              {tap?.id === l.id && !tap.bad ? (
                <span key={tap.n} className="pj-node-burst" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, j) => (
                    <i key={j} style={{ ["--a" as string]: `${j * 36}deg` }} />
                  ))}
                </span>
              ) : null}
              {isCurrent ? <span className="pj-node-you">▶ PLAY</span> : null}
              {l.boss ? <span className="pj-node-flag" aria-hidden="true">🚩</span> : null}
            </button>
          );
        })}
      </div>
      <div key={level.id} className="pj-advcard is-swap" style={{ ["--c1" as string]: BIOME[worldOf(level.id).index % BIOME.length]![0], ["--c2" as string]: BIOME[worldOf(level.id).index % BIOME.length]![1] }}>
        <div className="pj-advcard-top">
          <span className="pj-advcard-num">{level.id}</span>
          <div className="min-w-0 flex-1">
            <div className="pj-advcard-world">{worldOf(level.id).name}</div>
            <div className="pj-advcard-name">{level.name}</div>
          </div>
          <span className="pj-advcard-stars" aria-label={`${stars[String(level.id)] ?? 0} stars`}>
            {[1, 2, 3].map((n) => (
              <Star key={n} className={n <= (stars[String(level.id)] ?? 0) ? "is-on" : ""} fill={n <= (stars[String(level.id)] ?? 0) ? "currentColor" : "none"} />
            ))}
          </span>
        </div>
        <div className="pj-advcard-row">
          <div className="pj-advcard-goal">
            <span className="pj-advcard-label">Goal</span>
            <span className="pj-advcard-goaltext">
              {level.goal.type === "gems" ? <img src="/icons/gem.webp" alt="" /> : null}
              {goalLabel(level.goal)}
            </span>
          </div>
          <div className="pj-advcard-goal">
            <span className="pj-advcard-label">Reward</span>
            <span className="pj-advcard-reward">
              <img src="/icons/coin.webp" alt="" /> {level.reward.coins}
              <img src="/icons/gem.webp" alt="" /> {level.reward.gems}
            </span>
          </div>
        </div>
        {level.introduces ? <div className="pj-new-chip pj-advcard-new">✨ New here: {UNLOCKS[level.introduces].name}</div> : null}
        <button type="button" className="pj-advcard-play" disabled={locked} onClick={() => startAdventure(level.id)}>
          {locked ? <Lock className="size-5" /> : <Play className="size-6" fill="currentColor" />}
          <span>{locked ? `Beat island ${level.id - 1} to unlock` : (stars[String(level.id)] ?? 0) ? "Play again" : "Play"}</span>
        </button>
      </div>
    </div>
  );
}
