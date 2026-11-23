"""Build the block-skin tile sets from the base tiles in public/art/tiles.

Each skin gets its own folder (public/art/tiles/<skin>/) with the same file
names as the base set, so the game just swaps the folder. Colors stay
distinct in every skin (star blocks pop by color), only the material changes.

    python3 tools/make-skins.py
"""

from __future__ import annotations

import colorsys
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public" / "art" / "tiles"
SIZE = 128
COLORS = ["cyan", "azure", "lime", "pink", "amber", "orange", "violet"]
STARS = ["star-blue", "star-green", "star-orange", "star-pink", "star-purple"]
STAR_BASE = {"star-blue": "azure", "star-green": "lime", "star-orange": "amber", "star-pink": "pink", "star-purple": "violet"}

# Main hue (0-1) of each base color, read once from the base art.
def main_rgb(img: Image.Image) -> tuple[int, int, int]:
    a = np.asarray(img.convert("RGBA")).astype(float)
    h, w = a.shape[:2]
    core = a[h // 4 : h * 3 // 4, w // 4 : w * 3 // 4]
    m = core[..., 3] > 200
    rgb = core[..., :3][m].mean(axis=0)
    return tuple(int(x) for x in rgb)


def rounded_mask(size: int, radius: float, inset: float = 0) -> Image.Image:
    m = Image.new("L", (size * 4, size * 4), 0)
    d = ImageDraw.Draw(m)
    i = inset * 4
    d.rounded_rectangle([i, i, size * 4 - 1 - i, size * 4 - 1 - i], radius=radius * 4, fill=255)
    return m.resize((size, size), Image.LANCZOS)


def vgrad(size: int, top: tuple, bottom: tuple) -> Image.Image:
    t = np.linspace(0, 1, size)[:, None, None]
    a = np.array(top, float)[None, None, :] * (1 - t) + np.array(bottom, float)[None, None, :] * t
    a = np.repeat(a, size, axis=1)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA" if len(top) == 4 else "RGB")


def shade(rgb, k: float) -> tuple[int, int, int]:
    return tuple(int(max(0, min(255, c * k))) for c in rgb)


def mix(a, b, t: float):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def hsv(rgb, s_mul=1.0, v_mul=1.0, h_shift=0.0):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    r, g, b = colorsys.hsv_to_rgb((h + h_shift) % 1, min(1, s * s_mul), min(1, v * v_mul))
    return (int(r * 255), int(g * 255), int(b * 255))


def bevel_tile(face_top, face_bot, rim, lip, gloss=0.45, radius=20) -> Image.Image:
    """A glossy rounded block: a darker lip at the bottom, the face on top."""
    s = SIZE
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    # lip (the block's thickness)
    lip_img = Image.new("RGBA", (s, s), lip + (255,))
    out.paste(lip_img, (0, 0), rounded_mask(s, radius))
    # rim
    rim_img = Image.new("RGBA", (s, s), rim + (255,))
    rm = rounded_mask(s, radius - 2, 3)
    rm = rm.crop((0, 0, s, s - 10)).resize((s, s - 10))
    tmp = Image.new("L", (s, s), 0)
    tmp.paste(rm, (0, 0))
    out.paste(rim_img, (0, 0), tmp)
    # face
    face = vgrad(s, face_top + (255,), face_bot + (255,))
    fm = Image.new("L", (s, s), 0)
    fm.paste(rounded_mask(s - 20, radius - 6), (10, 8))
    fm = fm.crop((0, 0, s, s))
    out.paste(face, (0, 0), fm)
    # gloss band
    g = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(g)
    d.rounded_ellipse = None
    d.ellipse([16, 10, s - 30, 50], fill=int(255 * gloss))
    g = g.filter(ImageFilter.GaussianBlur(7))
    white = Image.new("RGBA", (s, s), (255, 255, 255, 255))
    out.paste(white, (0, 0), Image.fromarray((np.asarray(g) * (np.asarray(fm) / 255)).astype(np.uint8)))
    return out


def star_glyph(rgb) -> Image.Image:
    s = SIZE
    cx, cy = s / 2, s / 2 - 5
    pts = []
    for k in range(10):
        r = 38 if k % 2 == 0 else 16
        a = -math.pi / 2 + k * math.pi / 5
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(glow).polygon(pts, fill=hsv(rgb, 1.2, 1.3) + (255,))
    glow = glow.filter(ImageFilter.GaussianBlur(6))
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.alpha_composite(glow)
    d = ImageDraw.Draw(out)
    d.polygon(pts, fill=(255, 255, 255, 255), outline=shade(hsv(rgb, 1.2), 0.7) + (255,))
    inner = [(cx + (x - cx) * 0.55, cy + (y - cy) * 0.55) for x, y in pts]
    d.polygon(inner, fill=mix(hsv(rgb, 1.1, 1.2), (255, 255, 255), 0.45) + (255,))
    return out


def star_overlay(base_star: Image.Image, base_plain: Image.Image) -> Image.Image:
    """The star glyph from a base star tile (difference against its plain tile)."""
    a = np.asarray(base_star.convert("RGBA").resize((SIZE, SIZE), Image.LANCZOS)).astype(float)
    b = np.asarray(base_plain.convert("RGBA").resize((SIZE, SIZE), Image.LANCZOS)).astype(float)
    diff = np.abs(a[..., :3] - b[..., :3]).sum(axis=2)
    alpha = np.clip((diff - 40) * 2.2, 0, 255)
    lum = a[..., :3].mean(axis=2, keepdims=True)
    rgb = np.concatenate([lum, lum, lum], axis=2) * 0.25 + 255 * 0.75
    out = np.concatenate([rgb, alpha[..., None]], axis=2)
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGBA")


class Over:
    """ImageDraw on a transparent layer that is composited onto `img` on exit."""

    def __init__(self, img: Image.Image):
        self.img = img
        self.layer = Image.new("RGBA", img.size, (0, 0, 0, 0))

    def __enter__(self) -> ImageDraw.ImageDraw:
        return ImageDraw.Draw(self.layer)

    def __exit__(self, *_):
        self.img.alpha_composite(self.layer)


def sparkle(img: Image.Image, n: int, color=(255, 255, 255), seed=0, size=(1.5, 3.5), area=(14, 10, 114, 100)) -> None:
    rnd = random.Random(seed)
    with Over(img) as d:
        _sparkle(d, rnd, n, color, size, area)


def _sparkle(d, rnd, n, color, size, area) -> None:
    for _ in range(n):
        x = rnd.uniform(area[0], area[2])
        y = rnd.uniform(area[1], area[3])
        r = rnd.uniform(*size)
        a = rnd.randint(150, 255)
        d.line([x - r * 1.8, y, x + r * 1.8, y], fill=color + (a,), width=1)
        d.line([x, y - r * 1.8, x, y + r * 1.8], fill=color + (a,), width=1)
        d.ellipse([x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6], fill=color + (a,))


# ------------------------------------------------------------------ skins

def skin_ocean(rgb):  # Sea Glass: frosted, lighter, see-through edge
    face_t = mix(hsv(rgb, 1.0, 1.15), (255, 255, 255), 0.22)
    face_b = hsv(rgb, 1.05, 0.9)
    t = bevel_tile(face_t, face_b, mix(rgb, (255, 255, 255), 0.6), shade(hsv(rgb, 0.8), 0.6), gloss=0.7, radius=26)
    a = np.asarray(t).astype(float)
    a[..., 3] *= 0.93
    t = Image.fromarray(a.astype(np.uint8), "RGBA")
    with Over(t) as d:
        d.rounded_rectangle([12, 10, SIZE - 13, SIZE - 22], radius=18, outline=(255, 255, 255, 150), width=2)
    sparkle(t, 3, seed=hash(rgb) % 97, size=(1.2, 2.2))
    return t


def skin_candy(rgb):  # Candy Pop: pastel with sugar dots
    p = mix(hsv(rgb, 0.75, 1.2), (255, 255, 255), 0.42)
    t = bevel_tile(p, mix(hsv(rgb, 0.9), (255, 255, 255), 0.18), mix(p, (255, 255, 255), 0.5), shade(hsv(rgb, 0.9), 0.78), gloss=0.55, radius=30)
    rnd = random.Random(sum(rgb))
    with Over(t) as d:
        for _ in range(7):
            x, y = rnd.uniform(22, 104), rnd.uniform(30, 92)
            r = rnd.uniform(2.5, 4.5)
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 190))
    return t


def skin_sunset(rgb):  # Lava Glow: dark rock body, molten color seeping from cracks
    s = SIZE
    hot = hsv(rgb, 1.25, 1.2)
    t = bevel_tile(shade(hot, 0.55), shade(hot, 0.28), shade(hot, 0.9), (30, 14, 10), gloss=0.18, radius=18)
    glow = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(glow)
    rnd = random.Random(sum(rgb) * 7)
    for _ in range(4):
        x, y = rnd.uniform(20, 108), rnd.uniform(18, 96)
        pts = [(x, y)]
        for _ in range(4):
            x += rnd.uniform(-18, 18)
            y += rnd.uniform(-14, 14)
            pts.append((x, y))
        d.line(pts, fill=255, width=4, joint="curve")
    glow_b = glow.filter(ImageFilter.GaussianBlur(5))
    fm = Image.new("L", (s, s), 0)
    fm.paste(rounded_mask(s - 20, 12), (10, 8))
    g = np.minimum(np.asarray(glow_b).astype(float) * 1.6 + np.asarray(glow) * 0.8, 255) * (np.asarray(fm) / 255)
    bright = Image.new("RGBA", (s, s), mix(hot, (255, 240, 180), 0.45) + (255,))
    t.paste(bright, (0, 0), Image.fromarray(g.astype(np.uint8)))
    with Over(t) as d2:
        d2.rounded_rectangle([3, 2, s - 4, s - 12], radius=17, outline=hot + (230,), width=3)
    return t


def skin_frost(rgb):  # Frost Bite: icy crystal with frost speckle
    ice = mix(hsv(rgb, 1.0, 1.05), (225, 245, 255), 0.18)
    t = bevel_tile(mix(ice, (255, 255, 255), 0.22), shade(ice, 0.88), (235, 250, 255), shade(hsv(rgb, 0.7), 0.7), gloss=0.6, radius=14)
    rnd = random.Random(sum(rgb) * 3)
    with Over(t) as d:
        # crystal facets
        c = (SIZE / 2, SIZE / 2 - 6)
        pts = [(c[0] + math.cos(k * math.pi / 3 + 0.3) * 44, c[1] + math.sin(k * math.pi / 3 + 0.3) * 38) for k in range(6)]
        for k in range(6):
            d.polygon([c, pts[k], pts[(k + 1) % 6]], fill=(255, 255, 255, 18 + (k % 3) * 22))
        for _ in range(40):
            x, y = rnd.uniform(12, 116), rnd.uniform(10, 104)
            d.point((x, y), fill=(255, 255, 255, rnd.randint(120, 230)))
        d.rounded_rectangle([10, 8, SIZE - 11, SIZE - 20], radius=10, outline=(255, 255, 255, 210), width=2)
    return t


def skin_midnight(rgb):  # Neon Night: near-black body, glowing neon tube outline
    s = SIZE
    neon = hsv(rgb, 1.3, 1.3)
    t = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    body = bevel_tile(shade(neon, 0.28), shade(neon, 0.1), shade(neon, 0.35), (5, 4, 10), gloss=0.12, radius=20)
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([12, 10, s - 13, s - 22], radius=16, outline=neon + (255,), width=7)
    glow = glow.filter(ImageFilter.GaussianBlur(5))
    t.alpha_composite(body)
    t.alpha_composite(glow)
    with Over(t) as d:
        d.rounded_rectangle([13, 11, s - 14, s - 23], radius=15, outline=mix(neon, (255, 255, 255), 0.55) + (255,), width=3)
        d.rounded_rectangle([30, 28, s - 31, s - 40], radius=7, fill=neon + (70,))
    return t


def skin_royal(rgb):  # Royal Gems: cut jewel set in a gold frame
    s = SIZE
    gem = hsv(rgb, 1.15, 1.05)
    t = bevel_tile((255, 226, 130), (196, 140, 40), (255, 240, 180), (120, 76, 16), gloss=0.5, radius=16)
    ov = Over(t)
    d = ov.__enter__()
    x0, y0, x1, y1 = 22, 19, s - 23, s - 33
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    inset = 12
    # facets: center table + 4 trapezoids, each shaded differently
    table = [(x0 + inset, y0 + inset), (x1 - inset, y0 + inset), (x1 - inset, y1 - inset), (x0 + inset, y1 - inset)]
    facets = [
        ([(x0, y0), (x1, y0), table[1], table[0]], 1.35),
        ([(x1, y0), (x1, y1), table[2], table[1]], 0.85),
        ([(x1, y1), (x0, y1), table[3], table[2]], 0.6),
        ([(x0, y1), (x0, y0), table[0], table[3]], 1.1),
    ]
    for poly, k in facets:
        d.polygon(poly, fill=shade(gem, k) + (255,))
    d.polygon(table, fill=shade(gem, 1.0) + (255,))
    d.polygon([table[0], ((table[0][0] + table[1][0]) / 2, table[0][1]), (table[0][0], (table[0][1] + table[3][1]) / 2)], fill=(255, 255, 255, 120))
    d.rectangle([x0, y0, x1, y1], outline=(255, 246, 200, 255), width=2)
    ov.__exit__()
    sparkle(t, 2, seed=sum(rgb), size=(2, 3), area=(x0 + 4, y0 + 2, x1 - 4, y0 + 20))
    return t


def skin_cosmic(rgb):  # Cosmic: galaxy swirl inside dark glass
    s = SIZE
    neb = hsv(rgb, 1.2, 1.15)
    t = bevel_tile((18, 14, 40), (6, 4, 18), shade(neb, 0.8), (4, 3, 12), gloss=0.35, radius=22)
    yy, xx = np.mgrid[0:s, 0:s].astype(float)
    cx, cy = s / 2 + 4, s / 2 - 8
    ang = np.arctan2(yy - cy, xx - cx)
    rad = np.hypot(xx - cx, yy - cy)
    swirl = (np.sin(ang * 2 + rad / 9) + 1) / 2 * np.exp(-rad / 34)
    core = np.exp(-rad / 10)
    fm = Image.new("L", (s, s), 0)
    fm.paste(rounded_mask(s - 20, 16), (10, 8))
    m = np.asarray(fm) / 255
    alpha = np.clip(swirl * 230 + core * 255, 0, 255) * m
    col = np.zeros((s, s, 3))
    col[...] = np.array(neb, float)
    col = col * (1 - core[..., None] * 0.7) + 255 * core[..., None] * 0.7
    layer = Image.fromarray(np.concatenate([col, alpha[..., None]], axis=2).clip(0, 255).astype(np.uint8), "RGBA")
    t.alpha_composite(layer)
    sparkle(t, 9, seed=sum(rgb) * 5, size=(0.8, 2.0), area=(16, 12, 112, 100))
    return t


def skin_tiki(rgb):  # Tiki Wood: stained wood with grain and a carved frame
    s = SIZE
    stain = mix(hsv(rgb, 1.15, 0.95), (150, 100, 55), 0.15)
    t = bevel_tile(shade(stain, 1.1), shade(stain, 0.8), shade(stain, 1.25), (60, 34, 16), gloss=0.15, radius=12)
    rnd = random.Random(sum(rgb) * 11)
    with Over(t) as d:
        for k in range(9):
            y = 14 + k * 10 + rnd.uniform(-2, 2)
            pts = [(12 + x * 8, y + math.sin(x * 0.7 + k) * 2.2) for x in range(14)]
            d.line(pts, fill=shade(stain, 0.62) + (150,), width=2)
        d.rounded_rectangle([18, 15, s - 19, s - 28], radius=6, outline=shade(stain, 0.5) + (220,), width=3)
        d.rounded_rectangle([20, 17, s - 21, s - 30], radius=5, outline=shade(stain, 1.35) + (120,), width=1)
        for (x, y) in [(24, 21), (s - 25, 21), (24, s - 34), (s - 25, s - 34)]:
            d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(70, 50, 30, 255))
            d.ellipse([x - 2, y - 2, x, y], fill=(220, 200, 160, 200))
    return t


def skin_jelly(rgb):  # Jelly: wobbly translucent jelly with bubbles
    j = hsv(rgb, 1.15, 1.1)
    t = bevel_tile(mix(j, (255, 255, 255), 0.25), j, mix(j, (255, 255, 255), 0.55), shade(j, 0.6), gloss=0.0, radius=34)
    a = np.asarray(t).astype(float)
    a[..., 3] *= 0.9
    t = Image.fromarray(a.astype(np.uint8), "RGBA")
    rnd = random.Random(sum(rgb) * 13)
    with Over(t) as d:
        d.ellipse([22, 14, 76, 40], fill=(255, 255, 255, 190))
        d.ellipse([84, 22, 96, 32], fill=(255, 255, 255, 160))
        for _ in range(5):
            x, y, r = rnd.uniform(28, 100), rnd.uniform(50, 90), rnd.uniform(2.5, 5)
            d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 255, 255, 170), width=2)
    return t


def skin_pixel(rgb):  # Pixel: 8-bit block, drawn tiny and scaled up crisp
    n = 16
    c = hsv(rgb, 1.15, 1.05)
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 0, n - 2, n - 3], fill=c + (255,))
    d.rectangle([0, 1, n - 1, n - 4], fill=c + (255,))
    d.rectangle([1, n - 3, n - 2, n - 2], fill=shade(c, 0.55) + (255,))  # lip
    d.line([(2, 1), (n - 3, 1)], fill=mix(c, (255, 255, 255), 0.6) + (255,))
    d.line([(1, 2), (1, n - 5)], fill=mix(c, (255, 255, 255), 0.45) + (255,))
    d.line([(n - 2, 2), (n - 2, n - 5)], fill=shade(c, 0.75) + (255,))
    d.line([(2, n - 4), (n - 3, n - 4)], fill=shade(c, 0.75) + (255,))
    d.rectangle([3, 3, 4, 4], fill=(255, 255, 255, 255))
    d.point((5, 3), fill=(255, 255, 255, 200))
    return im.resize((SIZE, SIZE), Image.NEAREST)


def skin_chrome(rgb):  # Chrome: polished tinted metal with a hard reflection band
    s = SIZE
    c = hsv(rgb, 0.85, 1.0)
    t = bevel_tile(c, c, mix(c, (255, 255, 255), 0.7), shade(c, 0.4), gloss=0.0, radius=14)
    fm = Image.new("L", (s, s), 0)
    fm.paste(rounded_mask(s - 20, 8), (10, 8))
    yy = np.linspace(0, 1, s)[:, None]
    band = np.clip(np.sin(yy * math.pi * 2.2 + 0.4), -1, 1)
    light = 0.82 + 0.3 * band
    col = np.array(c, float)[None, None, :] * light[..., None] + 255 * np.clip(band - 0.75, 0, 1)[..., None] * 3
    col = np.repeat(col, s, axis=1)
    layer = Image.fromarray(np.dstack([np.clip(col, 0, 255), np.asarray(fm)]).astype(np.uint8), "RGBA")
    t.alpha_composite(layer)
    with Over(t) as d:
        d.polygon([(14, 60), (s - 14, 40), (s - 14, 48), (14, 68)], fill=(255, 255, 255, 120))
        d.rounded_rectangle([10, 8, s - 11, s - 20], radius=8, outline=(255, 255, 255, 200), width=2)
    return t


def skin_holo(rgb):  # Holo: rainbow foil shimmer over the color
    s = SIZE
    c = hsv(rgb, 1.0, 1.05)
    t = bevel_tile(mix(c, (255, 255, 255), 0.2), c, mix(c, (255, 255, 255), 0.6), shade(c, 0.55), gloss=0.35, radius=20)
    fm = Image.new("L", (s, s), 0)
    fm.paste(rounded_mask(s - 20, 14), (10, 8))
    yy, xx = np.mgrid[0:s, 0:s].astype(float)
    hue = ((xx + yy) / (2 * s) * 1.6) % 1
    rgbh = np.zeros((s, s, 3))
    for i in range(s):
        for j in range(0, s, 2):
            r, g, b = colorsys.hsv_to_rgb(hue[i, j], 0.55, 1)
            rgbh[i, j:j + 2] = (r * 255, g * 255, b * 255)
    stripes = (np.sin((xx - yy) / 6) + 1) / 2
    alpha = (np.asarray(fm) / 255) * (22 + 58 * stripes)
    t.alpha_composite(Image.fromarray(np.dstack([rgbh, alpha]).astype(np.uint8), "RGBA"))
    sparkle(t, 4, seed=sum(rgb) * 17, size=(1.5, 3))
    return t


def skin_faces(rgb):  # Happy Blocks: candy blocks with cute faces
    s = SIZE
    c = hsv(rgb, 1.1, 1.08)
    t = bevel_tile(mix(c, (255, 255, 255), 0.15), c, mix(c, (255, 255, 255), 0.5), shade(c, 0.62), gloss=0.5, radius=26)
    mood = sum(rgb) % 3
    with Over(t) as d:
        ey = 54
        for ex in (44, 84):
            d.ellipse([ex - 8, ey - 10, ex + 8, ey + 10], fill=(30, 20, 40, 255))
            d.ellipse([ex - 4, ey - 7, ex + 1, ey - 2], fill=(255, 255, 255, 255))
        d.ellipse([28, 70, 42, 78], fill=(255, 120, 150, 140))
        d.ellipse([86, 70, 100, 78], fill=(255, 120, 150, 140))
        if mood == 0:
            d.arc([50, 62, 78, 84], start=10, end=170, fill=(30, 20, 40, 255), width=4)
        elif mood == 1:
            d.ellipse([57, 68, 71, 82], fill=(30, 20, 40, 255))
            d.ellipse([60, 74, 68, 81], fill=(255, 110, 130, 255))
        else:
            d.chord([50, 60, 78, 86], start=0, end=180, fill=(30, 20, 40, 255))
            d.chord([56, 72, 72, 86], start=0, end=180, fill=(255, 110, 130, 255))
    return t


SKINS = {
    "ocean": skin_ocean,
    "candy": skin_candy,
    "sunset": skin_sunset,
    "frost": skin_frost,
    "midnight": skin_midnight,
    "royal": skin_royal,
    "cosmic": skin_cosmic,
    "tiki": skin_tiki,
    "jelly": skin_jelly,
    "pixel": skin_pixel,
    "chrome": skin_chrome,
    "holo": skin_holo,
    "faces": skin_faces,
}


def main() -> None:
    base = {c: Image.open(ROOT / f"{c}.webp").convert("RGBA") for c in COLORS}
    rgbs = {c: main_rgb(base[c]) for c in COLORS}
    stars = {n: star_glyph(rgbs[STAR_BASE[n]]) for n in STARS}
    for skin, fn in SKINS.items():
        out = ROOT / skin
        out.mkdir(exist_ok=True)
        tiles = {}
        for c in COLORS:
            tiles[c] = fn(rgbs[c])
            tiles[c].save(out / f"{c}.webp", "WEBP", quality=88, method=6)
        for n in STARS:
            t = tiles[STAR_BASE[n]].copy()
            t.alpha_composite(stars[n])
            t.save(out / f"{n}.webp", "WEBP", quality=88, method=6)
        print("built", skin)


if __name__ == "__main__":
    main()
