from pathlib import Path
import math

from PIL import Image

src = Path(__file__).resolve().parents[1] / "assets/images/hotels/hotel-hero-reference.png"
dst = Path(__file__).resolve().parents[1] / "assets/images/hotels/hotel-hero-pageblend.png"

PAGE = (234, 242, 252)  # #EAF2FC
im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()


def dist(a, b):
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


# Sample only the outer sky frame — avoid subjects / skyline / clouds.
sky_refs = []
for y in range(0, max(4, h // 16)):
    for x in range(0, w, 4):
        sky_refs.append(px[x, y][:3])
for y in range(0, h // 3, 4):
    for x in range(0, max(4, w // 16)):
        sky_refs.append(px[x, y][:3])
avg_sky = tuple(sum(c[i] for c in sky_refs) // len(sky_refs) for i in range(3))
print("avg sky", avg_sky, "size", w, h)

out = Image.new("RGBA", (w, h))
opx = out.load()

for y in range(h):
    yn = y / (h - 1)
    for x in range(w):
        r, g, b, a = px[x, y]
        rgb = (r, g, b)
        d_sky = dist(rgb, avg_sky)
        lum = (r + g + b) / 3.0
        sat = (max(rgb) - min(rgb)) / (max(rgb) + 1.0)
        xn = x / (w - 1)

        # Preserve clouds (very bright) and skyline silhouettes (slightly darker / bluer).
        is_cloud = lum > 248 and sat < 0.08
        is_skyline = 175 < lum < 225 and b >= g and sat < 0.18 and yn < 0.55

        blend = 0.0

        # Gentle sky remap only for near-identical sky pixels.
        if not is_cloud and not is_skyline and d_sky < 14 and lum > 220 and sat < 0.18:
            blend = max(blend, 0.85 * (1.0 - d_sky / 14))

        # Soft left/top edge: only if already sky-like.
        if d_sky < 22 and lum > 215:
            left_fade = max(0.0, 1.0 - xn / 0.08) ** 1.6
            top_fade = max(0.0, 1.0 - yn / 0.07) ** 1.5
            blend = max(blend, left_fade * 0.55, top_fade * 0.45)

        # Footer blue bar only — keep lower foliage/subjects.
        if (
            yn > 0.91
            and b > 155
            and b > r + 35
            and b > g + 20
            and g < 175
            and r < 120
        ):
            blend = max(blend, min(1.0, (yn - 0.91) / 0.09))

        if blend <= 0:
            opx[x, y] = (r, g, b, a)
            continue

        nr = int(r + (PAGE[0] - r) * blend)
        ng = int(g + (PAGE[1] - g) * blend)
        nb = int(b + (PAGE[2] - b) * blend)
        opx[x, y] = (nr, ng, nb, a)

out.save(dst, optimize=True)
print("wrote", dst)
print("TL", out.getpixel((2, 2)), "cloud-ish mid-top", out.getpixel((w // 2, 20)))
