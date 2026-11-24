import { useEffect, useRef, useState } from "react";
import { Lock, Play, Star } from "lucide-react";
import { ADVENTURE, UNLOCKS, WORLD_SIZE, goalLabel, worldOf } from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { SpecialFace } from "./tile-art";

/** X position (0–100%) of each island along the winding path. */
const LANE = [50, 74, 64, 34, 24, 44, 70, 76, 56, 30, 24, 46, 70, 74, 50];
const STEP = 132;
/** Extra room above each new world's banner. */
const WORLD_GAP = 56;
const yOf = (i: number) => 60 + i * STEP + Math.floor(i / WORLD_SIZE) * WORLD_GAP;
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

export function AdventureMap() {
  const unlocked = useGame((s) => s.profile.adventure.unlocked);
  const stars = useGame((s) => s.profile.adventure.stars);
  const startAdventure = useGame((s) => s.startAdventure);
  const current = Math.min(unlocked, ADVENTURE.length);
  const [sel, setSel] = useState(current);
  const wrap = useRef<HTMLDivElement>(null);
  // Only islands near the view are drawn, so scrolling stays smooth with 300 of them.
  const [view, setView] = useState({ top: 0, h: 700 });
  const raf = useRef<number | null>(null);
  const onScroll = () => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const box = wrap.current;
      if (box) setView({ top: box.scrollTop, h: box.clientHeight });
    });
  };
  const total = Object.values(stars).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const box = wrap.current;
    if (box) {
      box.scrollTop = Math.max(0, yOf(current - 1) - box.clientHeight / 2);
      setView({ top: box.scrollTop, h: box.clientHeight });
    }
  }, [current]);

  const level = ADVENTURE.find((l) => l.id === sel) ?? ADVENTURE[0]!;
  const locked = level.id > unlocked;
  const h = yOf(ADVENTURE.length - 1) + 90;
  const pts = ADVENTURE.map((l, i) => ({ x: LANE[i % LANE.length]!, y: yOf(i) }));
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]!;
    const my = (prev.y + p.y) / 2;
    return `C ${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  });

  return (
    <div className="pj-advmap-wrap">
      <div className="pj-advmap-head">
        <span>
          <Star className="size-4 text-gold" fill="currentColor" /> {total} / {ADVENTURE.length * 3}
        </span>
        <span>{worldOf(current).name}</span>
      </div>
      <div ref={wrap} className="pj-advmap" onScroll={onScroll}>
        <div className="pj-advmap-inner" style={{ height: h }}>
          <svg className="pj-advmap-path" viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={path.join(" ")} className="is-bg" vectorEffect="non-scaling-stroke" />
            <path
              d={path.slice(0, Math.max(1, current)).join(" ")}
              className="is-done"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {ADVENTURE.map((l, i) => {
            const p = pts[i]!;
            if (p.y < view.top - 500 || p.y > view.top + view.h + 500) return null;
            const isLocked = l.id > unlocked;
            const isCurrent = l.id === current;
            const s = stars[String(l.id)] ?? 0;
            const [c1, c2] = BIOME[Math.floor(i / WORLD_SIZE) % BIOME.length]!;
            const intro = l.introduces ? UNLOCKS[l.introduces] : null;
            return (
              <button
                key={l.id}
                type="button"
                data-node={l.id}
                data-testid={`adv-${l.id}`}
                className={`pj-node${l.boss ? " is-boss" : ""}${isLocked ? " is-locked" : ""}${isCurrent ? " is-current" : ""}${sel === l.id ? " is-sel" : ""}`}
                style={{ left: `${p.x}%`, top: p.y, ["--c1" as string]: c1, ["--c2" as string]: c2 }}
                onClick={() => (sel === l.id && !isLocked ? startAdventure(l.id) : setSel(l.id))}
                aria-label={`Island ${l.id}, ${l.name}${isLocked ? ", locked" : ""}`}
              >
                {i % WORLD_SIZE === 0 ? <span className="pj-world-flag">World {Math.floor(i / WORLD_SIZE) + 1} · {worldOf(l.id).name}</span> : null}
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
                <span className="pj-node-name">{l.name}</span>
                {isCurrent ? <span className="pj-node-you">PLAY</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="pj-advcard" style={{ ["--c1" as string]: BIOME[worldOf(level.id).index % BIOME.length]![0], ["--c2" as string]: BIOME[worldOf(level.id).index % BIOME.length]![1] }}>
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
