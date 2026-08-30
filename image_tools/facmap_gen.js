(function (root, factory) {
  "use strict";
  var api = factory();
  root.generateFacmapSvg = api.generateFacmapSvg;
  root.FACMAP_DEFAULT_DATA = api.defaultData;
  root.serializeFacmapData = api.serializeFacmapData;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DEFAULT_DATA = {"factions":{"republic":{"fill":"#265f8f","hi":"#7fc0ee","name":"コーネリア連合共和国","anchor":"#cornerian-republic","emblem":"Corneria_emblem.png"},"empire":{"fill":"#8f2f38","hi":"#f0a0a8","name":"ベノム帝国","anchor":"#venom-empire","emblem":"Venom_emblem.png"},"hactiva":{"fill":"#5d3f8f","hi":"#c9a6f2","name":"ハクティバ通商連合","anchor":"#hactiva-union","emblem":"Haktiva_emblem.png"},"saurian":{"fill":"#2f6f42","hi":"#8fe0a8","name":"サウリアン同盟","anchor":"#saurian-alliance","emblem":"Saurian_emblem.png"},"garou":{"fill":"#8f7716","hi":"#f0d878","name":"ガロウ連邦","anchor":"#garou-federation","emblem":"Garou_emblem.png"},"iga":{"fill":"#8f4716","hi":"#f0a060","name":"独立星系連合（残党）","anchor":"#iga","emblem":"IGA_emblem.png"},"neutral":{"fill":"#2c3838","hi":"#8fa8a2","name":"中立・無所属","anchor":null,"emblem":null}},"order":["neutral","republic","empire","hactiva","saurian","garou","iga"],"hexes":[{"id":"beta","col":-2,"row":0.0,"faction":"republic","letter":"β","name":"コーネリア","stripe":null,"capital":true},{"id":"zeta","col":-3,"row":-0.5,"faction":"republic","letter":"ζ","name":"スターブレード","stripe":null,"capital":false},{"id":"theta","col":-2,"row":-1.0,"faction":"republic","letter":"θ","name":"プロスペロー","stripe":"empire","capital":false},{"id":"epsilon","col":-2,"row":1.0,"faction":"republic","letter":"ε","name":"AREA3","stripe":null,"capital":false},{"id":"gamma","col":-1,"row":-0.5,"faction":"republic","letter":"γ","name":"カタリナ","stripe":"empire","capital":false},{"id":"alpha2","col":-1,"row":0.5,"faction":"republic","letter":"α-2","name":"ブラグザ基地","stripe":null,"capital":false},{"id":"alpha3","col":-1,"row":1.5,"faction":"neutral","letter":"α-3","name":"恒星圏外周","stripe":null,"capital":false},{"id":"iota","col":-1,"row":-1.5,"faction":"republic","letter":"ι","name":"オベロンⅡ","stripe":null,"capital":false},{"id":"rho","col":-2,"row":-2.0,"faction":"republic","letter":"ρ","name":"第4宙域","stripe":null,"capital":false},{"id":"pi","col":-3,"row":-1.5,"faction":"neutral","letter":"π","name":"封印宙域","stripe":null,"capital":false},{"id":"fei","col":-1,"row":2.5,"faction":"republic","letter":"ⲋ","name":"南凪","stripe":null,"capital":false},{"id":"delta1","col":0,"row":-1.0,"faction":"republic","letter":"δ-1","name":"グレートウォール","stripe":null,"capital":false},{"id":"delta2","col":0,"row":0.0,"faction":"republic","letter":"δ-2","name":"グレートウォール","stripe":null,"capital":false},{"id":"delta3","col":0,"row":1.0,"faction":"republic","letter":"δ-3","name":"グレートウォール","stripe":null,"capital":false},{"id":"kappa","col":1,"row":-1.5,"faction":"republic","letter":"κ","name":"ペルディタ","stripe":null,"capital":false},{"id":"alpha1","col":1,"row":-0.5,"faction":"neutral","letter":"α-1","name":"恒星中枢","stripe":null,"capital":false},{"id":"sampi","col":1,"row":0.5,"faction":"republic","letter":"Ϡ","name":"グリーン・ビット","stripe":"saurian","capital":false},{"id":"lambda","col":1,"row":1.5,"faction":"saurian","letter":"λ","name":"フォルトナ","stripe":null,"capital":true},{"id":"nyi","col":2,"row":2.0,"faction":"saurian","letter":"ⳡ","name":"回遊宙域","stripe":null,"capital":false},{"id":"upsilon2","col":2,"row":-2.0,"faction":"neutral","letter":"υ-2","name":"サルガッソー","stripe":null,"capital":false},{"id":"upsilon1","col":2,"row":-1.0,"faction":"neutral","letter":"υ-1","name":"サルガッソー","stripe":null,"capital":false},{"id":"phi","col":2,"row":0.0,"faction":"republic","letter":"φ","name":"トリンキュロー","stripe":"empire","capital":false},{"id":"chi","col":2,"row":1.0,"faction":"neutral","letter":"χ","name":"タイタニア","stripe":null,"capital":false},{"id":"upsilon3","col":2,"row":3.0,"faction":"neutral","letter":"υ-3","name":"宇宙の墓場","stripe":null,"capital":false},{"id":"tau","col":3,"row":-1.5,"faction":"empire","letter":"τ","name":"廃墟宙域","stripe":"both","capital":false},{"id":"sigma","col":3,"row":-0.5,"faction":"empire","letter":"ς","name":"マクベス","stripe":null,"capital":false},{"id":"nu","col":3,"row":0.5,"faction":"empire","letter":"ν","name":"ゾネス","stripe":null,"capital":false},{"id":"mu","col":3,"row":1.5,"faction":"republic","letter":"μ","name":"アクアス","stripe":null,"capital":false},{"id":"hori","col":4,"row":-2.0,"faction":"neutral","letter":"ϩ","name":"彗星回廊","stripe":null,"capital":false},{"id":"psi","col":4,"row":-1.0,"faction":"empire","letter":"ψ","name":"AREA6","stripe":null,"capital":false},{"id":"omega","col":4,"row":0.0,"faction":"empire","letter":"Ω","name":"ベノム","stripe":null,"capital":true},{"id":"omicron","col":4,"row":1.0,"faction":"republic","letter":"ο","name":"ソーラ戦線","stripe":"empire","capital":false},{"id":"xi","col":4,"row":2.0,"faction":"republic","letter":"ξ","name":"フィチナ","stripe":null,"capital":false},{"id":"khei","col":5,"row":-1.5,"faction":"republic","letter":"ϧ","name":"入航の道","stripe":"empire","capital":false},{"id":"chima","col":5,"row":0.5,"faction":"republic","letter":"ϭ","name":"東凪","stripe":"hactiva","capital":false},{"id":"ya","col":6,"row":0.0,"faction":"empire","letter":"ϊ","name":"静電の海","stripe":"hactiva","capital":false},{"id":"heta","col":6,"row":1.0,"faction":"hactiva","letter":"Ͱ","name":"パペトゥーン","stripe":"republic","capital":false},{"id":"digamma","col":6,"row":2.0,"faction":"hactiva","letter":"ϝ","name":"エラダード","stripe":null,"capital":false},{"id":"stigma","col":7,"row":0.5,"faction":"hactiva","letter":"Ϛ","name":"キュー","stripe":null,"capital":true},{"id":"san","col":7,"row":1.5,"faction":"hactiva","letter":"ϻ","name":"双子星宙域","stripe":null,"capital":false},{"id":"dasia","col":7,"row":2.5,"faction":"hactiva","letter":"’","name":"ピリオド","stripe":null,"capital":false},{"id":"shei","col":8,"row":3.0,"faction":"neutral","letter":"ϣ","name":"西凪","stripe":null,"capital":false},{"id":"janja2","col":8,"row":0.0,"faction":"hactiva","letter":"ϫ-2","name":"セティボスⅡ","stripe":"empire","capital":false},{"id":"janja1","col":8,"row":1.0,"faction":"hactiva","letter":"ϫ-1","name":"セティボス","stripe":null,"capital":false},{"id":"lunate1","col":8,"row":2.0,"faction":"garou","letter":"Ͼ-1","name":"セティボスⅢ","stripe":null,"capital":true},{"id":"lunate2","col":9,"row":1.5,"faction":"garou","letter":"Ͼ-2","name":"セティボスⅣ","stripe":null,"capital":false},{"id":"lunate3","col":9,"row":2.5,"faction":"garou","letter":"Ͼ-3","name":"セティボスⅥ","stripe":null,"capital":false},{"id":"dasitetas","col":9,"row":0.5,"faction":"republic","letter":"ꟶ","name":"ムィンシャンクル","stripe":"hactiva","capital":false},{"id":"ngii","col":9,"row":-0.5,"faction":"iga","letter":"ⳟ","name":"北凪","stripe":null,"capital":true},{"id":"vau","col":10,"row":0.0,"faction":"hactiva","letter":"ⳣ","name":"氷晶帯","stripe":null,"capital":false},{"id":"koppa","col":11,"row":0.5,"faction":"republic","letter":"Ϟ","name":"グリッピア","stripe":null,"capital":false},{"id":"gain","col":11,"row":-0.5,"faction":"neutral","letter":"Ƣ","name":"オービタル・ゲート","stripe":null,"capital":false},{"id":"sho","col":12,"row":-1.0,"faction":"neutral","letter":"ϸ","name":"ドグマ","stripe":null,"capital":false},{"id":"yot","col":12,"row":0.0,"faction":"neutral","letter":"j","name":"未踏宙域","stripe":null,"capital":false}],"sargasso":["upsilon1","upsilon2","upsilon3","chi"],"ownerLabel":{"sampi":"共和国・サウリアン同盟 共同統治","chima":"共和国・通商連合 共同管理","ya":"帝国・通商連合 共同統治","heta":"通商連合圏・共和国実効統治","gamma":"共和国 — 前線","theta":"係争 — 市街地占領下","omicron":"共和国 — 新戦線","phi":"係争 — 両軍最前線","khei":"共和国 — 先端は帝国防衛線下","tau":"無主 — 帝国が作戦利用","koppa":"共和国領 — 企業私有","dasitetas":"共和国・通商連合 共同管理 — 司法は共和国専管","janja2":"通商連合管轄 — 帝国軍駐屯・実質共同管理"},"facTags":{"republic":[-3,0.95],"empire":[5,-0.5],"hactiva":[6,3.0],"saurian":[0,2.0],"garou":[10,2.0],"iga":[9,-1.5]},"stripes":[["republic","empire","stEmpireOnRep"],["neutral","empire","stBoth"],["hactiva","republic","stRepOnHac"],["republic","hactiva","stHacOnRep"],["empire","hactiva","stHacOnEmp"],["hactiva","empire","stEmpOnHac"],["republic","saurian","stSauOnRep"],["empire","both","stBoth"]],"patterns":[["stEmpireOnRep","#265f8f","#8f2f38"],["stBoth","#2c3838","#8f2f38"],["stRepOnHac","#5d3f8f","#265f8f"],["stHacOnRep","#265f8f","#7a55c0"],["stHacOnEmp","#8f2f38","#7a55c0"],["stEmpOnHac","#5d3f8f","#8f2f38"],["stSauOnRep","#265f8f","#3f9f5c"]],"layout":{"R":44,"MX":66,"MY":60,"COL_MIN":-3,"ROW_MIN":-2.0},"footerLeft":"GRID: SCHEMATIC / NOT TO SCALE — ALL 45 SECTORS","footerRight":"CIS-HQ 04 // FACTION DB"};

  function f1(n) {
    var sign = n < 0 ? "-" : "", scaled = Math.abs(n) * 10;
    var floor = Math.floor(scaled), fraction = scaled - floor, rounded;
    if (fraction < 0.5) rounded = floor;
    else if (fraction > 0.5) rounded = floor + 1;
    else rounded = floor % 2 === 0 ? floor : floor + 1;
    return sign + Math.floor(rounded / 10) + "." + (rounded % 10);
  }
  function f0(n) {
    var floor = Math.floor(n), fraction = n - floor;
    if (fraction < 0.5) return String(floor);
    if (fraction > 0.5) return String(floor + 1);
    return String(floor % 2 === 0 ? floor : floor + 1);
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function center(layout, col, row) {
    return [layout.MX + layout.R + 1.5 * layout.R * (col - layout.COL_MIN),
      layout.MY + layout.R + Math.sqrt(3) * layout.R * (row - layout.ROW_MIN)];
  }
  function hexPoints(cx, cy, r) {
    var points = [];
    for (var i = 0; i < 6; i += 1) {
      var a = (60 * i) * Math.PI / 180;
      points.push(f1(cx + r * Math.cos(a)) + "," + f1(cy + r * Math.sin(a)));
    }
    return points.join(" ");
  }

  function generateFacmapSvg(data) {
    var d = data || DEFAULT_DATA, factions = d.factions, layout = d.layout;
    var R = layout.R, xs = [], ys = [], i, p, c;
    d.hexes.forEach(function (h) { c = center(layout, h.col, h.row); xs.push(c[0]); ys.push(c[1]); });
    Object.keys(d.facTags || {}).forEach(function (key) { p = d.facTags[key]; c = center(layout, p[0], p[1]); xs.push(c[0]); ys.push(c[1]); });
    var W = Math.max.apply(Math, xs) + R + layout.MX - 20;
    var H = Math.max.apply(Math, ys) + R * Math.sqrt(3) / 2 + 30;
    var out = [];
    out.push('<svg class="facmap" viewBox="0 0 ' + f0(W) + ' ' + f0(H) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="勢力分布早見表">');
    out.push('  <defs>');
    (d.patterns || []).forEach(function (pat) {
      out.push('    <pattern id="' + pat[0] + '" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">');
      out.push('      <rect width="12" height="12" fill="' + pat[1] + '"/>');
      out.push('      <rect width="5" height="12" fill="' + pat[2] + '" opacity="0.75"/>');
      out.push('    </pattern>');
    });
    out.push('    <pattern id="mapDots" width="26" height="26" patternUnits="userSpaceOnUse">');
    out.push('      <circle cx="1.2" cy="1.2" r="1.1" fill="rgba(143,168,162,0.16)"/>');
    out.push('    </pattern>');
    out.push('    <pattern id="hexScan" width="6" height="3" patternUnits="userSpaceOnUse">');
    out.push('      <rect width="6" height="1.1" fill="rgba(0,0,0,0.30)"/>');
    out.push('    </pattern>');
    out.push('  </defs>');
    var fx = 6, fy = 6, fw = W - 12, fh = H - 12;
    out.push('  <rect x="' + fx + '" y="' + fy + '" width="' + f0(fw) + '" height="' + f0(fh) + '" fill="url(#mapDots)"/>');
    out.push('  <rect x="' + fx + '" y="' + fy + '" width="' + f0(fw) + '" height="' + f0(fh) + '" fill="none" stroke="rgba(255,136,136,0.16)" stroke-width="1"/>');
    var ticks = [], x = 86, y;
    while (x < W - 20) { ticks.push("M" + x + " " + fy + "v7"); ticks.push("M" + x + " " + f0(fy + fh) + "v-7"); x += 80; }
    y = 66;
    while (y < H - 20) { ticks.push("M" + fx + " " + y + "h7"); ticks.push("M" + f0(fx + fw) + " " + y + "h-7"); y += 60; }
    out.push('  <path d="' + ticks.join("") + '" stroke="rgba(255,187,170,0.28)" stroke-width="1"/>');
    out.push('  <path d="M' + fx + ' ' + (fy + 24) + 'V' + fy + 'h24M' + f0(fx + fw - 24) + ' ' + fy + 'h24v24M' + f0(fx + fw) + ' ' + f0(fy + fh - 24) + 'v24h-24M' + (fx + 24) + ' ' + f0(fy + fh) + 'H' + fx + 'v-24" fill="none" stroke="#ff8888" stroke-opacity="0.5" stroke-width="2"/>');
    out.push('  <text x="' + (fx + 10) + '" y="' + f0(fy + fh - 9) + '" font-size="8" fill="rgba(255,187,170,0.4)" letter-spacing="2">' + d.footerLeft + '</text>');
    out.push('  <text x="' + f0(fx + fw - 10) + '" y="' + f0(fy + fh - 9) + '" text-anchor="end" font-size="8" fill="rgba(255,187,170,0.4)" letter-spacing="2">' + d.footerRight + '</text>');
    var stripeMap = {};
    (d.stripes || []).forEach(function (s) { stripeMap[s[0] + "\u0000" + s[1]] = s[2]; });
    var sargasso = {};
    (d.sargasso || []).forEach(function (id) { sargasso[id] = true; });
    (d.order || []).forEach(function (fac) {
      var items = d.hexes.filter(function (h) { return h.faction === fac; });
      if (!items.length || !factions[fac]) return;
      var faction = factions[fac];
      if (faction.anchor) {
        out.push('  <a href="' + faction.anchor + '" class="fac-link" aria-label="' + faction.name + '">');
        out.push('  <g class="fac-group">');
      } else out.push('  <g class="fac-group fac-neutral">');
      items.forEach(function (h) {
        var cp = center(layout, h.col, h.row), cx = cp[0], cy = cp[1];
        var pts = hexPoints(cx, cy, R - 2.5), pattern = h.stripe && stripeMap[fac + "\u0000" + h.stripe];
        var fill = pattern ? "url(#" + pattern + ")" : faction.fill;
        var owner = Object.prototype.hasOwnProperty.call(d.ownerLabel || {}, h.id) ? d.ownerLabel[h.id] : faction.name;
        if (sargasso[h.id]) out.push('    <polygon class="hex-sargasso" points="' + pts + '" fill="' + fill + '" stroke="#ffa04a" stroke-width="1.8" stroke-opacity="0.9"><title>セクター' + h.letter + ' — ' + h.name + '（' + owner + '）</title></polygon>');
        else out.push('    <polygon points="' + pts + '" fill="' + fill + '" stroke="' + faction.hi + '" stroke-width="1.4" stroke-opacity="0.55"><title>セクター' + h.letter + ' — ' + h.name + '（' + owner + '）</title></polygon>');
        out.push('    <polygon points="' + pts + '" fill="url(#hexScan)" style="pointer-events:none;"/>');
        var lsize = h.letter.length > 1 ? 13 : 16;
        if (h.capital && faction.emblem) {
          var es = 44;
          out.push('    <circle cx="' + f1(cx) + '" cy="' + f1(cy - 4) + '" r="27" fill="rgba(5,9,12,0.82)" stroke="' + faction.hi + '" stroke-width="1.2" stroke-opacity="0.6"/>');
          out.push('    <image class="fac-emblem" href="../resource/emblem/' + faction.emblem + '" x="' + f1(cx - es / 2) + '" y="' + f1(cy - es / 2 - 4) + '" width="' + es + '" height="' + es + '"/>');
          out.push('    <text x="' + f1(cx) + '" y="' + f1(cy - R + 12) + '" text-anchor="middle" font-size="10" fill="' + faction.hi + '" opacity="0.9">' + h.letter + '</text>');
          out.push('    <text x="' + f1(cx) + '" y="' + f1(cy + R - 13) + '" text-anchor="middle" font-size="8" fill="#e8f2ee">' + h.name + '</text>');
        } else {
          out.push('    <text x="' + f1(cx) + '" y="' + f1(cy - 2) + '" text-anchor="middle" font-size="' + lsize + '" fill="' + faction.hi + '" opacity="0.9">' + h.letter + '</text>');
          out.push('    <text x="' + f1(cx) + '" y="' + f1(cy + 13) + '" text-anchor="middle" font-size="8" fill="#cfe0da">' + h.name + '</text>');
        }
      });
      if (d.facTags && d.facTags[fac]) {
        var tag = d.facTags[fac], tc = center(layout, tag[0], tag[1]), tx = tc[0], ty = tc[1], tw = faction.name.length * 10.5 + 16;
        out.push('    <rect x="' + f1(tx - tw / 2) + '" y="' + f1(ty - 9) + '" width="' + f1(tw) + '" height="17" rx="2" fill="rgba(5,9,12,0.85)" stroke="' + faction.hi + '" stroke-width="0.8" stroke-opacity="0.6"/>');
        out.push('    <text x="' + f1(tx) + '" y="' + f1(ty + 3.5) + '" text-anchor="middle" font-size="10.5" font-weight="bold" fill="' + faction.hi + '" class="fac-name">' + faction.name + '</text>');
      }
      out.push('  </g>');
      if (faction.anchor) out.push('  </a>');
    });
    out.push('</svg>');
    return out.join("\n");
  }

  function serializeFacmapData(data) {
    return JSON.stringify(data);
  }

  return { generateFacmapSvg: generateFacmapSvg, defaultData: clone(DEFAULT_DATA), serializeFacmapData: serializeFacmapData };
}));
