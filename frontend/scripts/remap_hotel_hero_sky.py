"""Aggressively remap hotel hero sky to exact page background #EAF2FC."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/images/hotels/hotel-hero-complete.png"
DST = SRC

PAGE = (234, 242, 252)  # #EAF2FC


def dist(a: tuple[int, ...], b: tuple[int, ...]) -> float:
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


def is_foliage(rgb: tuple[int, int, int], lum: float, sat: float) -> bool:
    r, g, b = rgb
    if g > r + 6 and g >= b - 5 and sat > 0.12 and lum < 220:
        return True
    if r > g >= b and sat > 0.15 and 40 < lum < 180 and r - b > 20:
        return True
    return False


def is_robot_or_hotel_blue(rgb: tuple[int, int, int], lum: float, sat: float) -> bool:
    r, g, b = rgb
    # True saturated accents only — pale sky haze must NOT match.
    if sat > 0.35 and b > r + 25 and b > 150 and lum < 195:
        return True
    if sat > 0.40 and b > 160 and lum < 185:
        return True
    if lum < 155:
        return True
    return False


def is_cloud(rgb: tuple[int, int, int], lum: float, sat: float) -> bool:
    return lum > 245 and sat < 0.08


def is_skyline(rgb: tuple[int, int, int], lum: float, sat: float, yn: float) -> bool:
    """Darker city silhouettes — keep a touch darker than PAGE so they stay visible."""
    r, g, b = rgb
    # Must be clearly darker / grayer than open sky (avoid protecting pale haze)
    return (
        yn < 0.50
        and 155 < lum < 205
        and sat < 0.14
        and b >= g - 4
        and r < 200
        and (PAGE[0] - r) > 20
    )


def is_open_sky(rgb: tuple[int, int, int], lum: float, sat: float, yn: float) -> bool:
    if yn > 0.60:
        return False
    # Aggressive: catch residual pale-blue haze near foliage/hotel
    if lum <= 198 or sat >= 0.28:
        return False
    if is_foliage(rgb, lum, sat):
        return False
    if is_robot_or_hotel_blue(rgb, lum, sat):
        return False
    if is_cloud(rgb, lum, sat):
        return False
    r, g, b = rgb
    if r > g + 10 and lum < 240 and sat > 0.08:
        return False
    return True


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    opx = out.load()

    for y in range(h):
        yn = y / max(h - 1, 1)
        for x in range(w):
            r, g, b, a = px[x, y]
            rgb = (r, g, b)
            lum = (r + g + b) / 3.0
            mx, mn = max(rgb), min(rgb)
            sat = (mx - mn) / (mx + 1.0)
            xn = x / max(w - 1, 1)

            if is_cloud(rgb, lum, sat):
                opx[x, y] = (r, g, b, a)
                continue
            if is_skyline(rgb, lum, sat, yn):
                opx[x, y] = (r, g, b, a)
                continue
            if is_foliage(rgb, lum, sat) or is_robot_or_hotel_blue(rgb, lum, sat):
                opx[x, y] = (r, g, b, a)
                continue
            if yn > 0.62 and not (
                yn > 0.91 and b > 155 and b > r + 35 and b > g + 20
            ):
                opx[x, y] = (r, g, b, a)
                continue

            blend = 0.0

            if is_open_sky(rgb, lum, sat, yn):
                d_page = dist(rgb, PAGE)
                if d_page < 12 or (lum > 218 and sat < 0.16):
                    blend = 1.0
                else:
                    blend = max(blend, 0.95)
                    if lum > 208 and sat < 0.22:
                        blend = max(blend, 0.98)
                    if sat < 0.14 and lum > 205:
                        blend = 1.0

            # Soft outer-edge fade to PAGE
            if (
                lum > 200
                and sat < 0.26
                and yn < 0.58
                and not is_foliage(rgb, lum, sat)
                and not is_robot_or_hotel_blue(rgb, lum, sat)
                and not is_skyline(rgb, lum, sat, yn)
                and not is_cloud(rgb, lum, sat)
            ):
                edge = max(
                    max(0.0, 1.0 - xn / 0.14) ** 1.2,
                    max(0.0, 1.0 - (1.0 - xn) / 0.14) ** 1.2,
                    max(0.0, 1.0 - yn / 0.12) ** 1.15,
                )
                blend = max(blend, edge * 0.98)

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

            nr = int(round(r + (PAGE[0] - r) * blend))
            ng = int(round(g + (PAGE[1] - g) * blend))
            nb = int(round(b + (PAGE[2] - b) * blend))
            opx[x, y] = (nr, ng, nb, a)

    out.convert("RGB").save(DST, format="PNG", optimize=True)

    tl = out.getpixel((2, 2))[:3]
    sky_samples = [
        (10, 10),
        (w // 2, 20),
        (w - 10, 10),
        (w // 4, h // 5),
        (w // 2, h // 6),
        (int(w * 0.75), int(h * 0.12)),
        (int(w * 0.15), int(h * 0.25)),
        (int(w * 0.85), int(h * 0.20)),
        (940, 411),
        (1120, 410),
    ]
    print(f"TL pixel: {tl}")
    print("sky samples:")
    max_d = 0
    for xy in sky_samples:
        p = out.getpixel(xy)[:3]
        d = max(abs(p[i] - PAGE[i]) for i in range(3))
        max_d = max(max_d, d)
        print(f"  {xy}: {p}  max_delta={d}")
    print(f"max delta from PAGE among samples: {max_d}")
    print(f"PAGE target: {PAGE}")
    print(f"saved: {DST}")
    print(f"bytes: {DST.stat().st_size}")
    print(f"image size: {w}x{h}")


if __name__ == "__main__":
    main()



