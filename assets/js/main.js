/* =========================================================
   ubaku.jp の動き
   1. ヒーローの3枚スライド（6秒ごとに自動切替＋ボタンで手動切替）
   2. お問い合わせフォーム（Web3Formsへ送り、ページ内に「送信しました」を表示）／メールアドレスの表示
   3. スクロールで文字や写真がふわっと現れる動き
   4. Journal：noteの記事を2段で流す
   0. オープニング（大雪山の稜線のイントロ）
   ========================================================= */

/* ---------- 0. オープニング（大雪山の稜線のイントロ） ----------
   同じタブで一度だけ流す（2回目以降と「動きを減らす」設定では出ない。判定は index.html の head）
   クリック・キー操作でいつでも飛ばせる */
(function () {
  var root = document.documentElement;
  var op = document.getElementById('opening');
  if (!op) return;
  if (!root.classList.contains('is-opening')) { op.remove(); return; }
  op.hidden = false;

  var DUR = 3800;               // 000→100 までの時間（ミリ秒。元は4700）
  var STEPS = [0.06, 0.36, 0.64]; // Find → Make → Live に切り替わるタイミング（全体の何割の時点か）
  var HOLD = 1200;              // 100になってから消え始めるまでの待ち時間（元は1900）

  var count = op.querySelector('.op-count');
  var line = op.querySelector('.op-line');
  var shade = op.querySelector('.op-shade');
  line.style.strokeDasharray = '1 1';
  line.style.strokeDashoffset = 1;
  // 線の太さを、画面の幅に関係なく「0.8px」に見えるようにする
  // （稜線の図は幅1000で描いてあり、画面幅に合わせて拡大されるため、その分だけ細くしておく）
  var ridgeSvg = op.querySelector('.op-ridge');
  function fitStroke() { line.style.strokeWidth = (0.8 * 1000 / (ridgeSvg.clientWidth || 1000)).toFixed(3); }
  fitStroke();
  window.addEventListener('resize', fitStroke);

  // 稜線のいちばん高いところ（旭岳の山頂）を探し、名前の位置と、出すタイミングを決める
  var peakAt = 0.6;
  try {
    var total = line.getTotalLength(), best = null;
    for (var k = 0; k <= 400; k++) {
      var pt = line.getPointAtLength(total * k / 400);
      if (!best || pt.y < best.y) best = { x: pt.x, y: pt.y, at: k / 400 };
    }
    peakAt = best.at;
    op.style.setProperty('--peak-x', (best.x / 10).toFixed(2));  // 1000幅の中の位置 → ％
    op.style.setProperty('--peak-y', best.y.toFixed(1));
  } catch (e) {}

  var t0 = null, raf = null, timer = null, ended = false;
  // ゆっくり始まって、ゆっくり終わる進み方
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  function frame(t) {
    if (t0 === null) t0 = t;
    var raw = Math.min(1, (t - t0) / DUR);
    var p = ease(raw);
    count.textContent = String(Math.round(p * 100)).padStart(3, '0');
    var drawn = Math.min(1, p / 0.92);
    line.style.strokeDashoffset = 1 - drawn;                          // 稜線を左から描く
    if (drawn >= peakAt) op.classList.add('peak');                    // 線が山頂を通ったら、旭岳の名前を出す
    shade.style.opacity = Math.max(0, Math.min(1, (p - 0.55) / 0.4)); // 稜線の下をうっすら塗る
    if (raw > STEPS[0]) op.classList.add('s1');
    if (raw > STEPS[1]) op.classList.add('s2');
    if (raw > STEPS[2]) op.classList.add('s3');
    if (raw < 1) { raf = requestAnimationFrame(frame); return; }
    op.classList.add('done');
    timer = setTimeout(exit, HOLD);
  }

  // 消え方：①文字と稜線がふわっと消える（0.7秒）→ ②生成りの白紙だけになったら、
  //         サイト（同じ生成りの地色）に切り替え、トップの文字が上から順に現れる
  function exit() {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    op.classList.add('exit');
    setTimeout(function () {
      root.classList.remove('is-opening');   // スクロールとヒーローの登場の動きを再開
      document.dispatchEvent(new Event('ubaku:opening-end'));
      op.classList.add('gone');
    }, 700);
    setTimeout(function () { op.remove(); }, 1300);
  }

  op.addEventListener('click', exit);
  window.addEventListener('keydown', exit, { once: true });

  // フォントが届いてから動き始める
  // （届く前に始めると、最初は代わりのフォントで大きめに表示され、届いた瞬間に小さく切り替わって見えるため）
  // 回線が遅いときは、1.5秒待っても届かなければそのまま始める
  var fontsReady = (document.fonts && document.fonts.load) ? Promise.all([
    document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Find'),
    document.fonts.load('500 40px "Cormorant Garamond"', 'your place.'),
    document.fonts.load('300 14px "Jost"', 'Asahidake 2,291m')
  ]) : Promise.resolve();
  var started = false;
  function start() {
    if (started || ended) return;
    started = true;
    op.classList.add('ready');
    raf = requestAnimationFrame(frame);
  }
  fontsReady.then(start, start);
  setTimeout(start, 1500);
})();

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
  if (document.documentElement.classList.contains('is-opening')) {
    document.addEventListener('ubaku:opening-end', function () { show(0); restart(); }, { once: true });
  } else {
    restart();
  }
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

  var rows = flow.querySelectorAll('.flow-track');

  // 2段に振り分けて並べる
  // groups：同じ表紙の記事に同じ番号が入った一覧（まだ調べていないときは null）
  function build(groups) {
    var split = [[], []];
    var used = [{}, {}];   // それぞれの段に、どの表紙がもう入っているか
    notes.forEach(function (n, i) {
      var k = split[0].length <= split[1].length ? 0 : 1;   // 基本は少ない方の段へ（＝交互）
      var g = groups ? groups[i] : i;
      if (used[k][g] && !used[1 - k][g]) k = 1 - k;          // 同じ表紙がすでにある段は避ける
      used[k][g] = true;
      split[k].push(n);
    });
    split.forEach(function (list, k) {
      var track = rows[k];
      track.textContent = '';
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
  }
  build(null);

  // 表紙の見た目を小さく縮めて比べ、同じ写真の表紙を見つける
  // （noteでは同じ写真でも画像のアドレスが毎回変わるため、見た目で比べる）
  function fingerprint(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = c.height = 8;
          var x = c.getContext('2d');
          x.drawImage(img, 0, 0, 8, 8);
          var d = x.getImageData(0, 0, 8, 8).data, g = [], sum = 0;
          for (var i = 0; i < 64; i++) { g.push(d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11); sum += g[i]; }
          resolve(g.map(function (v) { return v > sum / 64 ? 1 : 0; }));   // 明るい／暗いの64マスの模様
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = url.replace(/width=\d+/, 'width=64');
    });
  }
  Promise.all(notes.map(function (n) { return fingerprint(n.image); })).then(function (prints) {
    var groups = prints.map(function (p, i) { return i; });
    var found = false;
    prints.forEach(function (p, i) {
      if (!p) return;
      for (var j = 0; j < i; j++) {
        if (!prints[j]) continue;
        var diff = 0;
        for (var k = 0; k < 64; k++) if (p[k] !== prints[j][k]) diff++;
        if (diff <= 4) { groups[i] = groups[j]; found = true; break; }   // ほぼ同じ模様 ＝ 同じ写真
      }
    });
    if (found) build(groups);
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
    '.contact-lead', '.contact-grid > div', '.form', '.links-row'
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

/* ---------- 「続きを読む」（スマホだけ。たたんである文章を開く・閉じる） ---------- */
document.querySelectorAll('.fold-btn').forEach(function (btn) {
  var target = document.getElementById(btn.getAttribute('aria-controls'));
  if (!target) return;
  btn.addEventListener('click', function () {
    var open = target.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '閉じる' : '続きを読む';
  });
  // Team の紹介文：3行に収まっているときは、ボタンを出さない
  if (target.classList.contains('fold-clamp')) {
    var check = function () {
      if (target.classList.contains('is-open')) return;
      btn.hidden = target.scrollHeight <= target.clientHeight + 1;
    };
    check();
    window.addEventListener('resize', check);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(check);
  }
});

/* ---------- 2. お問い合わせフォーム ---------- */
// メールアドレス：ページの文字には「info［at］ubaku.jp」とだけ書き、開いたあとに本当のアドレスとリンクに組み立てる
// （アドレスを集めて回るロボットは、ページの文字をそのまま読むため）
document.querySelectorAll('.js-mail').forEach(function (a) {
  var addr = a.dataset.user + '@' + a.dataset.domain;
  a.href = 'mailto:' + addr;
  a.textContent = addr;
});

(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var button = form.querySelector('.submit');
    button.disabled = true;
    status.textContent = '送信しています…';

    // 件名に種別を入れる（メールソフトで振り分けやすくするため）
    var data = new FormData(form);
    data.set('subject', '【ubaku.jp】お問い合わせ（' + (data.get('type') || 'その他') + '）');

    // Web3Formsに送る（JSONで結果を受け取る）
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok || !json.success) throw new Error(json.message || 'send failed');
      });
    }).then(function () {
      form.reset();
      if (window.hcaptcha) { try { window.hcaptcha.reset(); } catch (err) {} }
      status.textContent = '送信しました。お問い合わせありがとうございます。';
    }).catch(function () {
      // メールアドレスは、ロボットに拾われないよう分けて書いておき、ここで組み立てる
      status.textContent = '送信できませんでした。お手数ですが ' + 'info' + '@' + 'ubaku.jp' + ' へ直接メールでお送りください。';
    }).then(function () {
      button.disabled = false;
    });
  });
})();
