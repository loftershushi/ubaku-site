# 3つのnoteアカウントのRSS（記事一覧）をまとめて、サイトの Journal 用の assets/js/notes.js を作る
# 使い方：「python tools/make_notes.py」を実行（どこから実行しても ubaku-site/assets/js/notes.js に保存される）
# ※ .js にしているのは、HTMLファイルをダブルクリックで直接開いても読み込めるようにするため
import json
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

# 載せるnoteアカウント（RSSの名前 → カードに出す名前）
ACCOUNTS = [
    ("loftershushi", "mashu"),
    ("ubakuvilla", "UBAKU Villa 宇莫別荘"),
    ("ubaku_jp", "UBAKU"),
]
YEAR = 2026   # この年の記事だけ載せる（年が変わったらここを直す）
MEDIA = "{http://search.yahoo.com/mrss/}"   # 画像（サムネイル）の項目の名前空間


def fix_title(title):
    """サイトのルールに合わせてタイトルを整える
    ・ブランド名の「Ubaku」は大文字の「UBAKU」にする（2026-10-11 決定）
    ・「UBAKU Villa」だけの表記には「宇莫別荘」を足す（すでに宇莫別荘・南邸が付いていれば何もしない）"""
    title = re.sub(r"(?<![A-Za-z])Ubaku(?![A-Za-z])", "UBAKU", title)
    return re.sub(r"UBAKU Villa(?!\s*(宇莫別荘|南邸))", "UBAKU Villa 宇莫別荘", title)


def read_account(user, label):
    """1つのアカウントの記事一覧を読み込む（読めなかったら空のまま進む）"""
    url = f"https://note.com/{user}/rss"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        root = ET.fromstring(urllib.request.urlopen(req, timeout=20).read())
    except Exception as e:
        print(f"[注意] {user} を読み込めませんでした：{e}")
        return []
    notes = []
    for item in root.iter("item"):
        date = parsedate_to_datetime(item.findtext("pubDate"))
        if date.year != YEAR:
            continue
        thumb = item.findtext(MEDIA + "thumbnail", "").strip()
        thumb = re.sub(r"\?width=\d+", "?width=600", thumb)   # 画像の幅を600pxに（軽くするため）
        notes.append({
            "title": fix_title(item.findtext("title", "").strip()),
            "url": item.findtext("link", "").strip(),
            "date": date.strftime("%Y.%m.%d"),
            "sort": date.isoformat(),
            "source": label,
            "image": thumb,
        })
    print(f"{user}: {len(notes)} articles in {YEAR}")
    return notes


notes = []
for user, label in ACCOUNTS:
    notes += read_account(user, label)
notes.sort(key=lambda n: n["sort"], reverse=True)   # 3つをまとめて新しい順に
for n in notes:
    del n["sort"]

# 保存先（GitHub の自動実行では、環境変数 NOTES_OUT で公開用リポジトリの assets/js/notes.js を指定する）
OUT = os.environ.get("NOTES_OUT") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "js", "notes.js")
with open(OUT, "w", encoding="utf-8") as f:
    f.write("/* noteの記事一覧（tools/make_notes.py で自動作成。手で直さない） */\n")
    f.write("window.UBAKU_NOTES = ")
    json.dump(notes, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("total:", len(notes))
