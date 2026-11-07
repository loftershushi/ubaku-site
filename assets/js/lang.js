/* 言語の自動切り替え（2026-11-07）
   ブラウザの言語に日本語も中国語（繁体字・簡体字）も入っていない人が日本語ページを開いたら、同じ内容の英語ページへ移す。
   中国語のブラウザは日本語ページのまま（mashuさん指定 2026-11-07）。IP では判定しない。
   ・英語ページから日本語へは自動で移さない（URL を指定して英語版を見たい人のため）
   ・JA を押した人は、その選択を覚えて自動では移さない（EN を押すと選択を消す）
   ・検索エンジンのロボットは移さない（日本語ページも検索に載せるため） */
(function () {
  'use strict';
  var KEY = 'ubaku-lang';

  // 保存が使えないブラウザでも止まらないようにする
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(value) {
    try {
      if (value) { localStorage.setItem(KEY, value); } else { localStorage.removeItem(KEY); }
    } catch (e) { /* 保存できなくても切り替えは動く */ }
  }

  // JA / EN を押したときの選択を覚える
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('.lang-switch a') : null;
    if (link) { remember(link.getAttribute('hreflang') === 'ja' ? 'ja' : null); }
  });

  if (document.documentElement.lang !== 'ja' || saved() === 'ja') { return; }
  if (/bot|crawl|spider|slurp|google|bing|yandex|baidu|lighthouse|facebookexternalhit/i.test(navigator.userAgent)) { return; }

  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  var staysJapanese = Array.prototype.some.call(langs, function (l) { return /^(ja|zh)\b/i.test(l); });
  if (staysJapanese) { return; }

  location.replace('/en' + location.pathname + location.search + location.hash);
})();
