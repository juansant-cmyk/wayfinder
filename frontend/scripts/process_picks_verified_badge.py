"""Make pale background transparent on picks-verified-badge.png.

Only removes pale pixels connected to the image border so the white
check mark inside the scalloped blue seal is preserved.
"""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets/images/hotels/picks-verified-badge.png"


def is_pale_bg(r: int, g: int, b: int, a: int) -> bool:
    if a < 10:
        return True
    lum = (r + g + b) / 3.0
    mx, mn = max(r, g, b), min(r, g, b)
    sat = (mx - mn) / (mx + 1.0)
    if lum > 220 and sat < 0.18:
        return True
    if lum > 200 and sat < 0.12 and b > 240:
        return True
    if lum > 210 and r > 220 and g > 230 and b > 245 and sat < 0.22:
        return True
    return False


def main() -> None:
    im = Image.open(PATH).convert("RGBA")
    w, h = im.size
    px = im.load()

    pale = [[is_pale_bg(*px[x, y]) for x in range(w)] for y in range(h)]

    # Edge-connected pale component = card background (not the check).
    edge_bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if pale[y][x]:
                edge_bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if pale[y][x] and not edge_bg[y][x]:
                edge_bg[y][x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and pale[ny][nx] and not edge_bg[ny][nx]:
                edge_bg[ny][nx] = True
                q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if edge_bg[y][x]:
                px[x, y] = (0, 0, 0, 0)
            else:
                r, g, b, a = px[x, y]
                # Interior pale holes that were wrongly cleared → white check
                if a < 10:
                    px[x, y] = (255, 255, 255, 255)
                elif is_pale_bg(r, g, b, a):
                    # Interior pale (check) — force clean white
                    px[x, y] = (255, 255, 255, 255)

    im.save(PATH, format="PNG", optimize=True)
    data = list(im.getdata())
    nt = sum(1 for p in data if p[3] > 10)
    tr = sum(1 for p in data if p[3] == 0)
    print(f"saved: {PATH}")
    print(f"size:  {w}x{h}")
    print(f"non-transparent={nt} transparent={tr}")
    print(f"corner TL={im.getpixel((0, 0))} center={im.getpixel((w // 2, h // 2))}")


if __name__ == "__main__":
    main()
