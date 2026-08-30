# -*- coding: utf-8 -*-
"""恒星・エンブレム素材の透過化。
恒星: 輝度→アルファ。ぼかしマスクで主要な発光体だけを残し、背景の微小な星を除去。
エンブレム: 最大チャンネル→アルファ + タイトクロップ。
"""
import numpy as np
from PIL import Image, ImageFilter

SRC = r"C:\Users\catso\Desktop\SFData\resource\LA_image\編集元"
DST = r"C:\Users\catso\Desktop\SFData\resource\LA_image"
EMB = r"C:\Users\catso\Desktop\SFData\resource\emblem"


def star_cut(src, dst, floor=0.045, gamma=0.9, core_thr=0.45, grow=40,
             grow_thr=0.04, pad=0.03, max_size=1200):
    im = Image.open(src).convert("RGB")
    rgb = np.asarray(im).astype(np.float32) / 255.0
    lum = rgb.max(axis=2)

    alpha = np.clip((lum - floor) / (1.0 - floor), 0.0, 1.0) ** gamma

    # 主要な発光体だけ残す: 高輝度コアを強くぼかして膨張させたソフトマスク。
    # 微小な背景星はぼかしで潰れて閾値未満になる
    core = (alpha > core_thr).astype(np.float32)
    c_img = Image.fromarray((core * 255).astype(np.uint8))
    grown = np.asarray(c_img.filter(ImageFilter.GaussianBlur(grow))).astype(np.float32) / 255.0
    mask = (grown > grow_thr).astype(np.float32)
    m_img = Image.fromarray((mask * 255).astype(np.uint8))
    mask = np.asarray(m_img.filter(ImageFilter.GaussianBlur(grow // 2))).astype(np.float32) / 255.0
    alpha *= mask

    # 円盤内部の暗い模様を不透明化: 高輝度領域をぼかし→閾値でホール充填
    core2 = ((lum > 0.32) * 255).astype(np.uint8)
    filled = np.asarray(Image.fromarray(core2).filter(ImageFilter.GaussianBlur(45))).astype(np.float32) / 255.0
    filled = ((filled > 0.5) * 255).astype(np.uint8)
    filled_soft = np.asarray(Image.fromarray(filled).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
    alpha = np.maximum(alpha, filled_soft * mask)

    # クロップ(アルファ>0.02のbbox+pad)
    ys, xs = np.where(alpha > 0.02)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    ph = int((y1 - y0) * pad)
    pw = int((x1 - x0) * pad)
    y0, y1 = max(0, y0 - ph), min(alpha.shape[0], y1 + ph)
    x0, x1 = max(0, x0 - pw), min(alpha.shape[1], x1 + pw)

    out = np.dstack([rgb, alpha])[y0:y1, x0:x1]
    out8 = (out * 255).astype(np.uint8)
    out8[out8[..., 3] == 0, :3] = 0  # 完全透明部のRGBゼロ化
    img = Image.fromarray(out8, "RGBA")
    if max(img.size) > max_size:
        r = max_size / max(img.size)
        img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    img.save(dst)
    print(dst, img.size)


def emblem_cut(src, dst, floor=0.06, pad=0.04, max_size=900):
    im = Image.open(src).convert("RGB")
    rgb = np.asarray(im).astype(np.float32) / 255.0
    lum = rgb.max(axis=2)
    alpha = np.clip((lum - floor) / (1.0 - floor), 0.0, 1.0)
    ys, xs = np.where(alpha > 0.15)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    ph = int((y1 - y0) * pad)
    pw = int((x1 - x0) * pad)
    y0, y1 = max(0, y0 - ph), min(alpha.shape[0], y1 + ph)
    x0, x1 = max(0, x0 - pw), min(alpha.shape[1], x1 + pw)
    out = np.dstack([rgb, alpha])[y0:y1, x0:x1]
    out8 = (out * 255).astype(np.uint8)
    out8[out8[..., 3] == 0, :3] = 0
    img = Image.fromarray(out8, "RGBA")
    if max(img.size) > max_size:
        r = max_size / max(img.size)
        img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    img.save(dst)
    print(dst, img.size)


def info_jpeg(src, dst, max_w=1536, quality=86):
    im = Image.open(src).convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(dst, quality=quality)
    print(dst, im.size)


import os
star_cut(os.path.join(SRC, "1d8b72df-8f1f-415f-9dfb-5f6c8b8d4126.png"),
         os.path.join(DST, "LS_S_1.png"))
star_cut(os.path.join(SRC, "ハクティバ・パラニド.png"),
         os.path.join(DST, "LS_S_3.png"))
info_jpeg(os.path.join(SRC, "c57bad32-5507-4436-aaa3-c28db50e07e1.png"),
          os.path.join(DST, "Dogma_info.jpg"))
emblem_cut(os.path.join(EMB, "IGA_emblem.png"),
           os.path.join(EMB, "IGA_emblem_t.png"))

# 検証: 市松模様に合成して透過を目視確認できる画像を出力
CHK = r"C:\Users\catso\AppData\Local\Temp\claude\C--Users-catso-Desktop-SFData\e4e9ab1c-942c-476d-9a78-ab81c1904e0f\scratchpad"
for name in ("LS_S_1.png", "LS_S_3.png"):
    img = Image.open(os.path.join(DST, name)).convert("RGBA")
    tile = 40
    bg = Image.new("RGB", img.size)
    px = np.zeros((img.height, img.width, 3), np.uint8)
    yy, xx = np.mgrid[0:img.height, 0:img.width]
    checker = (((yy // tile) + (xx // tile)) % 2).astype(bool)
    px[checker] = (70, 40, 90)
    px[~checker] = (25, 45, 65)
    bg = Image.fromarray(px)
    bg.paste(img, (0, 0), img)
    bg.save(os.path.join(CHK, "chk_" + name))
    print("check:", name)
