# -*- coding: utf-8 -*-
"""
Procedural planet renderer (transparent background PNG)
Test subject: Katina - savanna/steppe world, land-dominant, seasonal green belts
"""
import numpy as np
from PIL import Image
import sys, time

t0 = time.time()

RES = 1600          # final output size
SS = 2              # supersampling factor
N = RES * SS
MARGIN = 1.12       # extra space for atmosphere glow
SEED = 4172

# ---------------- pixel grid ----------------
ax = np.linspace(-MARGIN, MARGIN, N, dtype=np.float32)
X, Y = np.meshgrid(ax, -ax)
R2 = X * X + Y * Y
sphere_mask = R2 <= 1.0
Zs = np.sqrt(np.clip(1.0 - R2, 0.0, 1.0)).astype(np.float32)

# masked sphere points
mx = X[sphere_mask].astype(np.float32)
my = Y[sphere_mask].astype(np.float32)
mz = Zs[sphere_mask].astype(np.float32)
M = mx.size
print("sphere px:", M)

# rotate sphere so texture isn't axis aligned (tilt + spin)
def rot(px, py, pz, ax_deg, axis):
    a = np.deg2rad(ax_deg)
    c, s = np.cos(a).astype(np.float32), np.sin(a).astype(np.float32)
    if axis == 'x':
        return px, c * py - s * pz, s * py + c * pz
    if axis == 'y':
        return c * px + s * pz, py, -s * px + c * pz
    return c * px - s * py, s * px + c * py, pz

px, py, pz = rot(mx, my, mz, 18, 'x')
px, py, pz = rot(px, py, pz, 35, 'y')

# ---------------- 3D value noise ----------------
def hash3(ix, iy, iz, seed):
    n = (ix * np.int64(374761393)) ^ (iy * np.int64(668265263)) ^ \
        (iz * np.int64(2147483629)) ^ np.int64(seed * 144665)
    n = (n ^ (n >> 13)) * np.int64(1274126177)
    n = n ^ (n >> 16)
    return ((n & np.int64(0x7fffffff)).astype(np.float32)) / np.float32(0x7fffffff)

def vnoise(x, y, z, seed):
    xi = np.floor(x); yi = np.floor(y); zi = np.floor(z)
    xf = (x - xi); yf = (y - yi); zf = (z - zi)
    xi = xi.astype(np.int64); yi = yi.astype(np.int64); zi = zi.astype(np.int64)
    u = xf * xf * (3 - 2 * xf); v = yf * yf * (3 - 2 * yf); w = zf * zf * (3 - 2 * zf)
    c000 = hash3(xi, yi, zi, seed);     c100 = hash3(xi + 1, yi, zi, seed)
    c010 = hash3(xi, yi + 1, zi, seed); c110 = hash3(xi + 1, yi + 1, zi, seed)
    c001 = hash3(xi, yi, zi + 1, seed); c101 = hash3(xi + 1, yi, zi + 1, seed)
    c011 = hash3(xi, yi + 1, zi + 1, seed); c111 = hash3(xi + 1, yi + 1, zi + 1, seed)
    x00 = c000 + (c100 - c000) * u; x10 = c010 + (c110 - c010) * u
    x01 = c001 + (c101 - c001) * u; x11 = c011 + (c111 - c011) * u
    y0 = x00 + (x10 - x00) * v; y1 = x01 + (x11 - x01) * v
    return y0 + (y1 - y0) * w

def fbm(x, y, z, octaves, seed, freq=1.0, gain=0.5, lac=2.0, ridged=False):
    total = np.zeros_like(x); amp = np.float32(1.0); f = np.float32(freq); norm = 0.0
    for o in range(octaves):
        n = vnoise(x * f, y * f, z * f, seed + o * 131)
        if ridged:
            n = 1.0 - np.abs(2.0 * n - 1.0)
            n = n * n
        total += n * amp
        norm += amp
        amp *= gain; f *= lac
    return total / norm

# ---------------- terrain ----------------
print("terrain...", round(time.time() - t0, 1), "s")
# domain warp for natural coastlines
wx = fbm(px, py, pz, 4, SEED + 900, freq=1.6) - 0.5
wy = fbm(px, py, pz, 4, SEED + 901, freq=1.6) - 0.5
wz = fbm(px, py, pz, 4, SEED + 902, freq=1.6) - 0.5
W = np.float32(0.38)
qx = px + wx * W; qy = py + wy * W; qz = pz + wz * W

base = fbm(qx, qy, qz, 7, SEED, freq=1.9)                       # continents
mount = fbm(qx, qy, qz, 7, SEED + 50, freq=4.2, ridged=True)    # ridged mountains
detail = fbm(px, py, pz, 6, SEED + 77, freq=11.0)               # fine detail
micro = fbm(qx, qy, qz, 5, SEED + 88, freq=22.0, ridged=True)   # micro relief

height = base * 0.70 + mount * 0.30 + detail * 0.13 + micro * 0.07
height = (height - height.min()) / (height.max() - height.min())

# sea level -> land-dominant world (~68% land)
SEA = np.float32(np.quantile(height, 0.32))
land = height > SEA

# moisture: seasonal green belts (banded by latitude + noise)
moist_n = fbm(px, py, pz, 4, SEED + 300, freq=3.0)
lat = py  # rotated axis
belt = np.exp(-((np.abs(lat) - 0.28) / 0.34) ** 2)  # green belts off-equator
moisture = np.clip(moist_n * 0.9 + belt * 0.45 - 0.28, 0, 1)

# ---------------- surface color ----------------
print("coloring...", round(time.time() - t0, 1), "s")
col = np.zeros((M, 3), dtype=np.float32)

# ocean
depth = np.clip((SEA - height) / SEA, 0, 1) ** 0.6
o_deep = np.array([14, 36, 44], np.float32) / 255
o_shal = np.array([46, 96, 100], np.float32) / 255
oc = o_shal[None, :] + (o_deep - o_shal)[None, :] * depth[:, None]

# land ramp by relative land height
lh = np.clip((height - SEA) / (1 - SEA), 0, 1)
c_low   = np.array([172, 142, 92], np.float32) / 255   # dry grass lowland
c_mid   = np.array([146, 110, 66], np.float32) / 255   # savanna
c_high  = np.array([116, 96, 78], np.float32) / 255    # rocky steppe
c_peak  = np.array([196, 184, 168], np.float32) / 255  # bright peaks
c_green = np.array([78, 108, 50], np.float32) / 255    # wet-season growth

lc = np.empty((M, 3), np.float32)
t1m = np.clip(lh / 0.35, 0, 1)[:, None]
t2m = np.clip((lh - 0.35) / 0.35, 0, 1)[:, None]
t3m = np.clip((lh - 0.72) / 0.28, 0, 1)[:, None] ** 1.6
lc = c_low[None] + (c_mid - c_low)[None] * t1m
lc = lc + (c_high - lc) * t2m
lc = lc + (c_peak[None] - lc) * t3m
# green belts blend (only low/mid altitude)
gmask = (moisture * np.clip(1 - lh / 0.6, 0, 1))[:, None]
lc = lc + (c_green[None] - lc) * np.clip(gmask * 1.25, 0, 1)
# subtle color variation
var = (fbm(px, py, pz, 3, SEED + 411, freq=6.5) - 0.5)[:, None]
lc = np.clip(lc * (1 + var * 0.3), 0, 1)
# albedo relief: darken slopes/valleys so terrain reads even without light
relief = (mount * 0.6 + micro * 0.4)
lc = np.clip(lc * (0.80 + relief * 0.40)[:, None], 0, 1)

col = np.where(land[:, None], lc, oc)

# ---------------- lighting ----------------
print("lighting...", round(time.time() - t0, 1), "s")
L = np.array([-0.55, 0.52, 0.62], np.float32); L /= np.linalg.norm(L)

# bump-perturbed normal from screen-space height gradient (land only, ocean flat)
Hland = np.where(land, height, SEA)
Hfull = np.full((N, N), float(SEA), np.float32); Hfull[sphere_mask] = Hland
gy, gx = np.gradient(Hfull)
BUMP = 110.0
gxm = np.clip(gx[sphere_mask], -0.004, 0.004)
gym = np.clip(gy[sphere_mask], -0.004, 0.004)
nx = mx - gxm * BUMP * np.where(land, 1, 0.0)
ny = my + gym * BUMP * np.where(land, 1, 0.0)
nz = mz
nl = np.sqrt(nx * nx + ny * ny + nz * nz)
nx /= nl; ny /= nl; nz /= nl

diff = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
diff_s = diff ** 0.85
shade = 0.02 + diff_s * 1.08

# ocean specular
hx, hy, hz = L[0], L[1], L[2] + 1.0
hn = np.sqrt(hx * hx + hy * hy + hz * hz)
spec = np.clip((mx * hx + my * hy + mz * hz) / hn, 0, 1) ** 90
col = col + (~land)[:, None] * spec[:, None] * np.float32(0.55) * diff[:, None]

col = col * shade[:, None]

# ---------------- clouds ----------------
print("clouds...", round(time.time() - t0, 1), "s")
# stretch along longitude for banded weather systems
cx, cy, cz = px, py * np.float32(1.9), pz
cwx = fbm(px, py, pz, 3, SEED + 600, freq=2.4) - 0.5
cwy = fbm(px, py, pz, 3, SEED + 601, freq=2.4) - 0.5

def cloud_density(ax_, ay_, az_):
    c1 = fbm(ax_ + cwx * 0.9, ay_ * 1.9, az_ + cwy * 0.9, 7, SEED + 640, freq=3.0)
    c2 = fbm(ax_ * 2.4, ay_ * 2.4 * 1.9, az_ * 2.4, 5, SEED + 660, freq=4.5)
    d = np.clip((c1 * 0.68 + c2 * 0.42 - 0.545) * 4.0, 0, 1) ** 1.6
    return d * np.float32(0.9)

cloud = cloud_density(px, py, pz)

# cloud shadow on ground (offset toward light)
CSH = 0.018
shx = mx + L[0] * CSH; shy = my + L[1] * CSH
sr2 = np.clip(1 - shx * shx - shy * shy, 0, 1)
shz = np.sqrt(sr2)
spx, spy, spz = rot(shx, shy, shz, 18, 'x')
spx, spy, spz = rot(spx, spy, spz, 35, 'y')
scloud = cloud_density(spx, spy, spz)
col = col * (1 - scloud * 0.42)[:, None]

cloud_col = np.array([1.0, 0.99, 0.96], np.float32)[None, :] * (0.06 + diff_s * 1.02)[:, None]
col = col * (1 - cloud[:, None]) + cloud_col * cloud[:, None]

# ---------------- atmosphere (inside disk) ----------------
fres = (1.0 - mz) ** 4.0
atm_col = np.array([0.36, 0.56, 1.0], np.float32)
atm = fres * (0.04 + diff_s * 1.05) * 1.35
col = col + atm_col[None, :] * atm[:, None]

col = np.clip(col, 0, 1)

# ---------------- compose full image ----------------
print("compose...", round(time.time() - t0, 1), "s")
img = np.zeros((N, N, 4), dtype=np.float32)
img[sphere_mask, 0] = col[:, 0]
img[sphere_mask, 1] = col[:, 1]
img[sphere_mask, 2] = col[:, 2]
img[sphere_mask, 3] = 1.0

# outer glow: tight scattering halo hugging the limb, stronger on lit side
r = np.sqrt(R2)
outside = (r > 1.0)
glow_t = np.clip((r - 1.0) / (MARGIN - 1.0), 0, 1)
glow_fall = np.exp(-glow_t * 42.0) * 0.40 + np.exp(-glow_t * 14.0) * 0.13
ang = np.clip((X * L[0] + Y * L[1]) / np.maximum(r, 1e-6), -1, 1)
side = np.clip(ang * 0.7 + 0.5, 0.02, 1.0)
glow_a = np.where(outside, glow_fall * side, 0).astype(np.float32)
glow_a = np.clip(glow_a, 0, 0.5)
for i, c in enumerate(atm_col):
    img[..., i] = np.where(outside, c, img[..., i])
img[..., 3] = np.where(outside, glow_a, img[..., 3])

# premultiply-safe straight alpha output
out8 = (np.clip(img, 0, 1) * 255).astype(np.uint8)
im = Image.fromarray(out8, "RGBA").resize((RES, RES), Image.LANCZOS)

out_path = sys.argv[1] if len(sys.argv) > 1 else "planet_test.png"
im.save(out_path)
print("saved:", out_path, round(time.time() - t0, 1), "s")
