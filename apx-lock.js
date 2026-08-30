/* apx-lock.js — 機密レベル《アポカリュプシス》アクセス権限コンソール
 * class="apx-lock" が付与されたリンクのクリックを遮断し、権限不足コンソールを表示する。
 * apocalypsis.html で認証済みのセッション（sessionStorage: apx-authorized=1）はそのまま通過させる。 */
(function () {
  var CONSOLE_URL = (function () {
    var s = document.currentScript;
    return s && s.src ? s.src.replace(/apx-lock\.js.*$/, 'apocalypsis.html') : 'apocalypsis.html';
  })();
  var CSS = [
    '.apx-overlay{position:fixed;inset:0;background:rgba(2,4,8,0.82);z-index:9000;',
    'display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);}',
    '.apx-box{font-family:"Share Tech Mono",monospace;color:#ffb0b0;background:rgba(20,4,6,0.96);',
    'border:1px solid rgba(255,68,85,0.65);box-shadow:0 0 40px rgba(255,68,85,0.25),inset 0 0 24px rgba(255,68,85,0.06);',
    'max-width:520px;width:calc(100% - 48px);padding:0 0 18px;animation:apx-in .18s ease-out;}',
    '@keyframes apx-in{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}',
    '.apx-hdr{display:flex;align-items:center;gap:8px;padding:10px 14px;margin-bottom:14px;',
    'color:#ff4455;background:rgba(255,68,85,0.12);border-bottom:1px solid rgba(255,68,85,0.4);',
    'font-size:12px;letter-spacing:2px;}',
    '.apx-hdr .dot{width:7px;height:7px;border-radius:50%;background:#ff4455;box-shadow:0 0 8px #ff4455;',
    'animation:apx-blink 1s steps(2,start) infinite;}',
    '@keyframes apx-blink{50%{opacity:0.25}}',
    '.apx-body{padding:0 18px;font-size:13px;line-height:1.9;}',
    '.apx-lv{color:#ffdd88;letter-spacing:1px;}',
    '.apx-deny{color:#ff4455;font-size:15px;letter-spacing:3px;margin:10px 0;}',
    '.apx-note{color:#997777;font-size:11px;}',
    '.apx-close,.apx-go{display:inline-block;margin:14px 0 0 18px;padding:6px 22px;cursor:pointer;',
    'font-family:inherit;font-size:12px;letter-spacing:2px;color:#ffb0b0;background:none;',
    'border:1px solid rgba(255,68,85,0.5);text-decoration:none;}',
    '.apx-close:hover,.apx-go:hover{background:rgba(255,68,85,0.15);}',
    '.apx-go{color:#ffdd88;border-color:rgba(255,221,136,0.5);}',
    '.apx-go:hover{background:rgba(255,221,136,0.12);}'
  ].join('');

  function showConsole() {
    if (document.querySelector('.apx-overlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'apx-overlay';
    overlay.innerHTML =
      '<div class="apx-box" role="alertdialog" aria-modal="true">' +
      '<div class="apx-hdr"><span class="dot"></span>▌ ACCESS CONTROL — CLASSIFIED RECORD ▐</div>' +
      '<div class="apx-body">' +
      '本記録は機密レベル<span class="apx-lv">《アポカリュプシス》</span>に指定されています。<br>' +
      '閲覧には専用コンソールでの認証キー入力が必要です。<br>' +
      '<div class="apx-deny">▮ ACCESS DENIED ▮</div>' +
      '現在の閲覧権限: <span class="apx-lv">臨時閲覧権限 LV.2</span><br>' +
      '</div>' +
      '<a class="apx-go" href="' + CONSOLE_URL + '">[ 認証コンソールへ ]</a>' +
      '<button class="apx-close" type="button">[ 閉じる ]</button>' +
      '</div>';
    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.apx-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
  }

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  function bind() {
    document.querySelectorAll('a.apx-lock').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (sessionStorage.getItem('apx-authorized') === '1') return; // 認証済みは通過
        e.preventDefault();
        showConsole();
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
