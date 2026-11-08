/* =========================================================
   UBAKU Yasai の動き（見本 C8・2026-11-08）
   ・ubakuvilla.com の v3.js・intro.js と同じ考え方
     ①画面に入ったときに1回 ②見ている間ゆっくり続く（トップの写真・Story の写真・畑の写真の帯）③マウスの反応
   ・「動きを減らす」設定の人には、動きを止めて最初から見せる
   ========================================================= */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;
  // 確認用：URL に ?shot を付けると、イントロなし・全部見えた状態・トップの写真は高さ 900px（ページ全体のスクリーンショット用）
  if (/[?&]shot/.test(location.search)) { reduce = true; html.classList.add('shot'); }

  /* ---------- イントロ：はみだしの円 ----------
     きれいな円の線が引かれる → 赤土のトマトが、円より少しはみだして実る → 言葉が一文字ずつ
     → 円の形に写真（両手のトマト）がひらき、白いロゴ → 写真がほどけてトップへ
     ・開くたびに毎回出す。押すと飛ばせる */
  function intro() {
    if (reduce || /[?&]nointro/.test(location.search)) return;
    html.classList.add('is-intro');
    var words = 'はみだしても、美瑛の味。';
    var op = document.createElement('div');
    op.className = 'op';
    op.setAttribute('aria-hidden', 'true');
    op.innerHTML =
      '<div class="op-fruit"></div>' +
      '<svg class="op-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49.5" pathLength="1"/></svg>' +
      '<p class="op-word">' + words.split('').map(function (c, i) {
        return '<span style="--d:' + (i * 0.06).toFixed(2) + 's">' + c + '</span>';
      }).join('') + '</p>' +
      '<div class="op-photo"><img src="img/intro.webp" alt=""></div>' +
      '<div class="op-logo"><span class="wordmark"></span><span class="brand-sub">YASAI</span></div>' +
      '<span class="op-skip">Skip</span>';
    document.body.appendChild(op);
    html.style.overflow = 'hidden';
    var done = false, timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function finish() {
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      op.classList.add('fade');
      html.style.overflow = '';
      html.classList.remove('is-intro');
      document.dispatchEvent(new Event('yasai-intro-done'));   // ここからトップの写真の時間を数える
      setTimeout(function () { op.remove(); }, 1500);
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { op.classList.add('go'); }); });
    at(900, function () { op.classList.add('grow'); });
    at(1700, function () { op.classList.add('show'); });
    at(3300, function () { op.classList.add('open'); });
    at(7400, finish);   // 2枚目（写真とロゴ）をゆっくり見せる（2026-11-08 C17：5.6秒→7.4秒）
    op.addEventListener('click', finish);
  }
  intro();

  /* ---------- ヘッダー：写真を過ぎたら生成りの帯に ---------- */
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  function onScrollHeader() {
    var limit = hero ? hero.offsetHeight - 80 : 10;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- スマホのメニュー ---------- */
  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  menuBtn.addEventListener('click', function () { setDrawer(true); });
  drawer.addEventListener('click', function (e) {
    if (e.target === drawer || e.target.closest('.drawer-close') || e.target.closest('a')) setDrawer(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  /* ---------- トップの写真：3枚が溶けるように替わる（右下の線は残り時間） ---------- */
  (function () {
    var slides = [].slice.call(document.querySelectorAll('.hero .slide'));
    var dotsBox = document.querySelector('.hero-dots');
    if (!slides.length) return;
    var i = 0, timer = null, wait = 6500;
    var dots = slides.map(function (_, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (k + 1) + '枚目の写真');
      b.addEventListener('click', function () { show(k); });
      dotsBox.appendChild(b);
      return b;
    });
    function show(k) {
      slides[i].classList.remove('is-active');
      dots[i].classList.remove('is-on');
      i = k;
      slides[i].classList.add('is-active');
      void dots[i].offsetWidth;   // 線の動きを最初からにする
      dots[i].classList.add('is-on');
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(function () { show((i + 1) % slides.length); }, wait);
    }
    function start() { show(0); }
    if (html.classList.contains('is-intro')) document.addEventListener('yasai-intro-done', start, { once: true });
    else start();
  })();

  /* ---------- 画面に入ったら現れる（.reveal・.unveil・3つの特長・丘の線・こよみ） ---------- */
  var targets = document.querySelectorAll('.reveal,.unveil,.points li,.hill,.koyomi,.tl');   // .tl＝予約の流れの線
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 溶けるように替わる写真（Story）：画面に見えている間だけ動かす ---------- */
  document.querySelectorAll('[data-wipe]').forEach(function (box) {
    var imgs = [].slice.call(box.querySelectorAll('img'));
    var k = 0, timer = null;
    imgs[0].classList.add('is-active');
    if (reduce || imgs.length < 2) return;
    function next() {
      imgs.forEach(function (im) { im.classList.remove('was-active'); });
      imgs[k].classList.remove('is-active');
      imgs[k].classList.add('was-active');
      k = (k + 1) % imgs.length;
      imgs[k].classList.add('is-active');
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        clearInterval(timer);
        if (e.isIntersecting) timer = setInterval(next, 5200);
      });
    }).observe(box);
  });

  /* ---------- 全面の写真：スクロールに合わせてゆっくり動く ---------- */
  var bleeds = [].slice.call(document.querySelectorAll('.bleed'));
  function parallax() {
    bleeds.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;   // 画面の真ん中で 0
      b.style.setProperty('--py', (-8 - p * 8).toFixed(2) + '%');
    });
  }
  if (!reduce && bleeds.length) { window.addEventListener('scroll', parallax, { passive: true }); parallax(); }

  /* ---------- 流れ続ける写真（畑のようす）：止まらずゆっくり。マウスを乗せると止まる。ドラッグで送れる ---------- */
  document.querySelectorAll('[data-flow]').forEach(function (box) {
    var track = box.querySelector('.flow-track');
    track.innerHTML += track.innerHTML;   // 2周分にして、つなぎ目なく回す
    var x = 0, speed = 0.35, hold = false, drag = null, half = 0, seen = false;
    function measure() { half = track.scrollWidth / 2; }
    measure(); window.addEventListener('resize', measure);
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(box);
    box.addEventListener('mouseenter', function () { hold = true; });
    box.addEventListener('mouseleave', function () { hold = false; });
    track.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, start: x }; track.classList.add('is-drag'); track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', function (e) { if (drag) x = drag.start + (e.clientX - drag.x); });
    function end() { drag = null; track.classList.remove('is-drag'); }
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    function tick() {
      if (seen && !hold && !drag && !reduce) x -= speed;
      if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(tick);
    }
    tick();
  });

  /* ---------- 季節のこよみ：今の月に印 ---------- */
  // 見ている日の「年-月」と同じ月に印を付ける（月が変わると自動で印も動く）
  var d0 = new Date(), ym = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2);
  document.querySelectorAll('.koyomi-grid .m').forEach(function (m) {
    if (m.dataset.ym === ym) { m.classList.add('is-now'); m.setAttribute('aria-current', 'date'); }
  });

  /* ---------- 右下の印と、一番上へ戻るボタン ----------
     ・トップの写真を過ぎたら出す。最後の帯とフッターが見えている間は隠す（同じボタンが並ぶため） */
  var fab = document.querySelector('.fab');
  var toTop = document.querySelector('.to-top');
  var ends = [].slice.call(document.querySelectorAll('.cta,.site-footer,.ws'));   // 卸の帯の中では、卸の印は出さない
  var endSeen = new Set();
  if ('IntersectionObserver' in window) {
    var eio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) endSeen.add(e.target); else endSeen.delete(e.target); });
      updateFab();
    });
    ends.forEach(function (el) { eio.observe(el); });
  }
  function updateFab() {
    var past = window.scrollY > (hero ? hero.offsetHeight * 0.7 : 200);
    var atEnd = endSeen.size > 0;
    fab.classList.toggle('is-shown', past && !atEnd);
    toTop.classList.toggle('is-shown', past);
    toTop.classList.toggle('is-low', atEnd);
  }
  window.addEventListener('scroll', updateFab, { passive: true });
  updateFab();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
})();
