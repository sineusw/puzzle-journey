import { cn } from "@/lib/utils";
import type { Cell, CellPos, ColorId, OverlayId, Piece, SpecialId } from "@/lib/game/engine";
import { CubeMesh, type CubeColor } from "./cube";
import { OverlayFace, SpecialFace } from "./tile-art";

export function colorOf(cell: Cell): CubeColor | ColorId | null {
  if (cell.t === "b" || cell.t === "s") return cell.c;
  if (cell.t === "k") return cell.kind === "wall" ? "wall" : cell.kind === "crate" ? "crate" : "stone";
  if (cell.t === "crate") return "crate";
  if (cell.t === "portal") return cell.hue;
  return null;
}

export function overlaysOf(cell: Cell): OverlayId[] {
  if (cell.t === "b" || cell.t === "s") return cell.ov ?? [];
  return [];
}

export function BlockFace({
  color,
  star,
  gold,
  cracked,
  ghost,
  flash,
  special,
  stoneHp,
  overlays,
  className,
}: {
  color: CubeColor;
  star?: boolean;
  gold?: boolean;
  cracked?: boolean;
  ghost?: boolean;
  flash?: boolean;
  special?: SpecialId;
  stoneHp?: 1 | 2;
  overlays?: OverlayId[];
  className?: string;
}) {
  const kind: SpecialId | undefined = special ?? (cracked || color === "stone" ? "stone" : undefined);
  const ov = overlays ?? [];
  return (
    <div
      className={cn("pj-cube", ghost && "is-ghost", flash && "is-flash", className)}
      data-c={color}
      data-sp={kind}
    >
      <CubeMesh color={color} />
      <div className="pj-cube-layers">
        {star && !kind ? <CrystalStar gold={gold} /> : null}
        {kind ? <SpecialFace kind={kind} hp={stoneHp} /> : null}
        {ov.map((o) => (
          <OverlayFace key={o} kind={o} />
        ))}
      </div>
    </div>
  );
}

function CrystalStar({ gold }: { gold?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={gold ? "pj-star is-gold" : "pj-star"} aria-hidden="true">
      <path
        d="M12 2.1l2.55 6.5 7.05.58-5.38 4.52 1.72 6.86L12 16.9l-5.94 3.66 1.72-6.86L2.4 9.18l7.05-.58z"
        fill="currentColor"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PieceGrid({
  piece,
  cell = 18,
  gap = 2,
  faded,
}: {
  piece: Piece;
  cell?: number;
  gap?: number;
  faded?: boolean;
}) {
  const rows = Math.max(...piece.cells.map((x) => x[0])) + 1;
  const cols = Math.max(...piece.cells.map((x) => x[1])) + 1;
  const map = new Map(piece.cells.map((pos, i) => [`${pos[0]}-${pos[1]}`, i]));
  return (
    <div
      className={cn("pj-mini", faded && "opacity-40")}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
        gridTemplateRows: `repeat(${rows}, ${cell}px)`,
        gap,
      }}
    >
      {Array.from({ length: rows * cols }, (_, n) => {
        const r = Math.floor(n / cols);
        const c = n % cols;
        const idx = map.get(`${r}-${c}`);
        if (idx === undefined) return <span key={n} />;
        const spec = piece.specialAt === idx ? piece.special ?? undefined : undefined;
        const color: CubeColor =
          spec === "stone"
            ? "stone"
            : spec === "bomb"
              ? "violet"
              : spec === "blast"
                ? "amber"
                : spec
                  ? "azure"
                  : piece.color;
        return (
          <BlockFace
            key={n}
            color={color}
            star={piece.starAt === idx && !spec}
            gold={piece.gold}
            cracked={spec === "stone"}
            special={spec ?? undefined}
            stoneHp={spec === "stone" ? 2 : undefined}
          />
        );
      })}
    </div>
  );
}

export function pieceSize(cells: CellPos[], cell: number, gap: number) {
  const rows = Math.max(...cells.map((x) => x[0])) + 1;
  const cols = Math.max(...cells.map((x) => x[1])) + 1;
  return {
    rows,
    cols,
    w: cols * cell + (cols - 1) * gap,
    h: rows * cell + (rows - 1) * gap,
  };
}
