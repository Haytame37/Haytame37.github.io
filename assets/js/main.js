/* Haytame El Atraoui — UI behaviour (language, nav, reveal, counters) */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- language ---------- */
  var toggle = document.getElementById('langToggle');
  function setLang(l) {
    doc.lang = l;
    try { localStorage.setItem('he-lang', l); } catch (e) {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  toggle.addEventListener('click', function () { setLang(doc.lang === 'fr' ? 'en' : 'fr'); });

  /* ---------- nav ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var darkZones = [document.getElementById('lab'), document.getElementById('stage')];

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('#navLinks a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    var probe = 36;
    var dark = darkZones.some(function (z) {
      if (!z) return false;
      var r = z.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle('is-dark', dark);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* current section highlight */
  var links = {};
  document.querySelectorAll('#navLinks a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && links[e.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-current'); });
          links[e.target.id].classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------- reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        // stagger siblings entering together
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
        var i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- counters ---------- */
  function fmt(n) { return doc.lang === 'fr' ? n.toLocaleString('fr-FR') : n.toLocaleString('en-US'); }
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = +el.getAttribute('data-count');
    if (reduced) { el.textContent = fmt(target); return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }
  document.addEventListener('langchange', function () {
    counters.forEach(function (c) { c.textContent = fmt(+c.getAttribute('data-count')); });
  });

  /* ---------- deep links into lab modules ---------- */
  document.querySelectorAll('[data-open]').forEach(function (a) {
    a.addEventListener('click', function () {
      var m = a.getAttribute('data-open');
      if (window.HELab) window.HELab.open(m);
    });
  });

  /* ---------- featured mini risk matrix ---------- */
  var mini = document.getElementById('miniMatrix');
  if (mini) {
    var colors = ['#1F5A48', '#6B5A1E', '#7A3A1E', '#C43A0C'];
    var cells = [];
    for (var r = 5; r >= 1; r--) {
      for (var c = 1; c <= 5; c++) {
        var s = r * c, lv = s >= 15 ? 3 : s >= 10 ? 2 : s >= 5 ? 1 : 0;
        var i = document.createElement('i');
        i.style.background = colors[lv];
        mini.appendChild(i);
        cells.push({ el: i, lv: lv });
      }
    }
    if (!reduced) {
      setInterval(function () {
        cells.forEach(function (x) { x.el.classList.remove('hit'); });
        var hot = cells.filter(function (x) { return x.lv >= 2; });
        hot[Math.floor(Math.random() * hot.length)].el.classList.add('hit');
      }, 1400);
    }
  }

  /* ---------- "find me" locator on group photos ----------
     data-x / data-y are percentages of the natural image; the marker is
     projected through object-fit: cover + object-position. */
  var spotShots = document.querySelectorAll('.shot.has-spot');
  function placeSpot(fig) {
    var img = fig.querySelector('img'), spot = fig.querySelector('.spot');
    if (!img || !spot || !img.naturalWidth) return;
    var bw = fig.clientWidth, bh = fig.clientHeight;
    var nw = img.naturalWidth, nh = img.naturalHeight;
    var s = Math.max(bw / nw, bh / nh), rw = nw * s, rh = nh * s;
    var pos = getComputedStyle(img).objectPosition.split(' ');
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || pos[0]) / 100;
    if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
    var x = (bw - rw) * px + rw * (+spot.dataset.x / 100);
    var y = (bh - rh) * py + rh * (+spot.dataset.y / 100);
    // zoomed state: scale Z from the top-left corner, then pan so the person
    // moves toward the centre while the image still covers the frame
    var Z = 1.9;
    var tx = Math.min(0, Math.max(bw - bw * Z, bw / 2 - x * Z));
    var ty = Math.min(0, Math.max(bh - bh * Z, bh / 2 - y * Z));
    var v = { '--px': x, '--py': y, '--tx': tx, '--ty': ty, '--fx': x * Z + tx, '--fy': y * Z + ty };
    Object.keys(v).forEach(function (k) { fig.style.setProperty(k, v[k] + 'px'); });
    // flip the label to the left when it would overflow the frame
    var label = spot.querySelector('.spot__label');
    spot.classList.remove('spot--left');
    if (label && x + 52 + label.offsetWidth > bw - 8 && x - 52 - label.offsetWidth > 8) spot.classList.add('spot--left');
    spot.classList.add('is-placed');
  }
  function placeAll() { spotShots.forEach(placeSpot); }
  var canHover = window.matchMedia('(hover: hover)').matches;
  spotShots.forEach(function (fig) {
    var img = fig.querySelector('img'), spot = fig.querySelector('.spot');
    if (img.complete) placeSpot(fig); else img.addEventListener('load', function () { placeSpot(fig); });
    if (canHover) {
      fig.addEventListener('mouseenter', function () { fig.classList.add('is-focus'); });
      fig.addEventListener('mouseleave', function () { fig.classList.remove('is-focus'); });
    }
    spot.addEventListener('click', function (e) { e.stopPropagation(); fig.classList.toggle('is-focus'); });
    if (!canHover) fig.addEventListener('click', function () { fig.classList.toggle('is-focus'); });
  });
  window.addEventListener('resize', placeAll);
  if (window.ResizeObserver) { var ro = new ResizeObserver(placeAll); spotShots.forEach(function (f) { ro.observe(f); }); }

  /* ---------- looping videos: respect reduced motion ---------- */
  if (reduced) {
    document.querySelectorAll('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
