"""
Cut each Island Visitor's art into animatable parts (head, arms/wings, legs)
plus a body layer whose holes are painted in, so limbs can rotate around
their joints without showing gaps.

Output: public/characters/rig/<id>-<part>.webp (full-canvas layers, so they
stack exactly) and src/components/game/visitors/rig.ts (pivots, order).

Coordinates below are percentages of the image (x, y), read off a 5% grid.
Run: python3 tools/rig-characters.py
"""

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "characters"
OUT = SRC / "rig"
OUT.mkdir(exist_ok=True)

# part: (polygon in %, pivot in %, kind)
RIGS = {
    "milo": {
        "legL": ([(24, 82), (52, 82), (52, 100), (24, 100)], (40, 82), "leg"),
        "legR": ([(53, 82), (90, 82), (90, 100), (53, 100)], (66, 82), "leg"),
        "armL": ([(32, 59), (58, 59), (59, 75), (48, 79), (32, 75)], (55, 72), "arm"),
        "armR": ([(78, 61), (97, 61), (98, 85), (80, 85)], (80, 64), "arm"),
        "head": ([(0, 0), (100, 0), (100, 59), (58, 59), (32, 59), (0, 59)], (60, 58), "head"),
    },
    "luna": {
        "legL": ([(38, 84), (63, 84), (63, 100), (38, 100)], (52, 84), "leg"),
        "legR": ([(64, 84), (92, 84), (92, 100), (64, 100)], (76, 84), "leg"),
        "armL": ([(10, 37), (38, 37), (40, 54), (45, 62), (46, 73), (30, 75), (25, 62), (10, 58)], (42, 66), "arm"),
        "armR": ([(78, 59), (100, 59), (100, 77), (80, 77)], (82, 66), "arm"),
        "head": ([(28, 8), (100, 8), (100, 59), (78, 59), (78, 61), (46, 61), (40, 54), (38, 37), (28, 37)], (62, 60), "head"),
    },
    "kai": {
        "legL": ([(26, 80), (55, 80), (55, 99), (26, 99)], (44, 80), "leg"),
        "legR": ([(55, 80), (88, 80), (88, 99), (55, 99)], (66, 80), "leg"),
        "armL": ([(22, 58), (45, 58), (47, 79), (24, 79)], (38, 61), "arm"),
        "armR": ([(87, 52), (100, 52), (100, 76), (76, 76), (74, 64), (81, 61)], (79, 64), "arm"),
        "head": ([(0, 0), (100, 0), (100, 52), (87, 52), (81, 61), (0, 61)], (50, 60), "head"),
    },
    "nia": {
        "legL": ([(34, 82), (59, 82), (59, 99), (34, 99)], (48, 82), "leg"),
        "legR": ([(59, 82), (90, 82), (90, 99), (59, 99)], (72, 82), "leg"),
        "armL": ([(33, 62), (49, 62), (51, 79), (35, 79)], (40, 64), "arm"),
        "armR": ([(84, 53), (100, 53), (100, 73), (84, 73), (79, 66)], (82, 64), "arm"),
        "head": ([(8, 0), (100, 0), (100, 53), (84, 53), (79, 63), (33, 63), (30, 79), (14, 79), (8, 50)], (56, 62), "head"),
    },
    "pip": {
        "legL": ([(25, 88), (46, 88), (46, 100), (25, 100)], (36, 88), "leg"),
        "legR": ([(48, 88), (74, 88), (74, 100), (48, 100)], (60, 88), "leg"),
        "armL": ([(0, 68), (33, 64), (37, 80), (29, 93), (0, 92)], (33, 72), "wing"),
        "armR": ([(84, 56), (100, 56), (100, 91), (74, 91), (70, 74), (80, 68)], (73, 74), "wing"),
        "head": ([(20, 20), (86, 20), (86, 56), (80, 68), (72, 70), (25, 70)], (50, 69), "head"),
    },
}

# Layer order from back to front.
ORDER = ["legL", "legR", "body", "armL", "head", "armR"]


def poly_px(poly, w, h):
    return [(x * w / 100, y * h / 100) for x, y in poly]


def main() -> None:
    meta = {}
    for cid, parts in RIGS.items():
        im = Image.open(SRC / f"{cid}-3d.png").convert("RGBA")
        w, h = im.size
        rgba = np.array(im)
        alpha = rgba[:, :, 3]
        cut_all = Image.new("L", (w, h), 0)
        layers = {}
        for name, (poly, pivot, kind) in parts.items():
            m = Image.new("L", (w, h), 0)
            ImageDraw.Draw(m).polygon(poly_px(poly, w, h), fill=255)
            # Parts claim their area in order, so they never overlap each other.
            m_np = np.minimum(np.array(m), 255 - np.array(cut_all))
            cut_all = Image.fromarray(np.maximum(np.array(cut_all), m_np))
            feather = Image.fromarray(m_np).filter(ImageFilter.GaussianBlur(0.8))
            layer = rgba.copy()
            layer[:, :, 3] = (alpha.astype(np.float32) * (np.array(feather) / 255.0)).astype(np.uint8)
            layers[name] = (layer, pivot, kind)
        # Body: everything else, with the cut-out areas painted in from the
        # surroundings (colour and alpha) so moving limbs never reveal holes.
        hole = np.array(cut_all.filter(ImageFilter.MaxFilter(5)))
        body = rgba.copy()
        body_alpha = alpha.copy()
        body_alpha[hole > 0] = 0
        rgb = np.ascontiguousarray(body[:, :, :3])
        # Inpaint only where the hole is surrounded by the figure.
        filled = cv2.inpaint(rgb, (hole > 0).astype(np.uint8), 9, cv2.INPAINT_TELEA)
        a_fill = cv2.inpaint(np.ascontiguousarray(body_alpha), (hole > 0).astype(np.uint8), 9, cv2.INPAINT_TELEA)
        # Keep the filled alpha only inside the original silhouette, shrunk a
        # touch so the patch hides behind the limbs' edges.
        inside = cv2.erode((alpha > 128).astype(np.uint8), np.ones((9, 9), np.uint8))
        # Fill only a patch around each joint: that's the only place a gap can
        # open when a limb turns. Elsewhere the part covers its own area.
        near = np.zeros((h, w), np.uint8)
        for name, (poly, pivot, kind) in parts.items():
            r = int(max(w, h) * (0.11 if kind == "head" else 0.09))
            cv2.circle(near, (int(pivot[0] * w / 100), int(pivot[1] * h / 100)), r, 1, -1)
        a_fill = np.where(hole > 0, np.minimum(a_fill, inside * near * 255), body_alpha)
        body[:, :, :3] = np.where((hole > 0)[:, :, None], filled, rgba[:, :, :3])
        body[:, :, 3] = a_fill
        layers["body"] = (body, (50, 100), "body")

        meta[cid] = {"w": w, "h": h, "parts": []}
        for name in ORDER:
            if name not in layers:
                continue
            layer, pivot, kind = layers[name]
            path = OUT / f"{cid}-{name}.webp"
            Image.fromarray(layer).save(path, "WEBP", quality=88, method=6)
            meta[cid]["parts"].append({"name": name, "kind": kind, "pivot": list(pivot), "src": f"/characters/rig/{cid}-{name}.webp"})
        print(cid, "ok", sum((OUT / f"{cid}-{n}.webp").stat().st_size for n in ORDER if n in layers) // 1024, "KB")
    ts = (
        "// Generated by tools/rig-characters.py: do not edit by hand.\n"
        "export type RigPart = { name: string; kind: \"leg\" | \"arm\" | \"wing\" | \"head\" | \"body\"; pivot: [number, number]; src: string };\n"
        "export const RIGS: Record<string, { w: number; h: number; parts: RigPart[] }> = "
        + json.dumps(meta, indent=1)
        + ";\n"
    )
    (ROOT / "src" / "components" / "game" / "visitors" / "rig.ts").write_text(ts)


if __name__ == "__main__":
    main()
