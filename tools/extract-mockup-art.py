"""Cut the Block Journey game art out of the owner's approved mockup.

Source: attachments/block-journey-mockup.jpg (864x1547, the approved look).
Output: public/art/  — logo, board frame, and one texture per tile type.

Run:  python3 tools/extract-mockup-art.py
Needs Pillow + numpy. The logo cutout also needs `rembg` (pip install "rembg[cpu]");
without it the existing public/art/logo.webp is left untouched.
"""

from __future__ import annotations

import colorsys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "attachments" / "block-journey-mockup.jpg"
OUT = ROOT / "public" / "art"
TILE = 96  # output texture size (px)

# Gutter lines of the mockup's 8x8 grid, measured from the image.
XS = [55, 148.5, 242, 335.5, 429, 522.5, 616, 709.5, 803]
YS = [503, 595, 687, 779, 871, 963, 1055, 1146, 1238]

# Board frame: outer box and how far in the grid starts on each side.
FRAME_BOX = (10, 455, 850, 1286)

# (row, col) of a clean example of each tile in the mockup.
PICKS = {
    "cyan": (0, 0),
    "lime": (1, 2),
    "pink": (3, 3),
    "amber": (2, 5),
    "violet": (1, 7),
    "stone": (2, 1),
    "stone-cracked": (0, 7),
    "star-blue": (1, 5),
    "star-orange": (5, 4),
    "star-purple": (7, 6),
    "empty": (0, 2),
}


def cell(im: Image.Image, r: int, c: int, pad: float = 1.5) -> Image.Image:
    box = (round(XS[c] + pad), round(YS[r] + pad), round(XS[c + 1] - pad), round(YS[r + 1] - pad))
    return im.crop(box).resize((TILE, TILE), Image.LANCZOS)


def rounded_alpha(img: Image.Image, radius: int) -> Image.Image:
    img = img.convert("RGBA")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius, fill=255)
    a = np.minimum(np.asarray(img.split()[3]), np.asarray(mask))
    img.putalpha(Image.fromarray(a))
    return img


def hue_shift(img: Image.Image, degrees: float, sat: float = 1.0) -> Image.Image:
    rgba = np.asarray(img.convert("RGBA")).astype(np.float32) / 255
    out = rgba.copy()
    flat = rgba[..., :3].reshape(-1, 3)
    shifted = np.array([colorsys.hsv_to_rgb(*_shift(colorsys.rgb_to_hsv(*p), degrees, sat)) for p in flat])
    out[..., :3] = shifted.reshape(rgba[..., :3].shape)
    return Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), "RGBA")


def _shift(hsv, degrees, sat):
    h, s, v = hsv
    return ((h + degrees / 360) % 1, min(1, s * sat), v)


def darken(img: Image.Image, k: float) -> Image.Image:
    arr = np.asarray(img).astype(np.float32)
    arr[..., :3] *= k
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA")


def save(img: Image.Image, name: str) -> None:
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=90, method=6)
    print("wrote", path.relative_to(ROOT), img.size)


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    tiles: dict[str, Image.Image] = {}
    for name, (r, c) in PICKS.items():
        # Empty wells keep square-ish corners; blocks get rounded so dragged
        # pieces don't show dark corner squares over the island background.
        radius = 10 if name == "empty" else 13
        tiles[name] = rounded_alpha(cell(im, r, c), radius)

    # Colors the mockup doesn't show, tinted from their nearest neighbour.
    tiles["orange"] = hue_shift(tiles["amber"], -16, 1.08)
    # Deeper royal blue like the tray piece, so it reads apart from cyan.
    tiles["azure"] = darken(hue_shift(tiles["cyan"], 14, 1.25), 0.86)
    tiles["star-green"] = hue_shift(tiles["star-blue"], -95)
    tiles["star-pink"] = hue_shift(tiles["star-purple"], 38)

    for name, img in tiles.items():
        save(img, f"tiles/{name}.webp")

    # Board frame: transparent outside the rounded stone and inside the grid.
    frame = im.crop(FRAME_BOX).convert("RGBA")
    frame = rounded_alpha(frame, 30)
    fx, fy = FRAME_BOX[0], FRAME_BOX[1]
    hole = Image.new("L", frame.size, 255)
    ImageDraw.Draw(hole).rounded_rectangle(
        (XS[0] - fx + 2, YS[0] - fy + 2, XS[-1] - fx - 2, YS[-1] - fy - 2), 10, fill=0
    )
    a = np.minimum(np.asarray(frame.split()[3]), np.asarray(hole))
    frame.putalpha(Image.fromarray(a))
    save(frame, "frame.webp")

    try:
        from rembg import new_session, remove
    except ImportError:
        print("rembg not installed: keeping existing logo.webp")
        return
    logo = remove(im.crop((70, 0, 800, 440)), session=new_session("u2net"))
    arr = np.asarray(logo).copy()
    arr[..., 3][arr[..., 3] < 24] = 0  # drop faint halo specks
    logo = Image.fromarray(arr, "RGBA")
    logo = logo.crop(logo.getbbox())
    save(logo, "logo.webp")


if __name__ == "__main__":
    main()


def clean_characters() -> None:
    """Drop stray slivers of neighbouring sprites from the character PNGs.

    Keeps the largest opaque region (the character) plus any region whose box
    overlaps it; separate fragments near the edges are cleared.
    """
    from scipy import ndimage

    for path in sorted((ROOT / "public" / "characters").glob("*-3d.png")):
        img = Image.open(path).convert("RGBA")
        arr = np.asarray(img).copy()
        solid = arr[..., 3] > 12
        labels, n = ndimage.label(solid)
        if n <= 1:
            continue
        sizes = ndimage.sum(solid, labels, range(1, n + 1))
        main = int(np.argmax(sizes)) + 1
        boxes = ndimage.find_objects(labels)
        my = boxes[main - 1]
        keep = np.zeros_like(solid)
        for i, box in enumerate(boxes, start=1):
            # Keep detached bits (a feather, a sparkle) only if they sit well
            # inside the character's box; edge slivers of neighbours go.
            inside = (
                box[0].start >= my[0].start
                and box[0].stop <= my[0].stop
                and box[1].start >= my[1].start + 12
                and box[1].stop <= my[1].stop - 12
            )
            if i == main or (inside and sizes[i - 1] > 40):
                keep |= labels == i
        removed = int(solid.sum() - keep.sum())
        if removed:
            arr[..., 3][~keep] = 0
            Image.fromarray(arr, "RGBA").save(path, optimize=True)
            print(f"cleaned {path.name}: cleared {removed} stray pixels")
