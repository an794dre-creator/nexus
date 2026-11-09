"""Gera os ícones PNG do app (sem bibliotecas externas).

Desenho: fundo preto, quadrado laranja arredondado com um radar (anel, ponto e ponteiro) em preto.
Uso: py tools/make_icons.py
"""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "icons"
BG = (9, 9, 10)
OR = (247, 147, 26)
INK = (11, 11, 12)


def png(path: Path, w: int, h: int, px) -> None:
    raw = b"".join(b"\x00" + bytes(px[y * w * 3:(y + 1) * w * 3]) for y in range(h))
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(data)


def shade(x: float, y: float, s: float, scale: float) -> tuple:
    """Cor do ponto (x, y) em coordenadas 0..1. scale = tamanho do quadrado laranja (1 = tela toda)."""
    m = (1 - scale) / 2
    u, v = (x - m) / scale, (y - m) / scale
    if not (0 <= u <= 1 and 0 <= v <= 1):
        return BG
    r = 0.22  # cantos arredondados
    cx = min(max(u, r), 1 - r)
    cy = min(max(v, r), 1 - r)
    if (u - cx) ** 2 + (v - cy) ** 2 > r * r:
        return BG
    du, dv = u - 0.5, v - 0.5
    d = math.hypot(du, dv)
    if abs(d - 0.30) < 0.045:          # anel
        return INK
    if d < 0.075:                      # ponto central
        return INK
    ang = math.atan2(dv, du)          # ponteiro a -45°
    if d < 0.30 and abs(ang + math.pi / 4) < 0.16 and d > 0.06:
        return INK
    return OR


def render(size: int, scale: float) -> list:
    ss = 3  # superamostragem para suavizar as bordas
    px = []
    for y in range(size):
        for x in range(size):
            acc = [0, 0, 0]
            for j in range(ss):
                for i in range(ss):
                    c = shade((x + (i + .5) / ss) / size, (y + (j + .5) / ss) / size, size, scale)
                    acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]
            px.extend(round(a / (ss * ss)) for a in acc)
    return px


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, scale in [("icon-192.png", 192, .86), ("icon-512.png", 512, .86),
                              ("apple-touch-icon.png", 180, 1.0), ("maskable-512.png", 512, .62)]:
        png(OUT / name, size, size, render(size, scale))
        print("ok", name)
