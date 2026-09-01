/* ═══ 3表示モード共通スクリプト（カード / ブロック / リスト） ═══
   glossary.html のインライン実装を共通化したもの（glossary / locations は独自実装のまま）。
   ページ側で window.GLS_VIEW を定義してから読み込む:
     storageKey  … localStorage キー（例 'charDispMode'）
     defaultMode … 'card' | 'block' | 'list'（初回表示。保存済み選択が優先される）
     cardLabel   … カード左上のラベル（例 'RECORD // PERSONNEL'）
     bands       … ブロック表示の帯 [{ type, label }]（記事の data-type と対応）
   必要なHTML: glossary.html と同じ id 構成
     glsStage / glsTrack / glsPrev / glsNext / blkView / glsIndexOverlay / glsIndexList /
     glsFilterBtn / glsIndexBtn / dispCard / dispBlock / dispList /
     blkBackdrop / blkClose / glsScrub / glsScrubTrack / glsScrubThumb / glsCounter / glsName /
     locFilter（フィルタボタン列） */
(function() {
  const CFG = window.GLS_VIEW || {};
  const STORAGE_KEY = CFG.storageKey || 'glsDispMode';
  const DEFAULT_MODE = CFG.defaultMode || 'card';
  const CARD_LABEL = CFG.cardLabel || 'RECORD // DATABASE';
  const BANDS = CFG.bands || [];

  const stage   = document.getElementById('glsStage');
  const track   = document.getElementById('glsTrack');
  const filter  = document.getElementById('locFilter');
  if (!stage || !track || !filter) return;
  const mainEl = document.querySelector('.gls-main');
  const inListMode = () => mainEl.classList.contains('mode-list');
  const inBlockMode = () => mainEl.classList.contains('mode-block');

  /* ── 素の <article class="codex-entry"> をカード枠で包む ──
     記事の追加は article を置くだけでよい（枠はここで自動生成） */
  const SEGS =
    '<i class="seg h s1"></i><i class="seg h s2"></i><i class="seg h s3"></i>' +
    '<i class="seg h s4"></i><i class="seg h s5"></i><i class="seg h s6"></i>' +
    '<i class="seg v s7"></i><i class="seg v s8"></i>';
  Array.from(track.children)
    .filter((el) => el.matches && el.matches('article.codex-entry'))
    .forEach((a) => {
      const card = document.createElement('div');
      card.className = 'gcard';
      card.innerHTML =
        '<div class="gcard-frame"></div><div class="gcard-inner"></div>' + SEGS +
        '<div class="gcard-label">' + CARD_LABEL + '</div>';
      const body = document.createElement('div');
      body.className = 'gcard-body';
      track.replaceChild(card, a);
      body.appendChild(a);
      card.appendChild(body);
    });

  const cards   = Array.from(track.querySelectorAll('.gcard'));
  const prevBtn = document.getElementById('glsPrev');
  const nextBtn = document.getElementById('glsNext');
  const counter = document.getElementById('glsCounter');
  const nameEl  = document.getElementById('glsName');
  const idxBtn  = document.getElementById('glsIndexBtn');
  const idxOverlay = document.getElementById('glsIndexOverlay');
  const idxList = document.getElementById('glsIndexList');

  const GAP = 28;
  let deck = cards.slice();   // 現在のフィルタで表示中のカード列
  let cur = 0;                // deck 内の現在位置

  const entryOf = (card) => card.querySelector('.codex-entry');
  const titleOf = (card) => {
    const h = entryOf(card).querySelector('.codex-h');
    const clone = h.cloneNode(true);
    const en = clone.querySelector('.en'); if (en) en.remove();
    return clone.textContent.trim();
  };

  function slideWidth() {
    const w = stage.clientWidth;
    return Math.min(1180, Math.max(320, Math.round(w * 0.85)));
  }

  function layout(animate = true) {
    stage.scrollLeft = 0;   // ブラウザ標準のアンカースクロール対策
    const sw = slideWidth();
    track.style.setProperty('--slide-w', sw + 'px');
    cards.forEach(c => { c.style.width = sw + 'px'; });
    if (!animate) track.style.transition = 'none';
    const offset = (stage.clientWidth - sw) / 2 - cur * (sw + GAP);
    track.style.transform = `translateX(${offset}px)`;
    if (!animate) { void track.offsetWidth; track.style.transition = ''; }

    deck.forEach((c, i) => c.classList.toggle('is-active', i === cur));
    prevBtn.disabled = cur <= 0;
    nextBtn.disabled = cur >= deck.length - 1;
    counter.textContent =
      'REC ' + String(cur + 1).padStart(3, '0') + ' / ' + String(deck.length).padStart(3, '0');
    nameEl.textContent = deck.length ? titleOf(deck[cur]) : '—';
    buildIndex();
    syncScrub();
  }

  function go(i, animate = true) {
    if (!deck.length) return;
    cur = Math.max(0, Math.min(deck.length - 1, i));
    layout(animate);
    if (inListMode()) revealCurrent();
    else if (mainEl.classList.contains('blk-open')) openRecOverlay();
  }

  /* ── filter: deck を絞り込んで再構築 ── */
  const filterBtn = document.getElementById('glsFilterBtn');
  function applyFilter(type) {
    filter.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.type === type);
      if (b.dataset.type === type) filterBtn.textContent = '◈ Filter: ' + b.textContent;
    });
    const keepId = deck[cur] ? entryOf(deck[cur]).id : null;
    deck = cards.filter(c => {
      const ok = (type === 'all' || entryOf(c).dataset.type === type);
      c.hidden = !ok;
      if (c.blkTile) c.blkTile.hidden = !ok;
      return ok;
    });
    blkView.querySelectorAll('.blk-group').forEach(g => {
      g.hidden = !g.querySelector('.blk-tile:not([hidden])');
    });
    const keepIdx = deck.findIndex(c => entryOf(c).id === keepId);
    cur = keepIdx >= 0 ? keepIdx : 0;
    layout(false);
    if (mainEl.classList.contains('blk-open')) openRecOverlay();
  }
  filter.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    applyFilter(btn.dataset.type);
    filter.classList.remove('open');   // 選択したら畳む
  });
  filterBtn.addEventListener('click', () => filter.classList.toggle('open'));

  /* ── navigation ── */
  prevBtn.addEventListener('click', () => go(cur - 1));
  nextBtn.addEventListener('click', () => go(cur + 1));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(cur - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'Escape') { idxOverlay.classList.remove('open'); closeRecOverlay(); }
  });
  cards.forEach(c => c.addEventListener('click', () => {
    if (inListMode() || inBlockMode()) return;   // カード表示以外では無効
    if (!c.classList.contains('is-active')) go(deck.indexOf(c));
  }));

  /* horizontal wheel (trackpad) → record switch */
  let wheelLock = 0;
  stage.addEventListener('wheel', (e) => {
    if (inListMode() || inBlockMode()) return;   // リスト／ブロックは素の縦スクロールに委ねる
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // 縦は記事スクロールに委ねる
    e.preventDefault();
    const now = Date.now();
    if (now - wheelLock < 450) return;
    wheelLock = now;
    go(cur + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });

  /* touch swipe */
  let touchX = null, touchY = null;
  stage.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    /* 記録オーバーレイ表示中は左右フリックで前後の記録へ移動できる */
    const blkOpen = mainEl.classList.contains('blk-open');
    if (inListMode() || (inBlockMode() && !blkOpen)) { touchX = touchY = null; return; }
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(cur + (dx < 0 ? 1 : -1));
    }
    touchX = touchY = null;
  }, { passive: true });

  /* ── deep link: #id（記事・sub-entry どちらも可）／#type-xxx ── */
  function openHash(hash, animate) {
    if (!hash || hash === '#') return false;
    if (hash.startsWith('#type-')) { applyFilter(hash.slice(6)); return true; }
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch (err) { target = document.getElementById(hash.slice(1)); }
    if (!target) return false;
    const card = target.closest('.gcard');
    if (!card) return false;
    let idx = deck.indexOf(card);
    if (idx < 0) {
      // フィルタで隠れている場合は ALL に戻して探す
      applyFilter('all');
      idx = deck.indexOf(card);
      if (idx < 0) return false;
    }
    go(idx, animate);
    if (inListMode()) {
      /* リスト表示: 記事＝カード頭 / sub-entry＝その位置へ縦スクロールで着地。
         sub-entry の offsetTop は gcard（position:relative）基準のため合算する */
      const top = target.classList.contains('codex-entry')
        ? card.offsetTop
        : card.offsetTop + target.offsetTop;
      stage.scrollTop = Math.max(0, top - 10);
    } else if (inBlockMode()) {
      /* ブロック表示: 記録オーバーレイを開き、sub-entry なら内部スクロール */
      openRecOverlay();
      if (!target.classList.contains('codex-entry')) {
        card.querySelector('.gcard-body').scrollTop = Math.max(0, target.offsetTop - 12);
      }
    } else {
      const body = card.querySelector('.gcard-body');
      if (target.classList.contains('codex-entry')) {
        body.scrollTop = 0;
      } else {
        body.scrollTop = Math.max(0, target.offsetTop - 12);  // sub-entry へ内部スクロール
      }
    }
    return true;
  }
  window.addEventListener('hashchange', () => openHash(location.hash, true));

  /* ページ内 # リンクはスライド遷移に差し替える */
  track.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    if (openHash(a.getAttribute('href'), true)) {
      history.replaceState(null, '', a.getAttribute('href'));
    }
  });

  /* ── scrub bar: 横断シーク ── */
  const scrub      = document.getElementById('glsScrub');
  const scrubTrack = document.getElementById('glsScrubTrack');
  const scrubThumb = document.getElementById('glsScrubThumb');

  function rebuildTicks() {
    scrubTrack.querySelectorAll('.tick').forEach(t => t.remove());
    const tw = scrubTrack.clientWidth, thw = scrubThumb.offsetWidth;
    deck.forEach((c, i) => {
      const t = document.createElement('i');
      t.className = 'tick' + (i === cur ? ' current' : '');
      const frac = deck.length > 1 ? i / (deck.length - 1) : 0;
      t.style.left = (thw / 2 + frac * (tw - thw)) + 'px';
      scrubTrack.appendChild(t);
    });
  }

  function syncScrub() {
    const tw = scrubTrack.clientWidth, thw = scrubThumb.offsetWidth;
    const frac = deck.length > 1 ? cur / (deck.length - 1) : 0;
    scrubThumb.style.left = (frac * (tw - thw)) + 'px';
    rebuildTicks();
  }

  function scrubIndexFromX(clientX) {
    const r = scrubTrack.getBoundingClientRect();
    const thw = scrubThumb.offsetWidth;
    const frac = (clientX - r.left - thw / 2) / Math.max(1, r.width - thw);
    return Math.round(Math.max(0, Math.min(1, frac)) * (deck.length - 1));
  }

  let scrubbing = false;
  scrub.addEventListener('pointerdown', (e) => {
    if (!deck.length) return;
    scrubbing = true;
    scrub.classList.add('dragging');
    scrub.setPointerCapture(e.pointerId);
    go(scrubIndexFromX(e.clientX), false);
  });
  let scrubRaf = false;
  scrub.addEventListener('pointermove', (e) => {
    if (!scrubbing || scrubRaf) return;
    scrubRaf = true;
    const x = e.clientX;
    requestAnimationFrame(() => {
      scrubRaf = false;
      const i = scrubIndexFromX(x);
      if (i !== cur) go(i, false);
    });
  });
  const endScrub = (e) => {
    if (!scrubbing) return;
    scrubbing = false;
    scrub.classList.remove('dragging');
    go(scrubIndexFromX(e.clientX), true);
  };
  scrub.addEventListener('pointerup', endScrub);
  scrub.addEventListener('pointercancel', () => {
    scrubbing = false;
    scrub.classList.remove('dragging');
  });

  /* ── index overlay ── */
  function buildIndex() {
    idxList.innerHTML = '';
    deck.forEach((c, i) => {
      const a = document.createElement('a');
      a.href = '#' + entryOf(c).id;
      a.textContent = titleOf(c);
      if (i === cur) a.className = 'current';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        idxOverlay.classList.remove('open');
        go(i);   // リスト表示では go() が着地スクロールまで行う
        if (inBlockMode()) openRecOverlay();
        else if (!inListMode()) deck[cur].querySelector('.gcard-body').scrollTop = 0;
        history.replaceState(null, '', a.getAttribute('href'));
      });
      idxList.appendChild(a);
    });
  }
  idxBtn.addEventListener('click', () => idxOverlay.classList.toggle('open'));
  idxOverlay.addEventListener('click', (e) => {
    if (e.target === idxOverlay) idxOverlay.classList.remove('open');
  });

  /* ── ブロック表示: 種別ごとの帯にタイルを並べる ──
     記事の loc-thumb に画像があればそれを、なければ共通ファイルアイコンを表示。
     アイコンの塗り色は帯ごとのテーマカラー（ページCSSの .blk-group.bt-* 参照） */
  const blkView = document.getElementById('blkView');
  const blkBackdrop = document.getElementById('blkBackdrop');
  const blkCloseBtn = document.getElementById('blkClose');
  BANDS.forEach((gdef) => {
    const members = cards.filter(c => (entryOf(c).dataset.type || gdef.fallback || 'misc') === gdef.type);
    if (!members.length) return;
    const g = document.createElement('section');
    g.className = 'blk-group bt-' + gdef.type;
    const label = document.createElement('div');
    label.className = 'blk-label';
    label.textContent = '◈ ' + gdef.label;
    const grid = document.createElement('div');
    grid.className = 'blk-grid';
    g.appendChild(label);
    g.appendChild(grid);
    members.forEach((c) => {
      const tile = document.createElement('button');
      tile.className = 'blk-tile';
      const fig = document.createElement('span');
      fig.className = 'blk-fig';
      const img = entryOf(c).querySelector('.loc-thumb img');
      if (img) {
        fig.classList.add('has-img');
        fig.appendChild(img.cloneNode(true));
      }
      tile.appendChild(fig);
      const nm = document.createElement('span');
      nm.className = 'blk-name';
      nm.textContent = titleOf(c);
      tile.appendChild(nm);
      tile.addEventListener('click', () => {
        const idx = deck.indexOf(c);
        if (idx < 0) return;
        go(idx);
        openRecOverlay();
        history.replaceState(null, '', '#' + entryOf(c).id);
      });
      grid.appendChild(tile);
      c.blkTile = tile;
    });
    blkView.appendChild(g);
  });

  /* 記録オーバーレイ: 現在の記録カードを中央へ固定表示する */
  function openRecOverlay() {
    if (!inBlockMode() || !deck.length) return;
    mainEl.classList.add('blk-open');
    cards.forEach(c => c.classList.toggle('blk-active', c === deck[cur]));
    deck[cur].querySelector('.gcard-body').scrollTop = 0;
  }
  function closeRecOverlay() {
    mainEl.classList.remove('blk-open');
    cards.forEach(c => c.classList.remove('blk-active'));
  }
  blkBackdrop.addEventListener('click', closeRecOverlay);
  blkCloseBtn.addEventListener('click', closeRecOverlay);

  /* ── 表示モード切替: card（スライド）/ block（タイル一覧）/ list（縦積み一覧） ── */
  const cardBtn = document.getElementById('dispCard');
  const blockBtn = document.getElementById('dispBlock');
  const listBtn = document.getElementById('dispList');

  /* リスト表示: 現在の記録カードの頭まで縦スクロールで着地する */
  function revealCurrent() {
    if (!deck.length) return;
    stage.scrollTop = Math.max(0, deck[cur].offsetTop - 10);
  }
  function setMode(m) {
    mainEl.classList.toggle('mode-list',  m === 'list');
    mainEl.classList.toggle('mode-block', m === 'block');
    cardBtn.classList.toggle('active',  m === 'card');
    blockBtn.classList.toggle('active', m === 'block');
    listBtn.classList.toggle('active',  m === 'list');
    closeRecOverlay();
    if (m === 'list') revealCurrent();
    else if (m === 'card') layout(false);   // カード側に戻ったら座標・スクラブを再計算
    try { localStorage.setItem(STORAGE_KEY, m); } catch (e) {}
  }
  cardBtn.addEventListener('click', () => setMode('card'));
  blockBtn.addEventListener('click', () => setMode('block'));
  listBtn.addEventListener('click', () => setMode('list'));

  let savedMode = null;
  try { savedMode = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  savedMode = savedMode || DEFAULT_MODE;
  if (savedMode === 'list' || savedMode === 'block') setMode(savedMode);

  window.addEventListener('resize', () => layout(false));

  layout(false);
  openHash(location.hash, false);
  // 読み込み完了後にハッシュを再適用（読み込み中の遷移で着地がずれる事象への保険）
  window.addEventListener('load', () => { if (location.hash) openHash(location.hash, false); });
})();
