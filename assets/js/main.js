/* =========================================================
   ubaku.jp の動き
   1. ヒーローの3枚スライド（6秒ごとに自動切替＋ボタンで手動切替）
   2. お問い合わせフォーム（Formspreeへ送り、ページ内に「送信しました」を表示）
   3. スクロールで文字や写真がふわっと現れる動き
   4. Journal：noteの記事を2段で流す
   ========================================================= */

/* ---------- 1. ヒーローのスライド ---------- */
(function () {
  var tabs = document.querySelectorAll('.slide-tabs [role="tab"]');
  var slides = document.querySelectorAll('.panorama .slide');
  if (!tabs.length || tabs.length !== slides.length) return;

  var INTERVAL = 6000;   // 自動切替の間隔（ミリ秒）
  var current = 0;
  var timer = null;
  // 「動きを減らす」設定の人には自動再生しない
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // i番目のスライドを表示する
  function show(i) {
    current = i;
    tabs.forEach(function (tab, n) {
      var on = n === i;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      slides[n].classList.toggle('is-active', on);
      slides[n].setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  // 自動切替をやり直す（手動で切り替えたときも6秒数え直す）
  function restart() {
    clearInterval(timer);
    if (reduceMotion.matches) return;
    timer = setInterval(function () { show((current + 1) % tabs.length); }, INTERVAL);
  }

  tabs.forEach(function (tab, n) {
    // クリックで切り替え
    tab.addEventListener('click', function () { show(n); restart(); });
    // キーボードの左右キーで切り替え
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (n + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (n - 1 + tabs.length) % tabs.length;
      if (next === null) return;
      e.preventDefault();
      show(next);
      tabs[next].focus();
      restart();
    });
  });

  // 設定が途中で変わったときにも対応
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', restart);

  show(0);
  restart();
})();

/* ---------- 4. Journal：noteの記事を2段で流す ----------
   記事一覧は notes.js（window.UBAKU_NOTES）から読み込む
   ※ スクロールの動き（3）より先に動かす（カードができてから、動きの対象を集めるため） */
(function () {
  var flow = document.getElementById('journal-flow');
  if (!flow) return;
  var notes = window.UBAKU_NOTES || [];
  // 記事が読み込めなかったときは、流れる欄ごと隠す（下のnoteへのリンクは残る）
  if (!notes.length) { flow.hidden = true; return; }

  // 記事カード1枚を作る
  function card(n) {
    var a = document.createElement('a');
    a.className = 'note-card';
    a.href = n.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<span class="photo zoom"><img src="" alt="" loading="lazy" width="600" height="314"></span>' +
      '<span class="meta"><span class="date"></span><span class="source"></span></span>' +
      '<span class="title"></span>';
    // 文字や画像のアドレスは、そのまま文字として入れる（安全のため）
    a.querySelector('img').src = n.image;
    a.querySelector('.date').textContent = n.date;
    a.querySelector('.source').textContent = n.source;
    a.querySelector('.title').textContent = n.title;
    return a;
  }

  // 新しい順に交互に振り分け（1段目：1,3,5…／2段目：2,4,6…）
  var rows = flow.querySelectorAll('.flow-track');
  var split = [[], []];
  notes.forEach(function (n, i) { split[i % 2].push(n); });
  split.forEach(function (list, k) {
    var track = rows[k];
    track.style.setProperty('--count', list.length);
    // 切れ目なく流すため、同じ並びを2回つなげる（2回目は読み上げ・キーボード操作の対象外）
    [0, 1].forEach(function (copy) {
      list.forEach(function (n) {
        var c = card(n);
        if (copy) { c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; }
        track.appendChild(c);
      });
    });
  });
})();

/* ---------- 3. スクロールで、文字や写真がふわっと現れる ---------- */
(function () {
  // 「動きを減らす」設定の人や、古いブラウザでは何もしない（最初から全部見える）
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  // 動かす対象（見出し・各ブロック・写真）
  var targets = document.querySelectorAll([
    '.sec-head', '.value', '.work-item',
    '.villa .photo', '.villa-text', '.media', '.two article',
    '.concept .kicker', '.concept-title', '.concept-catch', '.tomoe',
    '.numbers-grid li', '.member', '.journal-flow', '.note-links',
    '.soon-head', '.soon-body', '.contact-lead', '.contact-grid > div', '.form', '.links-row'
  ].join(','));

  targets.forEach(function (el) { el.classList.add('reveal'); });

  // 画面の下から15%ほど入ったら表示（一度出たら、もう隠さない）
  // 同時に画面に入ったものは、ページ上の並び順（1→2→3→4…）に少しずつ遅らせて出す
  var io = new IntersectionObserver(function (entries) {
    var shown = entries
      .filter(function (entry) { return entry.isIntersecting; })
      .map(function (entry) { return entry.target; })
      .sort(function (a, b) {
        // ページ上で前にあるものを先に
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

    shown.forEach(function (el, i) {
      var delay = i * 0.15;   // 1つごとに0.15秒ずつ遅らせる
      el.style.transitionDelay = delay + 's';
      el.classList.add('is-visible');
      io.unobserve(el);
      // 現れ終わったら、遅らせ設定を外して「マウスを乗せると浮く」動きに切り替える
      setTimeout(function () {
        el.style.transitionDelay = '';
        el.classList.add('revealed');
      }, 1200 + delay * 1000);
    });
  }, { rootMargin: '0px 0px -15% 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();

/* ---------- 2. お問い合わせフォーム ---------- */
(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var button = form.querySelector('.submit');
    button.disabled = true;
    status.textContent = '送信しています…';

    // Formspreeに送る（JSONで結果を受け取る）
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('send failed');
      form.reset();
      status.textContent = '送信しました。お問い合わせありがとうございます。';
    }).catch(function () {
      status.textContent = '送信できませんでした。お手数ですが info@ubaku.jp へ直接メールでお送りください。';
    }).then(function () {
      button.disabled = false;
    });
  });
})();
