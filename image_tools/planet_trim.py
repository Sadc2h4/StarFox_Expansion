# -*- coding: utf-8 -*-
"""Trim planet disks: manual seed circle + radial edge snap refinement."""
import numpy as np
import cv2
from PIL import Image
import os

SRC_DIR = r"C:\Users\catso\Desktop\SFData\resource\LA_image\編集元"
OUT_DIR = r"C:\Users\catso\Desktop\SFData\resource\LA_image\トリミング済み"
DBG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "trim_debug2")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(DBG_DIR, exist_ok=True)

# manual seed circles: (cx, cy, r) eyeballed from source images
SEEDS = {
    "アクアス.png":    (314, 176, 160),
    "エラダード.webp":  (627, 341, 253),
    "カタリナ.png":    (241, 236, 211),
    "キュー.png":      (508, 503, 455),
    "グリッピア.webp":  (444, 272, 205),
    "セティボス.png":   (860, 1040, 690),
    "ゾネス.png":      (200, 150, 145),
    "パペトゥーン.png": (386, 374, 352),
}

def fit_circle_kasa(pts):
    x, y = pts[:, 0], pts[:, 1]
    A = np.column_stack([x, y, np.ones_like(x)])
    b = x * x + y * y
    sol, *_ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy = sol[0] / 2, sol[1] / 2
    r = np.sqrt(max(sol[2] + cx * cx + cy * cy, 1.0))
    return cx, cy, r

def refine_circle(gray, cx0, cy0, r0, n_ang=1440, n_rad=240, lo=0.82, hi=1.18):
    g = cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 1.6)
    H, W = g.shape
    ang = np.linspace(0, 2 * np.pi, n_ang, endpoint=False)
    rad = np.linspace(lo * r0, hi * r0, n_rad)
    ca, sa = np.cos(ang)[:, None], np.sin(ang)[:, None]
    X = cx0 + ca * rad[None, :]
    Y = cy0 + sa * rad[None, :]
    inb = (X >= 1) & (X < W - 1) & (Y >= 1) & (Y < H - 1)
    prof = cv2.remap(g, X.astype(np.float32), Y.astype(np.float32),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    prof[~inb] = np.nan
    d = np.gradient(prof, axis=1)
    absd = np.abs(d)
    absd[np.isnan(absd)] = 0
    idx = np.argmax(absd, axis=1)
    strength = absd[np.arange(n_ang), idx]
    keep = strength > max(2.0, np.percentile(strength, 55) * 0.5)
    rr = rad[idx]
    px = cx0 + np.cos(ang) * rr
    py = cy0 + np.sin(ang) * rr
    pts = np.column_stack([px, py])[keep]
    # robust refit with trimming
    for _ in range(4):
        cx, cy, r = fit_circle_kasa(pts)
        res = np.abs(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy) - r)
        mad = np.median(res) + 1e-6
        good = res < max(3.0, 3.5 * mad)
        if good.sum() < 50:
            break
        pts = pts[good]
    return cx, cy, r, len(pts)

for fname, (cx0, cy0, r0) in SEEDS.items():
    path = os.path.join(SRC_DIR, fname)
    im = Image.open(path).convert("RGB")
    a = np.asarray(im)
    gray = a.max(axis=2).astype(np.float32)
    cx, cy, r, npts = refine_circle(gray, cx0, cy0, r0)
    print(f"{fname}: seed=({cx0},{cy0},{r0}) -> fit=({cx:.1f},{cy:.1f},r={r:.1f}) pts={npts}")

    dbg = a.copy()
    cv2.circle(dbg, (int(round(cx)), int(round(cy))), int(round(r)), (255, 0, 0), 2)
    Image.fromarray(dbg).save(os.path.join(DBG_DIR, os.path.splitext(fname)[0] + "_debug.png"))

    pad = int(r * 0.03) + 2
    R = r + pad
    side = int(np.ceil(2 * R))
    yy, xx = np.mgrid[0:side, 0:side].astype(np.float32)
    sx = xx + np.float32(cx - R)
    sy = yy + np.float32(cy - R)
    H, W = a.shape[:2]
    valid = (sx >= 0) & (sx <= W - 1) & (sy >= 0) & (sy <= H - 1)
    sxi = np.clip(np.round(sx).astype(np.int32), 0, W - 1)
    syi = np.clip(np.round(sy).astype(np.int32), 0, H - 1)
    rgb = a[syi, sxi]
    dist = np.hypot(xx - R, yy - R)
    alpha = np.clip((r + 0.75 - dist) / 1.5, 0, 1) * valid
    canvas = np.zeros((side, side, 4), np.uint8)
    canvas[..., :3] = rgb * (alpha[..., None] > 0)
    canvas[..., 3] = (alpha * 255).astype(np.uint8)
    out_path = os.path.join(OUT_DIR, os.path.splitext(fname)[0] + ".png")
    Image.fromarray(canvas, "RGBA").save(out_path)
    print("  saved:", out_path, f"({side}x{side})")
