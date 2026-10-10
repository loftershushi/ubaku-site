// 東川ライフスタイルヴィレッジ計画の動き
// オープニング・スクロールで現れる動き・図面の切り替え・フォーム（試作）・メールアドレスの組み立て
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var body = document.body, intro = document.getElementById('intro');
  document.documentElement.classList.add('js');

  /* ---------- オープニング（ubaku.jp と同じく、開くたびに毎回流す。URLに ?nointro を付けると出さない） ---------- */
  var seen = /[?&]nointro/.test(location.search);
  function finish(){
    if(body.classList.contains('ready')) return;
    intro.classList.add('gone');
    body.classList.remove('locked');
    body.classList.add('ready');
  }
  if(reduce || seen){ intro.style.display = 'none'; finish(); }
  else {
    var t = setTimeout(finish, 7600);
    function skip(){ clearTimeout(t); finish(); }
    intro.addEventListener('click', skip);
    document.addEventListener('keydown', function once(){ skip(); document.removeEventListener('keydown', once); });
  }

  /* ---------- マウスを乗せると浮くカード（.lift）と、ゆっくり拡大する写真（.zoom）。ubaku.jp と同じ決まり ---------- */
  document.querySelectorAll('.stats li,.town-photos figure,.know > div,.cats > div,.two article,.people article,.crew > div,.joins li,.values li,.works li').forEach(function(e){ e.classList.add('lift'); });
  document.querySelectorAll('.pano,.face,.town-photos .ph,.two .ph,.ph-wide').forEach(function(e){ e.classList.add('zoom'); });

  /* ---------- スクロールで、ふわっと現れる ---------- */
  var els = document.querySelectorAll('.r, #ten');
  if(reduce || !('IntersectionObserver' in window)){
    els.forEach(function(e){ e.classList.add('in'); });
  } else {
    // 同じ並びの項目は、少しずつ遅らせて順番に出す
    document.querySelectorAll('.stats,.know,.cats,.two,.people,.crew,.joins,.values,.open,.steps,.works').forEach(function(g){
      Array.prototype.forEach.call(g.children, function(c, i){ c.style.transitionDelay = (i % 6) * 0.08 + 's'; });
    });
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          var el = e.target;
          el.classList.add('in'); io.unobserve(el);
          // 現れ終わったら、マウスを乗せたときの速さに切り替える（遅らせて出した分も待つ）
          setTimeout(function(){ el.classList.add('done'); el.style.transitionDelay = ''; }, 1300 + (parseFloat(el.style.transitionDelay) || 0) * 1000);
        }
      });
    }, {rootMargin:'0px 0px -10% 0px', threshold:.08});
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- 数字：画面に入ったら、数字が速く回って最後に今の値で止まる ---------- */
  // data-from（始まりの数。なければ0）→ data-to（最後の数）。前後の文字は data-pre・data-suf
  var counts = document.querySelectorAll('.cnt');
  function runCount(el){
    var from = +(el.dataset.from || 0), to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    var dur = 1600, t0 = null;
    function frame(t){
      if(!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 4);            // 最初は速く、最後にゆっくり止まる
      var n = Math.round(from + (to - from) * e);
      el.textContent = pre + n.toLocaleString('ja-JP') + suf;
      if(k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if(!reduce && 'IntersectionObserver' in window){
    var co = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ runCount(e.target); co.unobserve(e.target); } });
    }, {threshold:.6});
    counts.forEach(function(el){ co.observe(el); });
  }

  /* ---------- ロードマップ：画面に入ったら、線が左から右へ青くなる ---------- */
  var steps = document.querySelector('.steps');
  if(reduce || !('IntersectionObserver' in window)){ steps.classList.add('go'); }
  else {
    var so = new IntersectionObserver(function(es){
      if(es[0].isIntersecting){ setTimeout(function(){ steps.classList.add('go'); }, 400); so.disconnect(); }
    }, {threshold:.5});
    so.observe(steps);
  }

  /* ---------- 図面の切り替え（鳥瞰図／配置計画図） ---------- */
  var tabs = {bird:document.getElementById('tab-bird'), plan:document.getElementById('tab-plan')};
  function show(k){
    ['bird','plan'].forEach(function(n){
      var on = n === k;
      tabs[n].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[n].tabIndex = on ? 0 : -1;
      document.getElementById('img-' + n).classList.toggle('on', on);
      document.getElementById('cap-' + n).hidden = !on;
    });
  }
  tabs.bird.onclick = function(){ show('bird'); };
  tabs.plan.onclick = function(){ show('plan'); };
  document.querySelector('.tabs').addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
      var k = tabs.bird.getAttribute('aria-selected') === 'true' ? 'plan' : 'bird';
      show(k); tabs[k].focus();
    }
  });
  show('bird');

  /* ---------- 都道府県の選択肢 ---------- */
  var prefs = '北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県 海外'.split(' ');
  var sel = document.getElementById('f-pref');
  prefs.forEach(function(p){ var o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o); });

  /* ---------- フォーム（試作：入力チェックだけして、送信はしない） ---------- */
  var form = document.getElementById('form'), err = document.getElementById('err');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = form.name.value.trim(), mail = form.email.value.trim(), pref = form.pref.value;
    if(!name){ err.textContent = 'お名前を入力してください。'; form.name.focus(); return; }
    if(!pref){ err.textContent = 'お住まいの都道府県を選んでください。'; form.pref.focus(); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){ err.textContent = 'メールアドレスを確認してください。'; form.email.focus(); return; }
    err.textContent = '';
    form.style.display = 'none';
    var th = document.getElementById('thanks'); th.classList.add('on'); th.focus();
  });

  /* ---------- メールアドレス：ページには「info［at］ubaku.jp」とだけ書き、開いたあとに組み立てる（ubaku.jp と同じ） ---------- */
  document.querySelectorAll('.js-mail').forEach(function(a){
    var addr = a.dataset.user + '@' + a.dataset.domain;
    a.href = 'mailto:' + addr;
    a.textContent = addr;
  });
})();
