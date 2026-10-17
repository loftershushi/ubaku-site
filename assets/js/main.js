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
  var STEPS = [0.06, 0.36, 0.64]; // Find → Build → Live に切り替わるタイミング（全体の何割の時点か。2026-10-17 元の動きに戻した）
  // 動詞（Find・Build・Live）を1文字ずつの部品に分ける（1文字ずつ下から入って上へ抜ける動きのため。試作 B）
  op.querySelectorAll('.op-verb i').forEach(function (w) {
    w.innerHTML = w.textContent.split('').map(function (ch, i) { return '<span style="--i:' + i + '">' + ch + '</span>'; }).join('');
  });
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
    document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Find Build Live your place.'),
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

/* ---------- ヒーローの写真の高さ：開いた画面の一番下に 01・02・03 が来るように合わせる（その下は .hero の padding-bottom＝約5px） ----------
   CSS の --hero-max-h（画面の高さ − 決まった数）だと、画面ごとに文字の大きさが違ってずれるため、実際の高さを測って決める（2026-10-17）
   スマホ（640px以下）は正方形の写真のままなので何もしない。横幅が狭めの画面では写真の縦横の比率が先に効く */
(function () {
  var hero = document.querySelector('.hero');
  var pano = hero && hero.querySelector('.panorama');
  if (!pano) return;
  function fit() {
    if (window.innerWidth <= 640) { pano.style.maxHeight = ''; return; }
    pano.style.maxHeight = 'none';                          // いったん上限を外して、写真以外の部分の高さを測る
    var others = hero.offsetHeight - pano.offsetHeight;     // ロゴ・文字・01〜03・下の余白
    pano.style.maxHeight = Math.max(380, window.innerHeight - others) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
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
    '.biz3 article', '.work-wide',   // What We Do（2026-10-16 に Business をまとめた）
    '.concept .kicker', '.concept-title', '.concept-catch', '.tomoe',
    '.numbers-grid li', '.member', '.journal-flow', '.note-links',
    '.contact-lead', '.contact-grid > div', '.form',   // '.links-row'（フッターのメール・SNS）は一番下で現れないことがあるので外した（2026-10-17）
    '.js-reveal'   // 下層ページ（/consulting・/design）で動かしたいもの
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

/* ---------- 固定メニュー（細い帯） ----------
   ・写真の上端より下までスクロールしたら使えるようにする（それより上では出さない）
   ・下に読み進めているあいだは隠し、少しでも上に戻すと出す */
(function () {
  var bar = document.getElementById('topbar');
  if (!bar) return;
  var btn = bar.querySelector('.topbar-menu');
  var pano = document.querySelector('.panorama');
  var lastY = window.scrollY;

  function setOpen(open) {   // スマホの一覧を開く・閉じる
    bar.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function onScroll() {
    var y = window.scrollY;
    var start = pano ? pano.getBoundingClientRect().top + y : 400;   // 写真の上端の位置
    if (y < start) {
      bar.classList.remove('is-shown'); setOpen(false);
    } else if (y < lastY - 4) {
      bar.classList.add('is-shown');           // 上に戻した
    } else if (y > lastY + 4 && !bar.classList.contains('is-open')) {
      bar.classList.remove('is-shown');        // 下に読み進めている（一覧を開いているときは隠さない）
    }
    if (Math.abs(y - lastY) > 4) lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', function () { setOpen(!bar.classList.contains('is-open')); });
  // 一覧の項目やロゴを押したら、一覧を閉じる
  bar.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  // ロゴ：ページの一番上へ（下層ページでは href="../" なので、そのままトップページへ移る）
  bar.querySelector('.topbar-logo').addEventListener('click', function (e) {
    if (this.getAttribute('href') !== '#') return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ---------- Numbers：画面に入ったら、数字が速く回って最後に今の値で止まる ----------
   ・100以上（2026 など）：0 から数え上がる（東川ヴィレッジのページと同じ動き）
   ・100未満（1日1組・80・2 など）：数え上げだと動きが少ないので、各けたが 0〜9 をスロットのように
     縦に何周か回ってから止まる（2026-10-16）。後ろのけたほど多く回る
   data-from（始まりの数。なければ0）→ data-to（最後の数）。前後の文字は data-pre・data-suf */
(function () {
  var counts = document.querySelectorAll('.cnt');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!counts.length || reduce || !('IntersectionObserver' in window)) return;   // 動きを減らす設定では、最初から最後の値のまま
  // スロットのように回す（100未満の数）
  function roll(el) {
    var to = String(el.dataset.to), dur = 2600, t0 = null, strips = [];
    el.textContent = '';
    el.setAttribute('aria-label', to);
    to.split('').forEach(function (d, i) {
      var box = document.createElement('span'), strip = document.createElement('span');
      box.className = 'odo-digit';
      strip.className = 'odo-strip';
      var n = (5 + i) * 10 + (+d);              // 5周＋けたの位置の分だけ多く回ってから、その数字で止まる
      var html = '';
      for (var k = 0; k <= n; k++) html += '<span>' + (k % 10) + '</span>';
      strip.innerHTML = html;
      box.appendChild(strip);
      el.appendChild(box);
      strips.push({ el: strip, n: n });
    });
    function frame(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 5);            // 最初はとても速く、だんだんゆっくりになって止まる
      var blur = 2.5 * Math.pow(1 - k, 4);       // 速いあいだだけ、少しぼかして回っている感じを出す
      strips.forEach(function (s) {
        s.el.style.transform = 'translateY(' + (-s.n * e * 1.2) + 'em)';
        s.el.style.filter = blur > 0.1 ? 'blur(' + blur.toFixed(2) + 'px)' : '';
      });
      if (k < 1) requestAnimationFrame(frame);
      else el.textContent = to;                  // 止まったら、ふつうの文字に戻す
    }
    requestAnimationFrame(frame);
  }
  function run(el) {
    if (+el.dataset.to < 100) return roll(el);
    var from = +(el.dataset.from || 0), to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    var dur = 2600, t0 = null;   // スロットの数字と同じ長さで、同時に止まるように
    function frame(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 5);            // 最初はとても速く、だんだんゆっくりになって止まる（スロットと同じ）
      el.textContent = pre + Math.round(from + (to - from) * e) + suf;
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  counts.forEach(function (el) { io.observe(el); });
})();

/* ---------- What We Do の大雪山の写真：幕が上がりきってから、マウスを乗せると拡大（01〜03 の写真と同じ動き） ---------- */
(function () {
  var wide = document.getElementById('work-wide');
  if (!wide) return;
  function done() { wide.classList.add('zoom'); }
  // 現れる動きがないとき（動きを減らす設定など）は、最初から拡大を付ける
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return done();
  wide.addEventListener('transitionend', function (e) {
    if (e.target === wide && e.propertyName === 'clip-path') done();
  });
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
// メールのボタン（2026-10-17）：アドレスはページのどこにも書かず、押したときだけ組み立ててメールを開く
// （ページを読み取ってアドレスを集めるロボットに見つからないように）。メールが開けない環境では href のお問い合わせへ
document.querySelectorAll('.js-mail-btn').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = 'mailto:' + a.dataset.user + '@' + a.dataset.domain;
  });
});
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


/* ---------- 下層ページ（/consulting・/design）のヒーロー写真の高さ（2026-10-17） ----------
   開いた画面の一番下に、写真の下の 01・02・03（写真が1枚なら写真の下端）が来て、その下が約10pxになるように、
   写真の高さを画面に合わせる（トップは style.css の --hero-max-h で同じ見え方にしている）
   ・事業名と見出しの段の高さは画面の幅で変わるので、ここで毎回はかって決める
   ・スマホのアドレスバーの出入りで高さが揺れないよう、画面の幅が変わったときだけ計り直す */
(function () {
  if (!document.body.matches('.page-consulting, .page-design')) return;
  var pano = document.querySelector('.hero .panorama');
  if (!pano) return;
  var tabs = document.querySelector('.hero .slide-tabs');
  var GAP = 10;   // 一番下の余白（px）
  var lastW = 0;

  function fit() {
    var w = window.innerWidth;
    if (w === lastW) return;
    lastW = w;
    pano.style.height = '';
    pano.style.maxHeight = 'none';
    var top = pano.getBoundingClientRect().top + window.scrollY;
    var below = tabs ? tabs.offsetHeight : 0;
    var h = window.innerHeight - top - below - GAP;
    var min = w <= 640 ? 240 : 320;          // 画面がとても低いときでも、写真が小さくなりすぎないように
    var max = w <= 640 ? w * 1.1 : w * 0.62; // 縦に長い画面で、写真が大きくなりすぎないように
    pano.style.aspectRatio = 'auto';
    pano.style.height = Math.round(Math.min(max, Math.max(min, h))) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastW = 0; fit(); });
})();
