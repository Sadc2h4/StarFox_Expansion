# -*- coding: utf-8 -*-
# factions.html 用 勢力分布ヘックスマップ SVG ジェネレータ(全44セクター+分割版)
# 実行すると database/factions.html の <!-- FACMAP:BEGIN --> 〜 <!-- FACMAP:END --> を差し替える
import math, io, os, json, re

R = 44
MX, MY = 66, 60
SQ3 = math.sqrt(3)
COL_MIN, ROW_MIN = -3, -2.0

FACTIONS = {
    "republic": {"fill": "#265f8f", "hi": "#7fc0ee", "name": "コーネリア連合共和国", "anchor": "#cornerian-republic", "emblem": "Corneria_emblem.png"},
    "empire":   {"fill": "#8f2f38", "hi": "#f0a0a8", "name": "ベノム帝国", "anchor": "#venom-empire", "emblem": "Venom_emblem.png"},
    "hactiva":  {"fill": "#5d3f8f", "hi": "#c9a6f2", "name": "ハクティバ通商連合", "anchor": "#hactiva-union", "emblem": "Haktiva_emblem.png"},
    "saurian":  {"fill": "#2f6f42", "hi": "#8fe0a8", "name": "サウリアン同盟", "anchor": "#saurian-alliance", "emblem": "Saurian_emblem.png"},
    "garou":    {"fill": "#8f7716", "hi": "#f0d878", "name": "ガロウ連邦", "anchor": "#garou-federation", "emblem": "Garou_emblem.png"},
    "iga":      {"fill": "#8f4716", "hi": "#f0a060", "name": "独立星系連合（残党）", "anchor": "#iga", "emblem": "IGA_emblem.png"},
    "neutral":  {"fill": "#2c3838", "hi": "#8fa8a2", "name": "中立・無所属", "anchor": None, "emblem": None},
}

# (id, col, rowv, faction, 表示文字, 地名, ストライプ相手, capital)
HEXES = [
    # ── 共和国コアワールド(左) ──
    ("beta",   -2,  0.0, "republic", "β", "コーネリア",       None,      True),
    ("zeta",   -3, -0.5, "republic", "ζ", "スターブレード",   None,      False),
    ("theta",  -2, -1.0, "republic", "θ", "プロスペロー",     "empire",  False),
    ("epsilon",-2,  1.0, "republic", "ε", "AREA3",            None,      False),
    ("gamma",  -1, -0.5, "republic", "γ", "カタリナ",         "empire",  False),
    ("alpha2", -1,  0.5, "republic", "α-2", "ブラグザ基地",   None,      False),
    ("alpha3", -1,  1.5, "neutral",  "α-3", "恒星圏外周",     None,      False),
    ("iota",   -1, -1.5, "republic", "ι", "オベロンⅡ",       None,      False),
    ("rho",    -2, -2.0, "republic", "ρ", "第4宙域",          None,      False),
    ("pi",     -3, -1.5, "neutral",  "π", "封印宙域",         None,      False),
    ("fei",    -1,  2.5, "republic", "ⲋ", "南凪",             None,      False),
    # ── グレートウォール(コーネリアの前に立つ壁) ──
    ("delta1",  0, -1.0, "republic", "δ-1", "グレートウォール", None,    False),
    ("delta2",  0,  0.0, "republic", "δ-2", "グレートウォール", None,    False),
    ("delta3",  0,  1.0, "republic", "δ-3", "グレートウォール", None,    False),
    # ── 恒星宙域・中間 ──
    ("kappa",   1, -1.5, "republic", "κ", "ペルディタ",       None,      False),
    ("alpha1",  1, -0.5, "neutral",  "α-1", "恒星中枢",       None,      False),
    ("sampi",   1,  0.5, "republic", "Ϡ", "グリーン・ビット", "saurian", False),
    # ── サウリアン同盟 ──
    ("lambda",  1,  1.5, "saurian",  "λ", "フォルトナ",       None,      True),
    ("nyi",     2,  2.0, "saurian",  "ⳡ", "回遊宙域",         None,      False),
    # ── サルガッソー帯(共和国と帝国の間) ──
    ("upsilon2",2, -2.0, "neutral",  "υ-2", "サルガッソー",   None,      False),
    ("upsilon1",2, -1.0, "neutral",  "υ-1", "サルガッソー",   None,      False),
    ("phi",     2,  0.0, "republic", "φ", "トリンキュロー",   "empire",  False),
    ("chi",     2,  1.0, "neutral",  "χ", "タイタニア",       None,      False),
    ("upsilon3",2,  3.0, "neutral",  "υ-3", "宇宙の墓場",     None,      False),
    # ── 帝国+ソーラ圏(サルガッソー帯の右) ──
    ("tau",     3, -1.5, "empire",   "τ", "廃墟宙域",         "both",    False),
    ("sigma",   3, -0.5, "empire",   "ς", "マクベス",         None,      False),
    ("nu",      3,  0.5, "empire",   "ν", "ゾネス",           None,      False),
    ("mu",      3,  1.5, "republic", "μ", "アクアス",         None,      False),
    ("hori",    4, -2.0, "neutral",  "ϩ", "彗星回廊",         None,      False),
    ("psi",     4, -1.0, "empire",   "ψ", "AREA6",            None,      False),
    ("omega",   4,  0.0, "empire",   "Ω", "ベノム",           None,      True),
    ("omicron", 4,  1.0, "republic", "ο", "ソーラ戦線",       "empire",  False),
    ("xi",      4,  2.0, "republic", "ξ", "フィチナ",         None,      False),
    ("khei",    5, -1.5, "republic", "ϧ", "入航の道",         "empire",  False),
    # ── 中間帯(共同統治) ──
    ("chima",   5,  0.5, "republic", "ϭ", "東凪",             "hactiva", False),
    ("ya",      6,  0.0, "empire",   "ϊ", "静電の海",         "hactiva", False),
    # ── ハクティバ圏 ──
    ("heta",    6,  1.0, "hactiva",  "Ͱ", "パペトゥーン",     "republic",False),
    ("digamma", 6,  2.0, "hactiva",  "ϝ", "エラダード",       None,      False),
    ("stigma",  7,  0.5, "hactiva",  "Ϛ", "キュー",           None,      True),
    ("san",     7,  1.5, "hactiva",  "ϻ", "双子星宙域",       None,      False),
    ("dasia",   7,  2.5, "hactiva",  "’", "ピリオド",         None,      False),
    ("shei",    8,  3.0, "neutral",  "ϣ", "西凪",             None,      False),
    # ── セティボス圏(衛星別) ──
    ("janja2",  8,  0.0, "hactiva",  "ϫ-2", "セティボスⅡ",   "empire",  False),
    ("janja1",  8,  1.0, "hactiva",  "ϫ-1", "セティボス",     None,      False),
    ("lunate1", 8,  2.0, "garou",    "Ͼ-1", "セティボスⅢ",   None,      True),
    ("lunate2", 9,  1.5, "garou",    "Ͼ-2", "セティボスⅣ",   None,      False),
    ("lunate3", 9,  2.5, "garou",    "Ͼ-3", "セティボスⅥ",   None,      False),
    ("dasitetas",9, 0.5, "republic", "ꟶ", "ムィンシャンクル", "hactiva", False),
    # ── 北凪(IGA残党) ──
    ("ngii",    9, -0.5, "iga",      "ⳟ", "北凪",             None,      True),
    # ── フロンティア〜ルビコン(右外縁) ──
    ("vau",    10,  0.0, "hactiva",  "ⳣ", "氷晶帯",           None,      False),
    ("koppa",  11,  0.5, "republic", "Ϟ", "グリッピア",       None,      False),
    ("gain",   11, -0.5, "neutral",  "Ƣ", "オービタル・ゲート", None,    False),
    ("sho",    12, -1.0, "neutral",  "ϸ", "ドグマ",           None,      False),
    ("yot",    12,  0.0, "neutral",  "j", "未踏宙域",         None,      False),
]

# オレンジ枠+明滅を掛けるサルガッソー系宙域
SARGASSO_IDS = {"upsilon1", "upsilon2", "upsilon3", "chi"}

# ツールチップの所属表記の上書き
OWNER_LABEL = {
    "sampi": "共和国・サウリアン同盟 共同統治",
    "chima": "共和国・通商連合 共同管理",
    "ya":    "帝国・通商連合 共同統治",
    "heta":  "通商連合圏・共和国実効統治",
    "gamma": "共和国 — 前線",
    "theta": "係争 — 市街地占領下",
    "omicron": "共和国 — 新戦線",
    "phi":   "係争 — 両軍最前線",
    "khei":  "共和国 — 先端は帝国防衛線下",
    "tau":   "無主 — 帝国が作戦利用",
    "koppa": "共和国領 — 企業私有",
    "dasitetas": "共和国・通商連合 共同管理 — 司法は共和国専管",
    "janja2": "通商連合管轄 — 帝国軍駐屯・実質共同管理",
}

# 勢力名タグの位置(仮想ヘックス座標)
FAC_TAGS = {
    "republic": (-3, 0.95),
    "empire":   (5, -0.5),
    "hactiva":  (6, 3.0),
    "saurian":  (0, 2.0),
    "garou":    (10, 2.0),
    "iga":      (9, -1.5),
}

STRIPES = {
    ("republic", "empire"):  "stEmpireOnRep",
    ("neutral",  "empire"):  "stBoth",
    ("hactiva",  "republic"): "stRepOnHac",
    ("republic", "hactiva"): "stHacOnRep",
    ("empire",   "hactiva"): "stHacOnEmp",
    ("hactiva",  "empire"):  "stEmpOnHac",
    ("republic", "saurian"): "stSauOnRep",
    ("empire",   "both"):    "stBoth",
}

ORDER = ["neutral", "republic", "empire", "hactiva", "saurian", "garou", "iga"]
PATTERNS = [
    ("stEmpireOnRep", FACTIONS["republic"]["fill"], FACTIONS["empire"]["fill"]),
    ("stBoth",        FACTIONS["neutral"]["fill"],  FACTIONS["empire"]["fill"]),
    ("stRepOnHac",    FACTIONS["hactiva"]["fill"],  FACTIONS["republic"]["fill"]),
    ("stHacOnRep",    FACTIONS["republic"]["fill"], "#7a55c0"),
    ("stHacOnEmp",    FACTIONS["empire"]["fill"],   "#7a55c0"),
    ("stEmpOnHac",    FACTIONS["hactiva"]["fill"],  FACTIONS["empire"]["fill"]),
    ("stSauOnRep",    FACTIONS["republic"]["fill"], "#3f9f5c"),
]

DEFAULT_DATA = {
    "factions": FACTIONS,
    "order": ORDER,
    "hexes": [
        {"id": hid, "col": col, "row": row, "faction": faction, "letter": letter,
         "name": name, "stripe": stripe, "capital": capital}
        for hid, col, row, faction, letter, name, stripe, capital in HEXES
    ],
    "sargasso": ["upsilon1", "upsilon2", "upsilon3", "chi"],
    "ownerLabel": OWNER_LABEL,
    "facTags": {key: list(value) for key, value in FAC_TAGS.items()},
    "stripes": [[fac, stripe, pattern] for (fac, stripe), pattern in STRIPES.items()],
    "patterns": [list(pattern) for pattern in PATTERNS],
    "layout": {"R": R, "MX": MX, "MY": MY, "COL_MIN": COL_MIN, "ROW_MIN": ROW_MIN},
    "footerLeft": "GRID: SCHEMATIC / NOT TO SCALE — ALL 45 SECTORS",
    "footerRight": "CIS-HQ 04 // FACTION DB",
}

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database", "factions.html")
with io.open(path, "r", encoding="utf-8") as fp:
    html = fp.read()

BEGIN = "<!-- FACMAP:BEGIN (image_tools/gen_faction_hexmap.py で自動生成) -->"
END = "<!-- FACMAP:END -->"
begin_index, end_index = html.index(BEGIN), html.index(END)
data_match = re.search(r"<!-- FACMAP:DATA (.*?) -->", html[begin_index:end_index])
data = json.loads(data_match.group(1)) if data_match else DEFAULT_DATA

FACTIONS = data["factions"]
ORDER = data["order"]
HEXES = [
    (h["id"], h["col"], h["row"], h["faction"], h["letter"], h["name"], h.get("stripe"), h.get("capital", False))
    for h in data["hexes"]
]
SARGASSO_IDS = set(data.get("sargasso", []))
OWNER_LABEL = data.get("ownerLabel", {})
FAC_TAGS = {key: tuple(value) for key, value in data.get("facTags", {}).items()}
STRIPES = {(fac, stripe): pattern for fac, stripe, pattern in data.get("stripes", [])}
PATTERNS = data.get("patterns", [])
layout = data["layout"]
R, MX, MY = layout["R"], layout["MX"], layout["MY"]
COL_MIN, ROW_MIN = layout["COL_MIN"], layout["ROW_MIN"]
FOOTER_LEFT = data.get("footerLeft", "GRID: SCHEMATIC / NOT TO SCALE — ALL 45 SECTORS")
FOOTER_RIGHT = data.get("footerRight", "CIS-HQ 04 // FACTION DB")

def center(col, rowv):
    x = MX + R + 1.5 * R * (col - COL_MIN)
    y = MY + R + SQ3 * R * (rowv - ROW_MIN)
    return x, y

def hex_points(cx, cy, r):
    pts = []
    for i in range(6):
        a = math.radians(60 * i)
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return " ".join(pts)

xs, ys = [], []
for _, c, rv, *_ in HEXES:
    x, y = center(c, rv)
    xs.append(x); ys.append(y)
for c, rv in FAC_TAGS.values():
    x, y = center(c, rv)
    xs.append(x); ys.append(y)
W = max(xs) + R + MX - 20
H = max(ys) + R * SQ3 / 2 + 30

out = []
out.append(f'<svg class="facmap" viewBox="0 0 {W:.0f} {H:.0f}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="勢力分布早見表">')
out.append('  <defs>')
for pid, base, line in PATTERNS:
    out.append(f'    <pattern id="{pid}" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">')
    out.append(f'      <rect width="12" height="12" fill="{base}"/>')
    out.append(f'      <rect width="5" height="12" fill="{line}" opacity="0.75"/>')
    out.append('    </pattern>')
out.append('    <pattern id="mapDots" width="26" height="26" patternUnits="userSpaceOnUse">')
out.append('      <circle cx="1.2" cy="1.2" r="1.1" fill="rgba(143,168,162,0.16)"/>')
out.append('    </pattern>')
out.append('    <pattern id="hexScan" width="6" height="3" patternUnits="userSpaceOnUse">')
out.append('      <rect width="6" height="1.1" fill="rgba(0,0,0,0.30)"/>')
out.append('    </pattern>')
out.append('  </defs>')

# 計器風装飾
fx, fy, fw, fh = 6, 6, W - 12, H - 12
out.append(f'  <rect x="{fx}" y="{fy}" width="{fw:.0f}" height="{fh:.0f}" fill="url(#mapDots)"/>')
out.append(f'  <rect x="{fx}" y="{fy}" width="{fw:.0f}" height="{fh:.0f}" fill="none" stroke="rgba(255,136,136,0.16)" stroke-width="1"/>')
ticks = []
x = 86
while x < W - 20:
    ticks.append(f"M{x} {fy}v7"); ticks.append(f"M{x} {fy+fh:.0f}v-7")
    x += 80
y = 66
while y < H - 20:
    ticks.append(f"M{fx} {y}h7"); ticks.append(f"M{fx+fw:.0f} {y}h-7")
    y += 60
out.append(f'  <path d="{"".join(ticks)}" stroke="rgba(255,187,170,0.28)" stroke-width="1"/>')
out.append(f'  <path d="M{fx} {fy+24}V{fy}h24M{fx+fw-24:.0f} {fy}h24v24M{fx+fw:.0f} {fy+fh-24:.0f}v24h-24M{fx+24} {fy+fh:.0f}H{fx}v-24" fill="none" stroke="#ff8888" stroke-opacity="0.5" stroke-width="2"/>')
out.append(f'  <text x="{fx+10}" y="{fy+fh-9:.0f}" font-size="8" fill="rgba(255,187,170,0.4)" letter-spacing="2">{FOOTER_LEFT}</text>')
out.append(f'  <text x="{fx+fw-10:.0f}" y="{fy+fh-9:.0f}" text-anchor="end" font-size="8" fill="rgba(255,187,170,0.4)" letter-spacing="2">{FOOTER_RIGHT}</text>')

by_fac = {}
for h in HEXES:
    by_fac.setdefault(h[3], []).append(h)

for fac in ORDER:
    items = by_fac.get(fac, [])
    if not items:
        continue
    f = FACTIONS[fac]
    if f["anchor"]:
        out.append(f'  <a href="{f["anchor"]}" class="fac-link" aria-label="{f["name"]}">')
        out.append('  <g class="fac-group">')
    else:
        out.append('  <g class="fac-group fac-neutral">')
    for hid, col, rowv, _, letter, name, stripe, capital in items:
        cx, cy = center(col, rowv)
        pts = hex_points(cx, cy, R - 2.5)
        fill = STRIPES.get((fac, stripe), f["fill"]) if stripe else f["fill"]
        if stripe and (fac, stripe) in STRIPES:
            fill = f'url(#{STRIPES[(fac, stripe)]})'
        owner = OWNER_LABEL.get(hid, f["name"])
        if hid in SARGASSO_IDS:
            out.append(f'    <polygon class="hex-sargasso" points="{pts}" fill="{fill}" stroke="#ffa04a" stroke-width="1.8" stroke-opacity="0.9"><title>セクター{letter} — {name}（{owner}）</title></polygon>')
        else:
            out.append(f'    <polygon points="{pts}" fill="{fill}" stroke="{f["hi"]}" stroke-width="1.4" stroke-opacity="0.55"><title>セクター{letter} — {name}（{owner}）</title></polygon>')
        out.append(f'    <polygon points="{pts}" fill="url(#hexScan)" style="pointer-events:none;"/>')
        lsize = 13 if len(letter) > 1 else 16
        if capital and f["emblem"]:
            es = 44
            out.append(f'    <circle cx="{cx:.1f}" cy="{cy-4:.1f}" r="27" fill="rgba(5,9,12,0.82)" stroke="{f["hi"]}" stroke-width="1.2" stroke-opacity="0.6"/>')
            out.append(f'    <image class="fac-emblem" href="../resource/emblem/{f["emblem"]}" x="{cx-es/2:.1f}" y="{cy-es/2-4:.1f}" width="{es}" height="{es}"/>')
            out.append(f'    <text x="{cx:.1f}" y="{cy-R+12:.1f}" text-anchor="middle" font-size="10" fill="{f["hi"]}" opacity="0.9">{letter}</text>')
            out.append(f'    <text x="{cx:.1f}" y="{cy+R-13:.1f}" text-anchor="middle" font-size="8" fill="#e8f2ee">{name}</text>')
        else:
            out.append(f'    <text x="{cx:.1f}" y="{cy-2:.1f}" text-anchor="middle" font-size="{lsize}" fill="{f["hi"]}" opacity="0.9">{letter}</text>')
            out.append(f'    <text x="{cx:.1f}" y="{cy+13:.1f}" text-anchor="middle" font-size="8" fill="#cfe0da">{name}</text>')
    if fac in FAC_TAGS:
        tc, tr = FAC_TAGS[fac]
        tx, ty = center(tc, tr)
        tw = len(f["name"]) * 10.5 + 16
        out.append(f'    <rect x="{tx-tw/2:.1f}" y="{ty-9:.1f}" width="{tw:.1f}" height="17" rx="2" fill="rgba(5,9,12,0.85)" stroke="{f["hi"]}" stroke-width="0.8" stroke-opacity="0.6"/>')
        out.append(f'    <text x="{tx:.1f}" y="{ty+3.5:.1f}" text-anchor="middle" font-size="10.5" font-weight="bold" fill="{f["hi"]}" class="fac-name">{f["name"]}</text>')
    out.append('  </g>')
    if f["anchor"]:
        out.append('  </a>')

out.append('</svg>')
svg = "\n".join(out)

i, j = html.index(BEGIN), html.index(END)
data_json = json.dumps(data, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
html = html[: i + len(BEGIN)] + "\n<!-- FACMAP:DATA " + data_json + " -->\n" + svg + "\n" + html[j:]
with io.open(path, "w", encoding="utf-8", newline="") as fp:
    fp.write(html)
print("spliced", f"{W:.0f}x{H:.0f}", len(HEXES), "hexes")
