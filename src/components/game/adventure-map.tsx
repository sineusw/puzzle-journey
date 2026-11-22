import { useEffect, useRef, useState } from "react";
import { Lock, Play, Star } from "lucide-react";
import { ADVENTURE, UNLOCKS, goalLabel } from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { SpecialFace } from "./tile-art";

/** X position (0–100%) of each island along the winding path. */
const LANE = [50, 76, 62, 30, 22, 46, 74, 80, 54, 26, 20, 44, 72, 78, 50];
const STEP = 112;
const BIOME: Array<[string, string]> = [
  ["#5fd2ff", "#1a6fb8"],
  ["#6fe05a", "#1d7a3a"],
  ["#ffc93c", "#b8641a"],
  ["#c26bff", "#5a1fa8"],
  ["#ff7a5c", "#a8281f"],
];

export function AdventureMap() {
  const unlocked = useGame((s) => s.profile.adventure.unlocked);
  const stars = useGame((s) => s.profile.adventure.stars);
  const startAdventure = useGame((s) => s.startAdventure);
  const current = Math.min(unlocked, ADVENTURE.length);
  const [sel, setSel] = useState(current);
  const wrap = useRef<HTMLDivElement>(null);
  const total = Object.values(stars).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const box = wrap.current;
    if (box) box.scrollTop = Math.max(0, 50 + (current - 1) * STEP - box.clientHeight / 2);
  }, [current]);

  const level = ADVENTURE.find((l) => l.id === sel) ?? ADVENTURE[0]!;
  const locked = level.id > unlocked;
  const h = ADVENTURE.length * STEP + 40;
  const pts = ADVENTURE.map((l, i) => ({ x: LANE[i % LANE.length]!, y: 50 + i * STEP }));
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
        <span>
          Island {current} of {ADVENTURE.length}
        </span>
      </div>
      <div ref={wrap} className="pj-advmap">
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
            const isLocked = l.id > unlocked;
            const isCurrent = l.id === current;
            const s = stars[String(l.id)] ?? 0;
            const [c1, c2] = BIOME[Math.floor(i / 3) % BIOME.length]!;
            const intro = l.introduces ? UNLOCKS[l.introduces] : null;
            return (
              <button
                key={l.id}
                type="button"
                data-node={l.id}
                data-testid={`adv-${l.id}`}
                className={`pj-node${isLocked ? " is-locked" : ""}${isCurrent ? " is-current" : ""}${sel === l.id ? " is-sel" : ""}`}
                style={{ left: `${p.x}%`, top: p.y, ["--c1" as string]: c1, ["--c2" as string]: c2 }}
                onClick={() => (sel === l.id && !isLocked ? startAdventure(l.id) : setSel(l.id))}
                aria-label={`Island ${l.id}, ${l.name}${isLocked ? ", locked" : ""}`}
              >
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
      <div className="pj-advcard">
        <div className="min-w-0 flex-1">
          <div className="pj-advcard-name">
            {level.id}. {level.name}
            {level.introduces ? <span className="pj-new-chip ml-1.5">New: {UNLOCKS[level.introduces].name}</span> : null}
          </div>
          <div className="pj-advcard-goal">{goalLabel(level.goal)}</div>
          <div className="pj-advcard-reward">
            <img src="/icons/coin.webp" alt="" /> {level.reward.coins}
            <img src="/icons/gem.webp" alt="" /> {level.reward.gems}
          </div>
        </div>
        <button type="button" className="pj-advcard-play" disabled={locked} onClick={() => startAdventure(level.id)}>
          {locked ? <Lock className="size-5" /> : <Play className="size-6" fill="currentColor" />}
          <span>{locked ? "Locked" : (stars[String(level.id)] ?? 0) ? "Replay" : "Play"}</span>
        </button>
      </div>
    </div>
  );
}
