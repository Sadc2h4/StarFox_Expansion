/* Sector link tooltips.
   Greek/Coptic sector letters are hard to read, so every link to
   database/sectors.html#<id> or database/locations.html#<id> gets a
   native hover tooltip with the English reading (e.g. "SECTOR LAMBDA").
   Inline katakana readings in article text are removed in favor of
   this hover. */
(function() {
  var READINGS = {
    alpha: 'ALPHA', beta: 'BETA', gamma: 'GAMMA', delta: 'DELTA',
    epsilon: 'EPSILON', zeta: 'ZETA', theta: 'THETA', iota: 'IOTA', kappa: 'KAPPA',
    lambda: 'LAMBDA', mu: 'MU', nu: 'NU', xi: 'XI', omicron: 'OMICRON',
    pi: 'PI', rho: 'RHO', sigma: 'SIGMA', tau: 'TAU', upsilon: 'UPSILON', phi: 'PHI', chi: 'CHI',
    psi: 'PSI', omega: 'OMEGA', digamma: 'DIGAMMA', stigma: 'STIGMA',
    heta: 'HETA', san: 'SAN', janja: 'JANJA', lunate: 'LUNATE', dasitetas: 'DASITETAS',
    chima: 'CHIMA', shei: 'SHEI', fei: 'FEI', ngii: 'NGII',
    koppa: 'KOPPA', sho: 'SHO', yot: 'YOT', hori: 'HORI', khei: 'KHEI',
    nyi: 'NYI', vau: 'VAU', ya: 'YA', dasia: 'DASIA', sampi: 'SAMPI', gain: 'GAIN'
  };
  /* 宙域DBはロケーションDBへ統合済み（2026-07-31）。
     locations.html 内のページ内リンク #<id> にも読みホバーを付ける */
  var onSectorsPage = /(sectors|locations)\.html$/i.test(location.pathname);
  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute('href') || '';
    var hashAt = href.indexOf('#');
    if (hashAt === -1) continue;
    var isLocal = hashAt === 0;
    if (isLocal && !onSectorsPage) continue;
    if (!isLocal && href.indexOf('sectors.html#') === -1 &&
        href.indexOf('locations.html#') === -1) continue;
    var reading = READINGS[href.slice(hashAt + 1).toLowerCase()];
    if (reading && !a.title) a.title = 'SECTOR ' + reading;
  }
})();
