/* Classified-text reveal: click a .redacted span to toggle visibility.
   Shared by planet / codex pages.
   The「検閲済み」label is a real element positioned from script: a CSS
   ::before can't stay centered on the censor bar once the inline span
   wraps onto multiple lines (the label drifted left / off-screen). */
(function () {
  var items = [];

  function blockHost(span) {
    var el = span.parentElement;
    while (el && getComputedStyle(el).display === 'inline') el = el.parentElement;
    return el || document.body;
  }

  /* the widest rendered fragment of the (possibly wrapped) span */
  function widestRect(span) {
    var rects = span.getClientRects();
    var best = null;
    for (var i = 0; i < rects.length; i++) {
      if (!best || rects[i].width > best.width) best = rects[i];
    }
    return best;
  }

  function place(item) {
    var rect = item.span.classList.contains('revealed') ? null : widestRect(item.span);
    if (!rect || rect.width < 8) {
      item.tag.style.display = 'none';
      return;
    }
    var hostRect = item.host.getBoundingClientRect();
    item.tag.style.display = '';
    item.tag.style.left = (rect.left + rect.width / 2 - hostRect.left - item.host.clientLeft) + 'px';
    item.tag.style.top = (rect.top + rect.height / 2 - hostRect.top - item.host.clientTop) + 'px';
  }

  function placeAll() {
    for (var i = 0; i < items.length; i++) place(items[i]);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.redacted'), function (span) {
    var host = blockHost(span);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var tag = document.createElement('span');
    tag.className = 'redact-tag';
    tag.textContent = '検閲済み';
    tag.setAttribute('aria-hidden', 'true');
    host.appendChild(tag);
    items.push({ span: span, host: host, tag: tag });
  });
  placeAll();

  window.addEventListener('resize', placeAll);
  window.addEventListener('load', placeAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAll);

  document.addEventListener('click', function (event) {
    var span = event.target.closest ? event.target.closest('.redacted') : null;
    if (span) {
      /* censored text inside a link: first click only reveals (no jump),
         later clicks navigate normally and keep the text revealed */
      var link = span.closest ? span.closest('a') : null;
      if (link && !span.classList.contains('revealed')) {
        event.preventDefault();
        span.classList.add('revealed');
      } else if (!link) {
        span.classList.toggle('revealed');
      }
    }
    placeAll();
  });
})();
