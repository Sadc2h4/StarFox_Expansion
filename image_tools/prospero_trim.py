# -*- coding: utf-8 -*-
"""プロスペロー v2: background-subtraction soft matte."""
import numpy as np
import cv2
from PIL import Image
import os

SRC = r"C:\Users\catso\Desktop\SFData\resource\LA_image\編集元\プロスペロー.png"
OUT = r"C:\Users\catso\Desktop\SFData\resource\LA_image\トリミング済み\プロスペロー.png"

im = Image.open(SRC).convert("RGB")
a = np.asarray(im)
H, W = a.shape[:2]
gray = a.max(axis=2).astype(np.float32)

# background estimate: median on half-res (robust to thin ring, not to planet)
half = cv2.resize(gray, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
bg = cv2.medianBlur(half.astype(np.uint8), 151).astype(np.float32)
bg = cv2.resize(bg, (W, H), interpolation=cv2.INTER_LINEAR)

res = gray - bg
alpha = np.clip((res - 6.0) / 34.0, 0, 1)

# cut low-level dust haze, keep solid structures
alpha = np.where(alpha < 0.24, 0, (alpha - 0.24) / 0.76)

# planet disk always opaque
cx, cy, r = 970.0, 536.0, 266.0
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dist = np.hypot(xx - cx, yy - cy)
pl = np.clip((r + 1.0 - dist) / 2.0, 0, 1)
alpha = np.maximum(alpha, pl)

# remove small isolated bits (stars, grain) not near the main structure
hard = (alpha > 0.15).astype(np.uint8)
ncomp, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
for i in range(1, ncomp):
    if stats[i, cv2.CC_STAT_AREA] < 400:
        alpha[lab == i] = 0

# caption text region + residual light-ray patch top-right
alpha[820:910, 30:540] = 0
alpha[:230, 1400:] = 0

# slight feather
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
alpha = np.clip(alpha, 0, 1)

ys, xs_ = np.where(alpha > 0.03)
y0, y1 = ys.min(), ys.max(); x0, x1 = xs_.min(), xs_.max()
pad = 10
y0 = max(0, y0 - pad); y1 = min(H - 1, y1 + pad)
x0 = max(0, x0 - pad); x1 = min(W - 1, x1 + pad)
print("bbox:", x0, y0, x1, y1)

crop_rgb = a[y0:y1 + 1, x0:x1 + 1].astype(np.float32)
crop_a = alpha[y0:y1 + 1, x0:x1 + 1]
out = np.dstack([crop_rgb * (crop_a[..., None] > 0.03),
                 crop_a * 255]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(OUT)
print("saved:", OUT, out.shape)
