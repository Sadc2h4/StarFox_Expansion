/* Planet visual panel collapse toggle.
   Injects a pull-tab button right below .planet-visual.
   The panel always starts open: the collapsed state is per page view and
   deliberately NOT persisted (a stored "closed" state carried across pages
   and test users never noticed the panel existed). */
(function() {
  var vis = document.querySelector('.planet-main .planet-visual');
  if (!vis) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'visual-toggle';
  btn.setAttribute('aria-label', 'toggle visual panel');
  vis.classList.add('has-toggle');
  vis.insertAdjacentElement('afterend', btn);
  var collapsed = false;
  function render() {
    vis.classList.toggle('collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.innerHTML = collapsed
      ? '<span class="vt-arrow">▼</span>VISUAL PANEL — OPEN'
      : '<span class="vt-arrow">▲</span>VISUAL PANEL — CLOSE';
  }
  render();
  btn.addEventListener('click', function() {
    collapsed = !collapsed;
    render();
  });
})();
