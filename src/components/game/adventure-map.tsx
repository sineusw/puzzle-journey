import { useEffect, useState } from "react";
import { Lock, Play, Star } from "lucide-react";
import { ADVENTURE, UNLOCKS, WORLD_SIZE, goalLabel, worldOf } from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { SpecialFace } from "./tile-art";

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

/** Where island k (0-14) of a world sits on its page: a snake of 5 rows x 3 columns, in % of the map. */
function spot(k: number): { x: number; y: number } {
  const row = Math.floor(k / 3);
  const col = k % 3;
  const c = row % 2 === 0 ? col : 2 - col;
  return { x: 17 + c * 33, y: 90 - row * 20 };
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
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]!;
    if (prev.y === p.y) return `L ${p.x} ${p.y}`;
    const mx = p.x < 50 ? p.x - 12 : p.x + 12;
    return `C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
  });
  const doneUpTo = Math.max(0, Math.min(isles.length, current - page * WORLD_SIZE));
  const [c1, c2] = BIOME[page % BIOME.length]!;
  const flip = (d: number) => {
    const next = Math.max(0, Math.min(worlds - 1, page + d));
    setPage(next);
    const first = ADVENTURE[next * WORLD_SIZE];
    if (first) setSel(Math.min(Math.max(first.id, Math.min(current, first.id + WORLD_SIZE - 1)), first.id + WORLD_SIZE - 1));
  };

  return (
    <div className="pj-advmap-wrap">
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
      <div className="pj-advmap is-paged" style={{ ["--c1" as string]: c1, ["--c2" as string]: c2 }}>
        <svg className="pj-advmap-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={path.join(" ")} className="is-bg" vectorEffect="non-scaling-stroke" />
          {doneUpTo > 1 ? <path d={path.slice(0, doneUpTo).join(" ")} className="is-done" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
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
              className={`pj-node${l.boss ? " is-boss" : ""}${isLocked ? " is-locked" : ""}${isCurrent ? " is-current" : ""}${sel === l.id ? " is-sel" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, ["--c1" as string]: c1, ["--c2" as string]: c2 }}
              onClick={() => (sel === l.id && !isLocked ? startAdventure(l.id) : setSel(l.id))}
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
              {isCurrent ? <span className="pj-node-you">PLAY</span> : null}
            </button>
          );
        })}
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
