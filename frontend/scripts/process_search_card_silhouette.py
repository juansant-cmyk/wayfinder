"""Chroma-key search-card silhouette: remove solid card blue, keep artwork."""
from __future__ import annotations

import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/images/hotels/search-card-silhouette-raw.png"
DST = ROOT / "assets/images/hotels/search-card-silhouette.png"

# Typical saturated card-blue backdrop (~#156EF6 family).
BG_REF = (67, 123, 232)
BG_LUM = 140.0
BG_SAT = 0.71


def dist(a: tuple[int, ...], b: tuple[int, ...]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def is_white_input_corner(x: int, y: int, w: int, h: int, lum: float, sat: float) -> bool:
    """White / pale UI corner on the left — not silhouette artwork."""
    # Entire lower-left zone is the search input chrome, not skyline art.
    if x < int(w * 0.20) and y > int(h * 0.55):
        return True
    if x >= int(w * 0.30) or y <= int(h * 0.50):
        return False
    return lum > 150 and sat < 0.45


def bg_alpha(rgb: tuple[int, int, int]) -> int:
    """0 = fully transparent (card blue), 255 = keep opaque.

    Backdrop: saturated medium blues with fairly uniform color.
    Buildings: lighter / washed / higher-luminance blues.
    Path + pin: near-white.
    Palm: greens / muted olive.
    """
    r, g, b = rgb
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    hue = h * 360.0
    lum = (r + g + b) / 3.0
    mx, mn = max(rgb), min(rgb)
    sat_rgb = (mx - mn) / (mx + 1.0)
    d_bg = dist(rgb, BG_REF)
    d_lum = lum - BG_LUM
    d_sat = BG_SAT - s

    # Palm greens / browns / olive tips
    if 70 < hue < 160 and s > 0.15 and v < 0.80:
        return 255
    if g > r + 8 and g >= b - 20 and g > 65 and lum < 170 and s > 0.12:
        return 255

    # White path / pin (and soft antialias)
    if lum > 225 and sat_rgb < 0.15:
        return 255
    if lum > 200 and sat_rgb < 0.22:
        return 255
    if lum > 185 and sat_rgb < 0.35 and b - r < 90:
        # pale blue-white AA on pin/path
        return 255

    blueish = 195 < hue < 245 and b > r + 25

    if blueish:
        # Clear washed building / tower fill: lighter + less saturated than card
        if d_lum >= 18 and d_sat >= 0.08:
            return 255
        if d_lum >= 12 and s < 0.58:
            return 255
        if lum >= 170 and s < 0.55:
            return 255
        if lum >= 160 and s < 0.50:
            return 255
        # Soft building body: slightly lighter + slightly less saturated
        if d_lum >= 8 and d_sat >= 0.05 and s < 0.66:
            return 255
        if d_lum >= 10 and s <= 0.63:
            return 255
        # Mid silhouette wash (tower walls): sat ~0.60–0.64, L ~152–158
        if lum >= 150 and s <= 0.64 and d_sat >= 0.05:
            return 255
        if lum >= 152 and s <= 0.635 and d_lum >= 6:
            return 255

        # Solid card backdrop: saturated, close to ref, not lighter wash
        if s >= 0.65 and d_bg < 55 and d_lum < 12:
            return 0
        if s >= 0.68 and d_lum < 15:
            return 0
        if s >= 0.62 and d_bg < 28 and d_lum < 8:
            return 0

        # Soft edge between card and wash
        if s > 0.60 and d_lum < 6 and d_sat < 0.04:
            return 0
        if blueish and d_bg < 22 and s > 0.66:
            return 0

        # Prefer keeping ambiguous mid blues that look washed
        if s < 0.62 and lum >= 148:
            t = (0.62 - s) / 0.12
            return int(255 * max(0.35, min(1.0, t)))

    # Non-blue leftovers (shadows, AA) — keep if not near card blue
    if d_bg > 70:
        return 255
    if d_bg < 35 and s > 0.60:
        return 0
    return 255


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    opx = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            rgb = (r, g, b)
            lum = (r + g + b) / 3.0
            mx, mn = max(rgb), min(rgb)
            sat = (mx - mn) / (mx + 1.0)

            if is_white_input_corner(x, y, w, h, lum, sat):
                opx[x, y] = (0, 0, 0, 0)
                continue

            a = bg_alpha(rgb)
            if a <= 0:
                opx[x, y] = (0, 0, 0, 0)
            else:
                opx[x, y] = (r, g, b, a)

    bbox = out.getbbox()
    if bbox is None:
        raise SystemExit("No opaque content after chroma-key")
    pad = 2
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    cropped = out.crop((x0, y0, x1, y1))
    cropped.save(DST, format="PNG", optimize=True)

    print(f"source: {SRC}")
    print(f"saved:  {DST}")
    print(f"size:   {cropped.size[0]}x{cropped.size[1]} (from {w}x{h}, crop={(x0, y0, x1, y1)})")
    print(f"bytes:  {DST.stat().st_size}")
    data = list(cropped.getdata())
    opaque = sum(1 for p in data if p[3] > 200)
    soft = sum(1 for p in data if 0 < p[3] <= 200)
    trans = sum(1 for p in data if p[3] == 0)
    print(f"opaque~{opaque} soft={soft} transparent={trans}")


if __name__ == "__main__":
    main()
