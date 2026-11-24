import type { VisitorId } from "@/lib/game/visitors";

type VisitorPose = "idle" | "act" | "react";

export const CHARACTER_ART: Record<VisitorId, string> = {
  milo: "/characters/milo-3d.webp",
  luna: "/characters/luna-3d.webp",
  kai: "/characters/kai-3d.webp",
  nia: "/characters/nia-3d.webp",
  pip: "/characters/pip-3d.webp",
};

export function VisitorSprite({ id, pose = "idle" }: { id: VisitorId; pose?: VisitorPose }) {
  const motion = pose === "act" ? "pj-vis-bob" : pose === "react" ? "pj-vis-cheer" : "pj-vis-idle";
  return (
    <div className={`pj-vis-sprite ${motion}`} data-visitor={id} data-pose={pose} aria-hidden="true">
      <span className="pj-vis-aura" />
      <img
        className="pj-vis-character-art"
        src={CHARACTER_ART[id]}
        alt=""
        draggable={false}
        decoding="async"
      />
    </div>
  );
}
