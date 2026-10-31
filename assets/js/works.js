/* =========================================================
   Works の事例ページの動き（2026-10-31 試作）
   ・ビフォー・アフター：つまみを左右に動かして見比べる形にする
     （JS が動かないときは、Design のページと同じ「2枚並び」のまま）
   ・下に浮く小さな目次：表紙の写真を過ぎたら出し、いま読んでいる所に印を付ける。
     ご相談の欄（Contact）が見えたら隠す
   ========================================================= */
(function () {
  'use strict';

  // ---------- ビフォー・アフターを見比べる形に ----------
  var compares = [];
  document.querySelectorAll('.wk-output .ba').forEach(function (ba) {
    var pair = ba.querySelector('.ba-pair');
    var before = ba.querySelector('.ba-before img');
    var after = ba.querySelector('.ba-after img');
    if (!pair || !before || !after) return;

    var box = document.createElement('div');
    box.className = 'ba-compare';
    box.style.aspectRatio = before.getAttribute('width') + ' / ' + before.getAttribute('height');
    // 下に After、上に Before を重ね、Before を左から「つまみの位置」まで見せる
    box.innerHTML =
      '<img class="ba-c-after" alt="">' +
      '<div class="ba-c-before"><img alt=""></div>' +
      '<span class="ba-c-tag ba-c-tag--b">Before</span><span class="ba-c-tag ba-c-tag--a">After</span>' +
      '<span class="ba-c-handle" aria-hidden="true"><i></i></span>' +
      '<input class="ba-c-range" type="range" min="0" max="100" value="50" aria-label="改修前と改修後を見比べる（左右に動かす）">';
    var a = box.querySelector('.ba-c-after');
    var b = box.querySelector('.ba-c-before img');
    a.src = after.src; a.alt = after.alt; a.loading = 'lazy';
    b.src = before.src; b.alt = before.alt; b.loading = 'lazy';
    pair.replaceWith(box);

    var range = box.querySelector('.ba-c-range');
    function set(v) { box.style.setProperty('--pos', v + '%'); range.value = v; }
    range.addEventListener('input', function () { set(range.value); box.classList.add('is-touched'); });
    set(50);
    compares.push(box);
  });

  // ---------- 「動かせる」と分かるように（2026-10-31 mashuさん：全部真ん中だと伝わりにくい） ----------
  // ・画面に入ったとき、つまみが一度だけ左右に揺れてから真ん中に戻る
  // ・最初の1組だけ、つまみの横に「動かして比べる」の吹き出しを出す（触ったら消える）
  if (compares.length) {
    compares[0].insertAdjacentHTML('beforeend', '<span class="ba-c-bubble" aria-hidden="true">動かして比べる</span>');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        seen.unobserve(e.target);
        if (!still) sway(e.target);
      });
    }, { threshold: .6 });
    compares.forEach(function (c) { seen.observe(c); });
  }
  function sway(box) {
    // 50 → 30 → 70 → 50 を約1.8秒で（途中で触られたらやめる）
    var keys = [50, 30, 70, 50], dur = 600, t0 = null;
    function step(t) {
      if (box.classList.contains('is-touched')) return;
      if (t0 === null) t0 = t;
      var k = (t - t0) / dur, i = Math.floor(k);
      if (i >= keys.length - 1) { box.style.setProperty('--pos', '50%'); return; }
      var f = k - i, ease = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      box.style.setProperty('--pos', (keys[i] + (keys[i + 1] - keys[i]) * ease) + '%');
      requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 300);
  }

  // ---------- 下に浮く小さな目次 ----------
  var dock = document.querySelector('.wk-dock');
  if (!dock) return;
  var cover = document.querySelector('.wk-cover');
  var contact = document.getElementById('contact');
  var links = Array.prototype.slice.call(dock.querySelectorAll('a'));
  var parts = links.map(function (l) { return document.querySelector(l.getAttribute('href')); });

  function update() {
    var y = window.innerHeight;
    var pastCover = cover ? cover.getBoundingClientRect().bottom < y * .4 : window.scrollY > y;
    var nearEnd = contact ? contact.getBoundingClientRect().top < y * .85 : false;
    dock.classList.toggle('is-shown', pastCover && !nearEnd);
    // いま読んでいる所：画面の上から4割の線を、最後に越えた区切り
    var now = -1;
    parts.forEach(function (p, i) { if (p && p.getBoundingClientRect().top < y * .4) now = i; });
    links.forEach(function (l, i) { l.classList.toggle('is-now', i === now); });
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
