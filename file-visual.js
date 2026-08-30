/* File-page visual gallery (characters / weapons — .file-layout pages).
   Folds the main portrait plus any comm-window images into one slide
   set inside .planet-visual; multiple images become switchable via
   the dot buttons under the picture (per the corporate-file layout).
   Pages without any image get a NO VISUAL placeholder frame. */
(function () {
  var main = document.querySelector('.planet-main.file-layout');
  if (!main) return;
  var vis = main.querySelector('.planet-visual');
  if (!vis) return;

  /* Reveal hover taglines on first mouseenter and keep them shown.
     Pages with their own inline comm script add .shown too — harmless. */
  vis.addEventListener('mouseenter', function () {
    Array.prototype.forEach.call(vis.querySelectorAll('.planet-hover-tagline'), function (t) {
      t.classList.add('shown');
    });
  }, { once: true });

  var slides = [];
  var mainImg = vis.querySelector('img.planet-img-detail');
  if (mainImg) {
    if ((mainImg.getAttribute('src') || '').trim()) {
      mainImg.classList.add('visual-slide');
      slides.push(mainImg);
    } else {
      mainImg.style.display = 'none';
    }
  }

  /* comm-window images become extra slides (the popup itself is hidden
     by .file-layout CSS; editor.html keeps managing the img list) */
  var firstTagline = vis.querySelector('.planet-hover-tagline');
  Array.prototype.forEach.call(vis.querySelectorAll('.comm-window img'), function (img) {
    var src = (img.getAttribute('src') || '').trim();
    if (!src) return;
    var slide = document.createElement('img');
    slide.src = src;
    slide.alt = img.getAttribute('alt') || 'visual';
    slide.className = 'visual-slide from-comm';
    vis.insertBefore(slide, firstTagline);
    slides.push(slide);
  });

  if (!slides.length) {
    var no = document.createElement('div');
    no.className = 'visual-noimg';
    no.innerHTML = 'NO VISUAL<br>AWAITING SCAN';
    vis.insertBefore(no, firstTagline);
    return;
  }

  var dots = [];
  function setActive(n) {
    slides.forEach(function (s, i) { s.classList.toggle('active', i === n); });
    dots.forEach(function (d, i) { d.classList.toggle('active', i === n); });
  }

  if (slides.length > 1) {
    var wrap = document.createElement('div');
    wrap.className = 'visual-dots';
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'visual ' + (i + 1));
      b.addEventListener('click', function (event) {
        event.stopPropagation();
        setActive(i);
      });
      wrap.appendChild(b);
      dots.push(b);
    });
    vis.appendChild(wrap);
  }

  setActive(0);
})();
