/* =========================================================
   UBAKU Letter の購読（2026-10-11 トップページに組み込み）
   ・右下の小さな札：ヒーローを過ぎたら現れる。ページを開くたびに毎回出す（閉じたことは覚えない）
   ・Contact と、ページの中の購読欄が見えている間は札を隠す
   ・札を押すと小さな窓が開く：① メールアドレス → ② 楽しみな話（任意）→ ③ 登録完了（押したら即登録）
   ・窓の右上の「﹀」で、もとの札にたたむ（× の「閉じる」はない）
   ・ページの中の購読欄（Journal のあと）も同じ流れ
   ※ 「これで受け取る」「選ばずに受け取る」で Brevo に本当に送る（手元の確認用ページ drafts/letter.html から送っても、本当に登録される）
   ※ 登録が成功したら、Web3Forms で info@ubaku.jp に通知する
   ※ ロボット判定は Cloudflare Turnstile。メールを入れて次へ進んだときに裏で始まり、送るときにその結果を添える
   ========================================================= */
(function () {
  'use strict';

  // 興味のあること（Brevo の INTERESTS と同じ8つ・同じ順番）
  var INTERESTS = ['宿泊', '野菜', '美瑛', '東川町', 'デザイン監修', '宿の開業支援', '空き家・建物の活用', 'その他'];
  var PRIVACY = 'privacy/';   // プライバシーポリシーの場所（トップページから見た場所）

  // 大雪山の稜線（オープニングの稜線と同じ形。index.html の .op-line から写した。幅1000×高さ110の図）
  var RIDGE_D = 'M0.0 118.1 L41.9 111.9 L76.8 101.4 L104.7 86.7 L128.5 72.1 L134.1 72.1 L139.7 69.3 L145.3 64.4 L150.8 62.7 L156.4 61.0 L162.0 59.3 L167.6 57.6 L173.2 55.9 L178.8 54.2 L184.4 52.5 L189.9 50.8 L195.5 49.1 L201.1 47.4 L206.7 45.7 L212.3 44.0 L217.9 42.3 L223.5 40.6 L229.1 40.6 L234.6 40.6 L240.2 40.6 L245.8 38.5 L251.4 36.4 L257.0 33.6 L262.6 29.5 L268.2 26.7 L273.7 23.2 L279.3 19.7 L284.9 19.7 L290.5 19.7 L296.1 19.7 L301.7 19.7 L307.3 22.5 L312.8 25.3 L318.4 28.8 L324.0 32.3 L329.6 30.9 L335.2 30.2 L340.8 32.3 L346.4 33.6 L352.0 40.6 L357.5 41.3 L363.1 44.1 L368.7 44.8 L374.3 44.8 L379.9 44.8 L385.5 42.7 L391.1 42.7 L396.6 42.7 L402.2 44.8 L407.8 44.8 L413.4 48.3 L419.0 49.0 L424.6 49.0 L430.2 48.3 L435.8 46.2 L441.3 44.8 L446.9 42.7 L452.5 42.7 L458.1 40.6 L463.7 38.5 L469.3 36.4 L474.9 34.3 L480.4 34.3 L486.0 33.6 L491.6 31.6 L497.2 28.8 L502.8 26.7 L508.4 26.0 L514.0 26.0 L519.6 26.0 L525.1 29.5 L530.7 30.2 L536.3 29.5 L541.9 25.3 L547.5 21.1 L553.1 18.3 L558.7 16.9 L564.2 14.1 L569.8 12.0 L575.4 12.0 L581.0 16.2 L586.6 19.0 L592.2 23.2 L597.8 27.4 L603.4 32.3 L608.9 37.1 L614.5 41.3 L620.1 45.5 L625.7 49.7 L631.3 51.8 L636.9 55.3 L642.5 58.8 L648.0 61.6 L653.6 63.0 L659.2 65.8 L664.8 65.8 L670.4 67.2 L676.0 68.6 L681.6 74.8 L687.2 76.2 L692.7 76.9 L698.3 78.3 L703.9 81.8 L709.5 84.6 L715.1 84.6 L720.7 82.5 L726.3 81.1 L731.8 80.4 L737.4 80.4 L743.0 80.4 L748.6 82.5 L754.2 83.2 L759.8 84.6 L765.4 84.6 L770.9 84.6 L776.5 86.0 L782.1 86.7 L787.7 86.7 L793.3 86.7 L798.9 84.6 L804.5 84.6 L810.1 85.3 L815.6 86.7 L821.2 86.7 L826.8 87.4 L832.4 88.8 L838.0 88.8 L843.6 88.8 L849.2 88.8 L854.7 90.9 L860.3 90.9 L865.9 90.9 L871.5 90.9 L877.1 93.0 L882.7 93.0 L888.3 93.0 L893.9 93.0 L899.4 95.1 L905.0 95.1 L910.6 95.1 L916.2 93.0 L921.8 93.0 L927.4 93.0 L963.7 95.1 L1000.0 101.4';
  var RIDGE = '<svg class="lt-ridge" viewBox="0 10 1000 110" aria-hidden="true"><path pathLength="1" d="' + RIDGE_D + '"/></svg>';
  // 札と窓の上辺（白い面の上の端が大雪山の輪郭になる。輪郭には青い線を重ねる）
  var TOP = '<svg class="lt-top" viewBox="0 10 1000 110" aria-hidden="true">' +
    '<path class="lt-top-fill" d="' + RIDGE_D + ' L1000 121 L0 121 Z"/>' +
    '<path class="lt-top-line" pathLength="1" d="' + RIDGE_D + '"/></svg>';
  // UBAKŪ のロゴ（サイトと同じロゴデータ。style.css の .wordmark）＋ Letter
  var LOGO = '<span class="lt-logo"><span class="wordmark" role="img" aria-label="UBAKU"></span><span class="lt-logo-en">Letter</span></span>';

  // ---------- 入力欄（札の窓とページの中で共通）を作る ----------
  function formHTML(id) {
    var chips = INTERESTS.map(function (v) {
      return '<label class="lt-chip"><input type="checkbox" name="INTERESTS" value="' + v + '"><span>' + v + '</span></label>';
    }).join('');
    return '' +
      '<form class="lt-form is-step1" novalidate data-form="' + id + '">' +
        // ① メールアドレス
        '<div data-step="1">' +
          '<div class="lt-row">' +
            '<input class="lt-input" type="email" name="EMAIL" autocomplete="email" placeholder="メールアドレス" aria-label="メールアドレス" required>' +
            '<button class="lt-btn" type="submit">受け取る</button>' +
          '</div>' +
          '<p class="lt-note">無料・いつでも解除できます。登録すると<a href="' + PRIVACY + '">プライバシーポリシー</a>に同意したものとみなします。</p>' +
        '</div>' +
        // ② 楽しみな話（任意）
        '<div data-step="2">' +
          '<p class="lt-q">どんな話を楽しみにしていますか？<small>いくつでも・選ばなくても大丈夫です</small></p>' +
          '<fieldset class="lt-chips">' + chips + '</fieldset>' +
          '<div class="lt-ts"></div>' +   // ロボット判定（ふだんは何も出ない。怪しいときだけ確認が出る）
          '<div class="lt-actions">' +
            '<button class="lt-btn" type="submit">これで受け取る</button>' +
            '<button class="lt-btn lt-btn--ghost" type="submit" data-skip>選ばずに受け取る</button>' +
          '</div>' +
        '</div>' +
        // ③ 送りました
        '<div data-step="3">' +
          '<p class="lt-done"><strong>ありがとうございます。</strong>登録が完了しました。ようこそのメールをお送りしましたので、ご確認ください。次の号からお届けします。<span>届かないときは、迷惑メールのフォルダーもご確認ください。</span></p>' +
        '</div>' +
        // ロボット対策（人には見えない欄）
        '<input type="text" name="email_address_check" class="gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '</form>';
  }

  // ---------- 送信のしくみ（①→②→③） ----------
  function wire(form) {
    var email = form.querySelector('.lt-input');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.classList.contains('is-step1')) {
        if (!email.value || !email.checkValidity()) {   // メールアドレスの形がおかしいとき
          email.focus();
          email.setCustomValidity('メールアドレスをご確認ください');
          email.reportValidity();
          email.setCustomValidity('');
          return;
        }
        form.classList.replace('is-step1', 'is-step2');
        startCheck(form);
        return;
      }
      if (form.classList.contains('is-step2')) {
        if (e.submitter && e.submitter.hasAttribute('data-skip')) {
          form.querySelectorAll('.lt-chips input').forEach(function (c) { c.checked = false; });
        }
        send(form);
      }
    });
  }

  // ---------- ロボット判定（Cloudflare Turnstile） ----------
  // 鍵：Cloudflare の Turnstile「ubaku.jp 購読フォーム」の Site Key（公開してよい鍵）。
  // 秘密の鍵（Secret Key）は Brevo のフォームの Captcha 欄にだけ入っている
  var TURNSTILE_SITEKEY = '0x4AAAAAAFTm28MwexkROux3';
  var tsReady = null;   // Turnstile の読み込み（1回だけ）
  function loadTurnstile() {
    if (tsReady) return tsReady;
    tsReady = new Promise(function (ok, ng) {
      var sc = document.createElement('script');
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      sc.async = true;
      sc.onload = function () { ok(window.turnstile); };
      sc.onerror = ng;
      document.head.appendChild(sc);
    });
    return tsReady;
  }
  function startCheck(form) {
    if (form._ts) return;
    form._ts = { token: '', waiters: [] };
    loadTurnstile().then(function (ts) {
      form._ts.id = ts.render(form.querySelector('.lt-ts'), {
        sitekey: TURNSTILE_SITEKEY,
        language: 'ja',
        appearance: 'interaction-only',   // 確認が必要なときだけ表示する
        callback: function (token) {
          form._ts.token = token;
          form._ts.waiters.splice(0).forEach(function (w) { w(token); });
        },
        'expired-callback': function () { form._ts.token = ''; }
      });
    });
  }
  function waitToken(form) {
    startCheck(form);
    if (form._ts.token) return Promise.resolve(form._ts.token);
    return new Promise(function (ok, ng) {
      form._ts.waiters.push(ok);
      setTimeout(function () { ng(new Error('timeout')); }, 20000);   // 20秒待っても終わらなければ、やり直してもらう
    });
  }
  function resetCheck(form) {
    if (form._ts && form._ts.id !== undefined && window.turnstile) { form._ts.token = ''; window.turnstile.reset(form._ts.id); }
  }

  // ---------- Brevo へ送る ----------
  // 送り先：Brevo のフォーム「UBAKU Letter 購読開始」（リスト UBAKU Letter・押したら即登録）
  // Brevo の「Simple HTML」のコードの action から写した。フォームを作り直したら、ここを差し替える
  var BREVO_ACTION = 'https://048174c4.sibforms.com/serve/MUIFANlwF4CKWo53Ft-gwnZvDNzLszEBK4bQtRn_zoWEKctNtUOmIQmM3DYdCh_aZ2r5zUkhW8BPT5cUKb9ksZdCB7d-XPvQ-YG9tsqpPSCOApLhfOH9Zf9UTOAwJAIfjw5PI71xUpxadGSNuLV3BhRkFkRByo7JHcw6TEr3u808DkAV0UbK2ki9YVzYDP7cWaaWeBUuv259Ska9qg==';

  // ---------- 登録があったことを UBAKU に知らせる（Web3Forms） ----------
  // Brevo の通知では「だれが登録したか」が出せないので、サイトから直接知らせる。
  // 送り先：Web3Forms のアクセスキーに登録したアドレス（問い合わせフォームと同じキー → info@ubaku.jp）
  // 登録が成功したときだけ送る。失敗しても購読そのものには影響しない（黙って終わる）
  var NOTIFY_KEY = 'b46b2166-b396-4841-bbcf-230af2f710f4';
  function notify(email, interests) {
    var place = location.pathname.replace(/index\.html$/, '') || '/';
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: NOTIFY_KEY,
        subject: '【UBAKU Letter】新しい購読者：' + email,
        from_name: 'UBAKU Letter 購読通知',
        'メールアドレス': email,
        '楽しみな話': interests.length ? interests.join('、') : '（選ばずに登録）',
        '登録したページ': location.host + place,
        botcheck: ''
      })
    }).catch(function () {});
  }

  function send(form) {
    var buttons = form.querySelectorAll('[data-step="2"] button');
    var data = new FormData();
    var email = form.querySelector('.lt-input').value.trim();
    var interests = [];
    data.append('EMAIL', email);
    form.querySelectorAll('.lt-chips input:checked').forEach(function (c) { data.append('INTERESTS[]', c.value); interests.push(c.value); });
    data.append('email_address_check', form.querySelector('.gotcha').value);   // ロボット対策（人は空のまま）
    data.append('locale', 'ja');
    data.append('html_type', 'simple');

    buttons.forEach(function (b) { b.disabled = true; });
    function done() { form.classList.replace('is-step2', 'is-step3'); notify(email, interests); }
    function fail() {
      buttons.forEach(function (b) { b.disabled = false; });
      var note = form.querySelector('.lt-error') || form.querySelector('[data-step="2"]').appendChild(document.createElement('p'));
      note.className = 'lt-note lt-error';
      note.textContent = 'うまく送れませんでした。時間をおいて、もう一度お試しください。';
    }

    // Brevo の画面へ移らずに、裏で送る（?isAjax=1 で結果だけを受け取る）
    // ロボット判定の結果を待ってから送る（Brevo 側で確かめる）
    waitToken(form).then(function (token) {
      data.append('cf-turnstile-response', token);
      // Brevo の画面へ移らずに、裏で送る（?isAjax=1 で結果だけを受け取る）
      return fetch(BREVO_ACTION + '?isAjax=1', { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.success) done(); else { resetCheck(form); fail(); } })
        .catch(function () {
          // 結果を読めない環境のときは、送るだけ送って完了にする（Brevo 側には届く）
          return fetch(BREVO_ACTION, { method: 'POST', body: data, mode: 'no-cors' }).then(done, fail);
        });
    }, fail);
  }

  // ---------- 右下の札 ----------
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'lt-fab';
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.setAttribute('aria-label', 'UBAKU Letter（メールマガジン）を開く');
  fab.innerHTML = TOP +
    '<span class="lt-fab-body">' +
      '<span class="lt-fab-row">' + LOGO + '<span class="lt-fab-open" aria-hidden="true">＋</span></span>' +
      '<span class="lt-fab-ja">月に一度、大雪山のふもとからの便り</span>' +
    '</span>';

  // ---------- 札を押すと開く窓 ----------
  var pop = document.createElement('div');
  pop.className = 'lt-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'UBAKU Letter の購読');
  pop.innerHTML = TOP +
    '<div class="lt-pop-body">' +
      '<div class="lt-pop-head">' + LOGO +
        '<button type="button" class="lt-fold" aria-label="たたむ"><span aria-hidden="true"></span></button>' +
      '</div>' +
      '<p class="lt-catch">大雪山のふもとから、<br><em>月に一度の手紙を。</em></p>' +
      '<p class="lt-lead">季節のうつろい、宿や畑のこと、まちで動きはじめたこと。美瑛と東川町で暮らすわたしたちから、ひと月分の近況をお届けします。</p>' +
      formHTML('pop') +
    '</div>';

  // ---------- ページの中の購読欄（Journal のあと） ----------
  var band = document.createElement('section');
  band.className = 'lt-band';
  band.id = 'letter';
  band.innerHTML =
    '<div class="wrap">' +
      '<div class="lt-band-text">' +
        RIDGE +
        '<p class="lt-kicker">' + LOGO + '<span class="lt-kicker-ja">メールマガジン</span></p>' +
        '<p class="lt-catch">大雪山のふもとから、<br><em>月に一度の手紙を。</em></p>' +
        '<p class="lt-lead">季節のうつろい、宿や畑のこと、まちで動きはじめたこと。美瑛と東川町で暮らすわたしたちから、ひと月分の近況をお届けします。</p>' +
      '</div>' +
      formHTML('band') +
    '</div>';
  var journal = document.getElementById('journal');
  if (journal) journal.after(band);

  document.body.appendChild(fab);
  document.body.appendChild(pop);
  document.querySelectorAll('.lt-form').forEach(wire);

  // 開く・たたむ
  function open() {
    pop.classList.add('is-open');
    fab.classList.remove('is-shown');
    setTimeout(function () {
      var i = pop.querySelector('.is-step1 .lt-input');
      if (i) i.focus({ preventScroll: true });
    }, 250);
  }
  function fold() {
    pop.classList.remove('is-open');
    update();
    fab.focus({ preventScroll: true });
  }
  fab.addEventListener('click', open);
  pop.querySelector('.lt-fold').addEventListener('click', fold);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop.classList.contains('is-open')) fold(); });

  // ---------- 札を出す・隠すタイミング ----------
  var hero = document.querySelector('.hero');
  var contact = document.getElementById('contact');
  function inView(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  }
  function update() {
    var nearForm = inView(band) || inView(contact);
    if (pop.classList.contains('is-open')) {
      if (nearForm) pop.classList.remove('is-open');   // ページの中の欄まで来たら、窓は自然にたたむ
      else return;
    }
    var pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : scrollY > innerHeight;
    fab.classList.toggle('is-shown', pastHero && !nearForm);
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
