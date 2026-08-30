# -*- coding: utf-8 -*-
"""Remove magenta chroma-key background -> transparent RGBA PNG."""
import numpy as np
from PIL import Image
import sys

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
print("source size:", im.size)
a = np.asarray(im).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

# magenta-ness: high R and B, low G. alpha = 1 - normalized magenta amount
key = np.minimum(R, B) - G
alpha = 1.0 - np.clip((key - 30.0) / 150.0, 0.0, 1.0)

# despill: un-mix magenta from semi-transparent edge pixels
mag = np.array([255.0, 0.0, 255.0])
af = np.clip(alpha, 1e-4, 1.0)[..., None]
rgb = (a - (1.0 - af) * mag[None, None, :]) / af
rgb = np.clip(rgb, 0, 255)

# kill any residual faint magenta ring: where alpha low, force 0
alpha = np.where(alpha < 0.06, 0.0, alpha)
# clean RGB of fully transparent pixels (avoid despill garbage in viewers)
rgb = np.where((alpha == 0.0)[..., None], 0.0, rgb)

out = np.dstack([rgb, alpha[..., None] * 255.0]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(dst)
print("saved:", dst)
