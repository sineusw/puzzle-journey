import type { Cell, CellPos, ColorId, SpecialId } from "../engine";

export const VISITOR_IDS = ["milo", "luna", "kai", "nia", "pip"] as const;
export type VisitorId = (typeof VISITOR_IDS)[number];

export type VisitorMood = "help" | "mischief";

export type VisitorAction =
  | { visitor: "milo"; kind: "move"; from: CellPos; to: CellPos; cell: Cell }
  | { visitor: "luna"; kind: "enchant"; at: CellPos; special: Exclude<SpecialId, "stone" | "blast"> }
  | { visitor: "kai"; kind: "build"; at: CellPos }
  | { visitor: "kai"; kind: "break"; at: CellPos }
  | { visitor: "nia"; kind: "rotate"; origin: CellPos; cells: Array<{ from: CellPos; to: CellPos; cell: Cell }> }
  | { visitor: "nia"; kind: "swap"; a: CellPos; b: CellPos; cellA: Cell; cellB: Cell }
  | { visitor: "pip"; kind: "recolor"; at: CellPos; from: ColorId; to: ColorId };

export type VisitorPhase = "warn" | "enter" | "act" | "commit" | "react" | "exit";

export type VisitorEvent = {
  id: number;
  visitor: VisitorId;
  action: VisitorAction;
  mood: VisitorMood;
  showName: boolean;
};

export const VISITOR_META: Record<
  VisitorId,
  { name: string; title: string; cue: string; side: "left" | "right" }
> = {
  milo: { name: "Milo", title: "the Monkey", cue: "A mischievous hop!", side: "left" },
  luna: { name: "Luna", title: "the Magician", cue: "Magic in the air…", side: "right" },
  kai: { name: "Kai", title: "the Builder", cue: "Hammer time.", side: "left" },
  nia: { name: "Nia", title: "the Explorer", cue: "A new path appears.", side: "right" },
  pip: { name: "Pip", title: "the Parrot", cue: "Wings on the wind!", side: "right" },
};
