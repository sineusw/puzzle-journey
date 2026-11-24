"""Draw the bomb booster icon (public/icons/bomb.png/.webp): a glossy round
bomb with a brass cap, a curled fuse and a bright spark."""
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
S = 1024  # drawn big, scaled down for smooth edges
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

cx, cy, R = 440, 600, 330
# warm halo so the dark ball pops on dark menus
halo = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(halo).ellipse([cx - R - 60, cy - R - 60, cx + R + 60, cy + R + 60], fill=(255, 190, 110, 70))
img.alpha_composite(halo.filter(ImageFilter.GaussianBlur(50)))
# bold outline + ball with a top-to-bottom gradient (cartoon style)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
img.paste(Image.new("RGBA", (S, S), (14, 12, 26, 255)), (0, 0), mask)
inner = Image.new("L", (S, S), 0)
ImageDraw.Draw(inner).ellipse([cx - R + 20, cy - R + 20, cx + R - 20, cy + R - 20], fill=255)
t = np.clip((np.mgrid[0:S, 0:S][0] - (cy - R)) / (2 * R), 0, 1)[..., None]
grad = np.array([104, 100, 150], float) * (1 - t) + np.array([34, 30, 56], float) * t
grad_img = Image.fromarray(np.dstack([grad, np.full((S, S), 255)]).astype(np.uint8), "RGBA")
img.paste(grad_img, (0, 0), inner)
# rim light along the lower right
rimimg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(rimimg).arc([cx - R + 34, cy - R + 34, cx + R - 34, cy + R - 34], start=10, end=95, fill=(150, 170, 255, 200), width=18)
img.alpha_composite(rimimg.filter(ImageFilter.GaussianBlur(4)))
inside = np.asarray(inner) > 0
# big shine
hl = Image.new("L", (S, S), 0)
ImageDraw.Draw(hl).ellipse([cx - 210, cy - 235, cx - 40, cy - 120], fill=235)
ImageDraw.Draw(hl).ellipse([cx - 230, cy - 90, cx - 185, cy - 45], fill=200)
hl = hl.filter(ImageFilter.GaussianBlur(6))
img.paste(Image.new("RGBA", (S, S), (255, 255, 255, 255)), (0, 0), Image.fromarray((np.asarray(hl) * inside).astype(np.uint8)))

# brass cap, tilted toward the upper right
cap = Image.new("RGBA", (S, S), (0, 0, 0, 0))
cd = ImageDraw.Draw(cap)
ang = math.radians(-46)
ccx, ccy = cx + math.cos(ang) * (R - 18), cy + math.sin(ang) * (R - 18)
for i, (w, h, colr) in enumerate([(150, 120, (150, 96, 20)), (136, 106, (232, 178, 60)), (120, 40, (255, 232, 150))]):
    off = [0, 0, -30][i]
    cd.rounded_rectangle([ccx - w / 2, ccy - h / 2 + off, ccx + w / 2, ccy + h / 2 + off], radius=26, fill=colr + (255,))
cd.ellipse([ccx - 68, ccy - 78, ccx + 68, ccy - 34], fill=(120, 76, 14, 255))
cap = cap.rotate(-38, center=(ccx, ccy), resample=Image.BICUBIC)
img.alpha_composite(cap)

# fuse: a thick curl from the cap up and to the right
fx, fy = ccx + 34, ccy - 60
pts = []
for t in np.linspace(0, 1, 60):
    pts.append((fx + 130 * t + 36 * math.sin(t * 3.2), fy - 150 * t + 40 * math.sin(t * 5)))
fd = ImageDraw.Draw(img)
fd.line(pts, fill=(90, 54, 20, 255), width=34, joint="curve")
fd.line(pts, fill=(196, 140, 74, 255), width=22, joint="curve")
for i in range(0, len(pts) - 3, 5):
    x, y = pts[i]
    fd.line([(x - 9, y - 6), (x + 9, y + 6)], fill=(120, 76, 30, 255), width=6)

# spark
sx, sy = pts[-1]
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([sx - 110, sy - 110, sx + 110, sy + 110], fill=(255, 150, 40, 170))
glow = glow.filter(ImageFilter.GaussianBlur(40))
img.alpha_composite(glow)
star = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(star)
for k in range(12):
    a = k * math.pi / 6
    r = 105 if k % 2 == 0 else 60
    sd.line([(sx, sy), (sx + math.cos(a) * r, sy + math.sin(a) * r)], fill=(255, 220, 90, 255), width=14 if k % 2 == 0 else 9)
sd.ellipse([sx - 42, sy - 42, sx + 42, sy + 42], fill=(255, 245, 190, 255))
sd.ellipse([sx - 22, sy - 22, sx + 22, sy + 22], fill=(255, 255, 255, 255))
img.alpha_composite(star)

# drop shadow under everything
a = np.asarray(img)[..., 3]
sh = Image.fromarray((a * 0.45).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
shadow.putalpha(sh)
final = Image.new("RGBA", (S, S), (0, 0, 0, 0))
final.alpha_composite(shadow, (0, 14))
final.alpha_composite(img)
out = final.resize((256, 256), Image.LANCZOS)
out.save(OUT / "bomb.png")
out.save(OUT / "bomb.webp", "WEBP", quality=90, method=6)
print("ok")
