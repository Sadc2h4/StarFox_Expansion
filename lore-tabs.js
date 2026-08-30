/* lore-tabs.js — ロケーションページの lore セクションをタブで整理する。
   本文HTMLは無改変のまま、.planet-lore 内の .lore-section を見出しの
   英字キーで5タブ (OVERVIEW / PLANETARY / HISTORY / MILITARY / ARCHIVES)
   に振り分け、タブバーを .planet-lore の直前に挿入する。
   このスクリプトを読み込まないページ（およびJS無効時）は従来の縦並びのまま。 */
(function () {
  'use strict';

  var GROUPS = [
    { id: 'overview',  label: 'OVERVIEW'  },
    { id: 'planetary', label: 'PLANETARY' },
    { id: 'history',   label: 'HISTORY'   },
    { id: 'military',  label: 'MILITARY'  },
    { id: 'archives',  label: 'ARCHIVES'  }
  ];
  var KEY_TO_GROUP = {
    OVERVIEW: 'overview',
    GENESIS: 'planetary', GEOGRAPHY: 'planetary',
    STRUCTURE: 'planetary', INTELLIGENCE: 'planetary',
    PROJECT: 'planetary', SPONSOR: 'planetary', PRESENT: 'planetary',
    HISTORY: 'history', ANCIENT: 'history',
    SOCIETY: 'history', ECONOMY: 'history',
    MILITARY: 'military', CLASSIFIED: 'military', LOGISTICS: 'military',
    ARCHIVES: 'archives'
  };

  function init() {
    var main = document.querySelector('.planet-main');
    if (!main || main.classList.contains('file-layout')) return;
    var lore = main.querySelector('.planet-lore');
    if (!lore) return;
    var sections = Array.prototype.slice.call(lore.querySelectorAll('.lore-section'));
    if (sections.length < 3) return;

    var byGroup = {}; // gid -> [{sec, key, jp}]
    var prevGid = 'overview';
    sections.forEach(function (sec) {
      var h = sec.querySelector('.lore-h');
      var text = h ? h.textContent : '';
      var key = (text.match(/[A-Z]+/) || [''])[0];
      var gid = KEY_TO_GROUP[key] || prevGid; // 未知の見出しは直前のセクションと同じタブへ
      prevGid = gid;
      sec.setAttribute('data-lore-tab', gid);
      var jp = (text.split('─')[1] || '').trim();
      (byGroup[gid] = byGroup[gid] || []).push({ sec: sec, key: key, jp: jp });
    });

    // PLANETARY タブ内では GENESIS(形成史)を踏み込んだ情報として末尾へ回す
    // （GEOGRAPHY・STRUCTURE 等が先。既に末尾のページはDOMを動かさない）
    var pl = byGroup.planetary;
    if (pl && pl.length > 1) {
      var gens = pl.filter(function (it) { return it.key === 'GENESIS'; });
      var rest = pl.filter(function (it) { return it.key !== 'GENESIS'; });
      if (gens.length && rest.length) {
        var anchor = pl[pl.length - 1].sec;
        gens.forEach(function (it) {
          if (it.sec !== anchor) {
            anchor.insertAdjacentElement('afterend', it.sec);
            anchor = it.sec;
          }
        });
        byGroup.planetary = rest.concat(gens);
      }
    }

    var tabs = GROUPS.filter(function (g) { return byGroup[g.id]; });
    if (tabs.length < 2) return;

    var bar = document.createElement('div');
    bar.className = 'lore-tabbar';
    bar.setAttribute('role', 'tablist');
    var buttons = {};
    tabs.forEach(function (g) {
      var label = g.label;
      var itemKeys = byGroup[g.id].map(function (it) { return it.key; });
      // 軌道施設など GENESIS / GEOGRAPHY を持たないページは先頭セクションの
      // 見出しキーをタブ名にする（STRUCTURE 主体・PROJECT 主体どちらにも対応）
      if (g.id === 'planetary' &&
          itemKeys.indexOf('GENESIS') < 0 &&
          itemKeys.indexOf('GEOGRAPHY') < 0) label = itemKeys[0] || label;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lore-tab';
      b.setAttribute('role', 'tab');
      b.textContent = label;
      var names = byGroup[g.id].map(function (it) { return it.jp; }).filter(Boolean);
      if (names.length) b.title = names.join(' ／ ');
      b.addEventListener('click', function () { select(g.id); });
      bar.appendChild(b);
      buttons[g.id] = b;
    });
    lore.parentNode.insertBefore(bar, lore);
    lore.classList.add('tabs-active');

    var current = null;
    function select(gid, keepScroll) {
      if (!buttons[gid] || gid === current) return;
      current = gid;
      tabs.forEach(function (g) {
        var on = g.id === gid;
        buttons[g.id].classList.toggle('active', on);
        buttons[g.id].setAttribute('aria-selected', on ? 'true' : 'false');
      });
      sections.forEach(function (sec) {
        sec.classList.toggle('tab-hidden', sec.getAttribute('data-lore-tab') !== gid);
      });
      if (!keepScroll) lore.scrollTop = 0;
    }

    // #tab-xxx で直接タブを開ける。本文内アンカーへのリンクは該当タブを開いて着地。
    function applyHash() {
      var id = (location.hash || '').slice(1);
      if (!id) return false;
      var m = id.match(/^tab-([a-z]+)$/);
      if (m && buttons[m[1]]) { select(m[1]); return true; }
      var el = document.getElementById(id);
      if (el && lore.contains(el)) {
        var sec = el.closest('.lore-section');
        if (sec) {
          select(sec.getAttribute('data-lore-tab'), true);
          el.scrollIntoView({ block: 'start' });
          return true;
        }
      }
      return false;
    }

    if (!applyHash()) select(tabs[0].id);
    window.addEventListener('hashchange', applyHash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
