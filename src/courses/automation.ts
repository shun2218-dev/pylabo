/* ============================================================
   コース：Web/API・自動化
   一覧に出す情報（タイトルやアイコン）は src/courses/registry.ts 側にある。
   ============================================================ */

import type { CourseContent } from "../types";

/** アクセスログ（練習用）。 */
const ACCESS_LOG = `2026-05-01 09:12:03 GET /            200 128
2026-05-01 09:12:44 GET /about       200 96
2026-05-01 09:15:10 POST /api/login  200 41
2026-05-01 09:18:22 GET /            200 130
2026-05-01 10:02:51 GET /pricing     200 210
2026-05-01 10:33:09 GET /missing     404 12
2026-05-01 11:41:17 POST /api/order  500 8
2026-05-02 08:59:40 GET /            200 133
2026-05-02 09:03:12 GET /about       200 92
2026-05-02 09:44:05 POST /api/login  401 15
2026-05-02 10:12:38 GET /pricing     200 205
2026-05-02 12:20:55 GET /missing     404 11
2026-05-02 14:05:01 POST /api/order  200 64
2026-05-03 09:30:19 GET /            200 141
2026-05-03 09:31:02 GET /docs        200 77
2026-05-03 10:48:33 POST /api/order  500 9
2026-05-03 11:15:47 GET /docs        200 81
2026-05-03 13:22:10 GET /            200 125
2026-05-03 15:40:28 POST /api/login  200 38
2026-05-03 18:07:59 GET /missing     404 14
`;

/** 会員名簿（練習用）。わざと表記ゆれと空行を混ぜてある。 */
const MEMBERS_CSV = `name,email,joined,plan
 佐藤 太郎 ,SATO@example.com,2024-04-01,pro
鈴木 花子,suzuki@example.com,2025-11-15,free
高橋 健,TAKAHASHI@Example.COM,2023-01-20,pro
田中 実,tanaka@example.com,2026-02-28,free
伊藤 彩,ito@example.com,2025-06-30,team
`;

/** 設定ファイル（練習用）。 */
const SETTINGS_JSON = `{
  "app": "reporter",
  "version": "1.4.0",
  "output": {
    "format": "csv",
    "directory": "./out"
  },
  "targets": ["sales", "members", "access"],
  "notify": {
    "enabled": true,
    "channels": ["email", "slack"]
  }
}
`;

const content: CourseContent = {
  files: {
    "access.log": ACCESS_LOG,
    "members.csv": MEMBERS_CSV,
    "settings.json": SETTINGS_JSON,
  },

  chapters: [
    /* ================= 第1章 ================= */
    {
      id: "ch1",
      title: "第1章　ファイルを扱う",
      lessons: [
        {
          id: "l1",
          title: "pathlib でパスを扱う",
          goal: "文字列連結でパスを組み立てるのをやめる",
          body: `
自動化スクリプトの入口は、たいていファイルです。パスの扱いは \`os.path\` ではなく **\`pathlib\`** を使いましょう。

~~~
from pathlib import Path

p = Path("data") / "sales.csv"
~~~

\`/\` 演算子でパスをつなげます。OS ごとの区切り文字（\`/\` と \`\\\\\`）を気にしなくてよくなります。

### よく使う属性・メソッド

| 書き方 | 意味 |
|---|---|
| \`p.name\` | ファイル名（\`sales.csv\`） |
| \`p.stem\` | 拡張子なしの名前（\`sales\`） |
| \`p.suffix\` | 拡張子（\`.csv\`） |
| \`p.parent\` | 親ディレクトリ |
| \`p.exists()\` | 存在するか |
| \`p.read_text()\` | 中身を文字列で読む |
| \`p.write_text(s)\` | 文字列を書き出す |
| \`Path(".").glob("*.csv")\` | 条件に合うファイルを探す |

\`read_text\` / \`write_text\` は、\`open\` を書かずに 1 行で済むのが気持ちいいところです。

> **文字コードは必ず指定しましょう。** \`encoding="utf-8"\` を付けないと、環境によって文字化けします。

### もっと詳しく

- [pathlib（公式）](https://docs.python.org/ja/3/library/pathlib.html)
`,
          examples: [
            {
              caption: "パスを組み立てて調べる",
              code: `
from pathlib import Path

p = Path("data") / "2026" / "sales.csv"

print("パス     :", p)
print("ファイル名:", p.name)
print("拡張子なし:", p.stem)
print("拡張子   :", p.suffix)
print("親       :", p.parent)
print("親の親   :", p.parent.parent)

# 拡張子を差し替える
print("差し替え :", p.with_suffix(".json"))
`,
            },
            {
              caption: "今あるファイルを探す",
              code: `
from pathlib import Path

here = Path(".")

for f in sorted(here.iterdir()):
    if f.is_file():
        size = len(f.read_text(encoding="utf-8"))
        print(f"{f.name:<16} {size:>6} 文字")

print()
print("csv だけ:", [f.name for f in here.glob("*.csv")])
`,
            },
          ],
          exercise: {
            prompt: `
関数 \`report_name(path)\` を作ってください。

- \`Path\` または文字列のパスを受け取る
- 拡張子を \`.txt\` に変え、ファイル名の末尾に \`_report\` を付けた **\`Path\` を返す**
- 例：\`report_name("data/sales.csv")\` → \`Path("data/sales_report.txt")\`
`,
            starter: `
from pathlib import Path


def report_name(path):
    pass


print(report_name("data/sales.csv"))
print(report_name(Path("access.log")))
`,
            tests: `
from pathlib import Path

g = globals()
f = g.get("report_name")

check(callable(f), "report_name という関数を定義できている")
if callable(f):
    r = f("data/sales.csv")
    check(isinstance(r, Path), "Path を返している（文字列ではない）")
    check(str(r) == "data/sales_report.txt", f"data/sales_report.txt になる（今は {r}）")
    check(str(f(Path("access.log"))) == "access_report.txt", "Path を渡しても動く")
    check(str(f("a/b/c.json")) == "a/b/c_report.txt", "深いパスでも親が保たれる")
`,
            hint: "まず受け取った値を `Path()` に通します。あとは本文の表にある「拡張子なしの名前」と「親ディレクトリ」を組み合わせて、新しいパスを組み立てます。",
            solution: `from pathlib import Path


def report_name(path) -> Path:
    p = Path(path)
    return p.parent / f"{p.stem}_report.txt"


print(report_name("data/sales.csv"))
print(report_name(Path("access.log")))`,
          },
        },

        {
          id: "l2",
          title: "テキストを読む・書く",
          goal: "行単位の処理と、書き出しの基本を押さえる",
          body: `
### 読む

~~~
text = Path("access.log").read_text(encoding="utf-8")
lines = text.splitlines()
~~~

\`splitlines()\` は改行で分割し、**末尾の改行文字を残しません**。\`split("\\n")\` より扱いやすいので、こちらを使いましょう。

大きなファイルを 1 行ずつ処理したいときは \`with open\` の形が省メモリです。

~~~
with open("access.log", encoding="utf-8") as f:
    for line in f:
        ...
~~~

### 書く

~~~
Path("out.txt").write_text("\\n".join(lines), encoding="utf-8")
~~~

追記したいときは \`open(path, "a")\`。モードは \`"r"\`（読み）\`"w"\`（上書き）\`"a"\`（追記）。

> \`"w"\` は**中身を消してから**書き込みます。うっかり大事なファイルを空にしないよう、出力先は入力と別の名前にしておくのが安全です。

### 行を整える定石

~~~
lines = [l.strip() for l in text.splitlines() if l.strip()]
~~~

「前後の空白を取り、空行を捨てる」。ログやメモを扱うとき、まずこれをやります。
`,
          examples: [
            {
              caption: "ログを読んで数える",
              code: `
from pathlib import Path

text = Path("access.log").read_text(encoding="utf-8")
lines = [l.strip() for l in text.splitlines() if l.strip()]

print("行数:", len(lines))
print()
for line in lines[:3]:
    print(line)

print()
errors = [l for l in lines if " 404 " in l or " 500 " in l]
print("エラー行:", len(errors))
`,
            },
            {
              caption: "加工して書き出す",
              code: `
from pathlib import Path

lines = Path("access.log").read_text(encoding="utf-8").splitlines()
errors = [l for l in lines if " 404 " in l or " 500 " in l]

out = Path("errors.txt")
out.write_text("\\n".join(errors) + "\\n", encoding="utf-8")

# 書けたか確認する
print("書き出し先:", out, "／存在:", out.exists())
print()
print(out.read_text(encoding="utf-8"))
`,
            },
          ],
          exercise: {
            prompt: `
\`access.log\` を読み、**ステータスコードが 200 の行だけ** を数えてください。

- 変数 \`ok_lines\` … 200 の行のリスト（文字列のまま）
- 変数 \`ok_count\` … その件数

> 各行は \`日付 時刻 メソッド パス ステータス 応答時間\` の形です。空白で区切って後ろから数えると確実です。
`,
            starter: `
from pathlib import Path

lines = [
    l.strip()
    for l in Path("access.log").read_text(encoding="utf-8").splitlines()
    if l.strip()
]

ok_lines =
ok_count = 0

print(ok_count)
`,
            tests: `
g = globals()

check(g.get("ok_count") == 14, f"ok_count が 14 になっている（今は {g.get('ok_count')}）")
ok = g.get("ok_lines")
check(isinstance(ok, list) and len(ok) == 14, "ok_lines が 14 件のリストになっている")
if isinstance(ok, list) and ok:
    check(all(l.split()[-2] == "200" for l in ok), "すべて 200 の行になっている")
`,
            hint: "`split()` で空白区切りのリストにできます。ステータスは後ろから数えたほうが確実です（負のインデックスが使えます）。",
            solution: `from pathlib import Path

lines = [
    l.strip()
    for l in Path("access.log").read_text(encoding="utf-8").splitlines()
    if l.strip()
]

ok_lines = [l for l in lines if l.split()[-2] == "200"]
ok_count = len(ok_lines)

print(ok_count)`,
          },
        },

        {
          id: "l3",
          title: "CSV と JSON",
          goal: "構造のあるデータを読み書きできるようにする",
          body: `
### CSV

読み込みは \`csv.DictReader\`、書き出しは \`csv.DictWriter\` が基本です。

~~~
import csv

with open("members.csv", encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))
~~~

> \`newline=""\` は CSV を開くときのお約束です。付けないと環境によって空行が入ります。

### JSON

設定ファイルや API のやりとりで最頻出です。

| 関数 | 用途 |
|---|---|
| \`json.load(f)\` | ファイルから読む |
| \`json.loads(s)\` | 文字列から読む |
| \`json.dump(obj, f)\` | ファイルへ書く |
| \`json.dumps(obj)\` | 文字列にする |

**\`s\` が付くほうが文字列（string）版**、と覚えると混乱しません。

日本語を含むデータを書き出すときは \`ensure_ascii=False\` を付けます。付けないと \`\\u3042\` のようなエスケープになります。読みやすく整形するなら \`indent=2\`。

~~~
json.dumps(data, ensure_ascii=False, indent=2)
~~~

JSON は Python の辞書・リストとそのまま対応します（\`null\` ↔ \`None\`、\`true\` ↔ \`True\`）。

### もっと詳しく

- [csv（公式）](https://docs.python.org/ja/3/library/csv.html)
- [json（公式）](https://docs.python.org/ja/3/library/json.html)
`,
          examples: [
            {
              caption: "CSV を読んで整える",
              code: `
import csv

with open("members.csv", encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))

print("件数:", len(rows))
print("生データ:", rows[0])
print()

# 表記ゆれをそろえる
cleaned = [
    {
        "name": r["name"].strip(),
        "email": r["email"].strip().lower(),
        "joined": r["joined"],
        "plan": r["plan"],
    }
    for r in rows
]

for r in cleaned:
    print(f'{r["name"]:<10} {r["email"]:<28} {r["plan"]}')
`,
            },
            {
              caption: "JSON を読む・書く",
              code: `
import json
from pathlib import Path

settings = json.loads(Path("settings.json").read_text(encoding="utf-8"))

print(type(settings))
print("アプリ名:", settings["app"])
print("出力形式:", settings["output"]["format"])
print("対象   :", ", ".join(settings["targets"]))
print("通知ON :", settings["notify"]["enabled"])
print()

# 書き換えて保存する
settings["output"]["format"] = "json"
settings["targets"].append("logs")

Path("settings.out.json").write_text(
    json.dumps(settings, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(Path("settings.out.json").read_text(encoding="utf-8"))
`,
            },
          ],
          exercise: {
            prompt: `
\`members.csv\` を読み、**プラン別の人数** を数えた辞書を作ってください。

- 変数名は \`plan_counts\`
- 例：\`{"pro": 2, "free": 2, "team": 1}\`

さらに、その辞書を \`plan_counts.json\` に **日本語をエスケープせず、インデント 2 で** 書き出してください。
`,
            starter: `
import csv
import json
from pathlib import Path

with open("members.csv", encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))

plan_counts = {}

# ここで plan_counts.json に書き出す

print(plan_counts)
`,
            tests: `
import json
from pathlib import Path

g = globals()
pc = g.get("plan_counts")

check(pc == {"pro": 2, "free": 2, "team": 1}, f"plan_counts が正しい（今は {pc}）")

out = Path("plan_counts.json")
check(out.exists(), "plan_counts.json を書き出せている")
if out.exists():
    text = out.read_text(encoding="utf-8")
    check(json.loads(text) == {"pro": 2, "free": 2, "team": 1}, "書き出した JSON の中身が正しい")
    check("\\n" in text and "  " in text, "indent=2 で整形されている")
`,
            hint: [
              "課題は「数える」と「書き出す」の 2 つに分かれています。まず `plan_counts` を正しく作り、`print` で中身を確かめてから、書き出しに進みましょう。",
              "数え上げは「そのプランを初めて見たら 1、2 回目からは今の値に 1 を足す」という動きです。まだ辞書に無いキーにいきなり足そうとすると落ちるので、そこをどう避けるかが要点です（基本文法コース 第2章）。",
              "書き出しは「辞書を JSON の文字列に変える」→「その文字列をファイルに書く」の 2 段階です。採点されるのは、日本語が `\\u30d7...` ではなくそのまま読める形か、そして改行と字下げが入っているかの 2 点。どちらも文字列に変える側で指定します。",
            ],
            solution: `import csv
import json
from pathlib import Path

with open("members.csv", encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))

plan_counts = {}
for r in rows:
    plan = r["plan"]
    plan_counts[plan] = plan_counts.get(plan, 0) + 1

Path("plan_counts.json").write_text(
    json.dumps(plan_counts, ensure_ascii=False, indent=2), encoding="utf-8"
)

print(plan_counts)`,
          },
        },
      ],
    },

    /* ================= 第2章 ================= */
    {
      id: "ch2",
      title: "第2章　テキストから情報を取り出す",
      lessons: [
        {
          id: "l4",
          title: "正規表現 re",
          goal: "「決まった形の文字列」を取り出す道具を使えるようにする",
          body: `
\`split\` や \`in\` で足りないとき、**正規表現**の出番です。

~~~
import re

m = re.search(r"(\\d{4})-(\\d{2})-(\\d{2})", text)
if m:
    year, month, day = m.groups()
~~~

> 正規表現の文字列には **\`r"..."\`（raw 文字列）** を使います。\`\\d\` などのバックスラッシュをそのまま渡すためです。

### よく使う部品

| 記法 | 意味 |
|---|---|
| \`\\d\` | 数字 1 文字 |
| \`\\w\` | 英数字かアンダースコア |
| \`\\s\` | 空白 |
| \`.\` | 任意の 1 文字 |
| \`+\` \`*\` \`?\` | 1 回以上／0 回以上／0 か 1 回 |
| \`{3}\` \`{2,4}\` | 回数の指定 |
| \`[abc]\` | いずれか 1 文字 |
| \`^\` \`$\` | 行頭／行末 |
| \`(...)\` | グループ（あとで取り出せる） |

### よく使う関数

- \`re.search(pattern, s)\` … 最初に一致した箇所（無ければ \`None\`）
- \`re.findall(pattern, s)\` … 一致した全部をリストで
- \`re.sub(pattern, repl, s)\` … 置換
- \`re.match\` … **先頭からの**一致（\`search\` と混同しやすい）

> 凝ったパターンは後から読めなくなります。**まず \`split\` で足りないか考え、それでも無理なときに使う**くらいがちょうどいいバランスです。

### もっと詳しく

- [正規表現 HOWTO（公式・日本語）](https://docs.python.org/ja/3/howto/regex.html)
- [re（公式）](https://docs.python.org/ja/3/library/re.html)
`,
          examples: [
            {
              caption: "ログから欲しいものを抜く",
              code: `
import re
from pathlib import Path

lines = Path("access.log").read_text(encoding="utf-8").splitlines()

pattern = re.compile(
    r"^(?P<date>\\d{4}-\\d{2}-\\d{2}) (?P<time>[\\d:]+) "
    r"(?P<method>\\w+) +(?P<path>\\S+) +(?P<status>\\d{3}) (?P<ms>\\d+)$"
)

for line in lines[:5]:
    m = pattern.match(line)
    if m:
        print(m.group("date"), m.group("method"), m.group("path"), m.group("status"))

print()
# 名前つきグループは辞書にできる
m = pattern.match(lines[0])
print(m.groupdict())
`,
            },
            {
              caption: "findall と sub",
              code: `
import re

text = """
問い合わせ: sato@example.com（担当 佐藤）
予備連絡先: suzuki@example.co.jp
電話: 03-1234-5678 / 090-8765-4321
"""

emails = re.findall(r"[\\w.+-]+@[\\w.-]+\\.\\w+", text)
print("メール:", emails)

phones = re.findall(r"\\d{2,4}-\\d{3,4}-\\d{4}", text)
print("電話  :", phones)

masked = re.sub(r"\\d{2,4}-\\d{3,4}-\\d{4}", "***-****-****", text)
print(masked.strip())
`,
            },
          ],
          exercise: {
            prompt: `
\`access.log\` から **パスだけ** を取り出してください。

- 変数 \`paths\` … 各行のパス（\`/\` や \`/api/login\` など）を並べたリスト
- 変数 \`unique_paths\` … 重複を除いて並べ替えたリスト

正規表現でも \`split()\` でも構いません。結果が合っていればクリアです。
`,
            starter: `
import re
from pathlib import Path

lines = [
    l for l in Path("access.log").read_text(encoding="utf-8").splitlines() if l.strip()
]

paths =
unique_paths =

print(unique_paths)
`,
            tests: `
g = globals()
paths = g.get("paths")
uniq = g.get("unique_paths")

check(isinstance(paths, list) and len(paths) == 20, f"paths が 20 件になっている（今は {0 if paths is None else len(paths)}）")
check(
    uniq == ["/", "/about", "/api/login", "/api/order", "/docs", "/missing", "/pricing"],
    f"unique_paths が正しい（今は {uniq}）",
)
if isinstance(paths, list) and paths:
    check(paths[0] == "/", "1 件目のパスが / になっている")
    check(all(p.startswith("/") for p in paths), "すべて / から始まっている")
`,
            hint: "ログの 1 行を見て、空白で分割したとき何番目がパスか数えてみましょう（インデックスは 0 から）。重複除去は基本文法コース 第2章の集合が使えます。",
            solution: `from pathlib import Path

lines = [
    l for l in Path("access.log").read_text(encoding="utf-8").splitlines() if l.strip()
]

paths = [l.split()[3] for l in lines]
unique_paths = sorted(set(paths))

print(unique_paths)`,
          },
        },

        {
          id: "l5",
          title: "日付と時刻",
          goal: "「いつ」の情報を集計に使えるようにする",
          body: `
自動化では「先月ぶん」「直近 7 日」といった日付の絞り込みが頻繁に出てきます。

~~~
from datetime import datetime, date, timedelta
~~~

### 文字列 ↔ 日時

| 方向 | 書き方 |
|---|---|
| 文字列 → 日時 | \`datetime.strptime("2026-05-01", "%Y-%m-%d")\` |
| 日時 → 文字列 | \`dt.strftime("%Y/%m/%d %H:%M")\` |
| ISO 形式なら | \`datetime.fromisoformat("2026-05-01 09:12:03")\` |

書式コードは \`%Y\`（年4桁）\`%m\`（月）\`%d\`（日）\`%H\`（時）\`%M\`（分）\`%S\`（秒）。

### 計算

日時どうしを引くと \`timedelta\` になります。

~~~
diff = end - start
print(diff.days, diff.total_seconds())
~~~

足し引きも \`timedelta(days=7)\` のように書きます。

### 集計のキーにする

日単位でまとめたいなら \`dt.date()\`、月単位なら \`dt.strftime("%Y-%m")\` をキーにするのが手軽です。

> **タイムゾーン** が絡む場合は \`datetime.now(timezone.utc)\` のように必ず指定しましょう。タイムゾーンなしの日時（naive）と付きの日時（aware）は比較できず、エラーになります。

### もっと詳しく

- [datetime（公式）](https://docs.python.org/ja/3/library/datetime.html)
- [strftime の書式コード一覧（公式）](https://docs.python.org/ja/3/library/datetime.html#strftime-and-strptime-format-codes)
`,
          examples: [
            {
              caption: "文字列を日時に変える",
              code: `
from datetime import datetime, timedelta

s = "2026-05-01 09:12:03"
dt = datetime.strptime(s, "%Y-%m-%d %H:%M:%S")

print(dt)
print("年:", dt.year, "月:", dt.month, "日:", dt.day)
print("曜日:", dt.strftime("%A"))
print("整形:", dt.strftime("%Y年%m月%d日 %H時%M分"))
print()

later = dt + timedelta(days=10, hours=3)
print("10日3時間後:", later)
print("差:", (later - dt))
`,
            },
            {
              caption: "日ごとにまとめる",
              code: `
from collections import defaultdict
from datetime import datetime
from pathlib import Path

lines = [
    l for l in Path("access.log").read_text(encoding="utf-8").splitlines() if l.strip()
]

per_day = defaultdict(int)
for line in lines:
    parts = line.split()
    dt = datetime.strptime(f"{parts[0]} {parts[1]}", "%Y-%m-%d %H:%M:%S")
    per_day[dt.date()] += 1

for day, count in sorted(per_day.items()):
    bar = "#" * count
    print(f"{day} {count:>3} {bar}")
`,
            },
          ],
          exercise: {
            prompt: `
\`access.log\` を読み、**時間帯（時）ごとのアクセス件数** を数えてください。

- 変数名は \`per_hour\`
- キーは時（int、0〜23）、値は件数
- 例：\`{8: 1, 9: 8, 10: 4, ...}\`
`,
            starter: `
from datetime import datetime
from pathlib import Path

lines = [
    l for l in Path("access.log").read_text(encoding="utf-8").splitlines() if l.strip()
]

per_hour = {}

for hour in sorted(per_hour):
    print(f"{hour:>2}時: {per_hour[hour]}件")
`,
            tests: `
g = globals()
ph = g.get("per_hour")

check(isinstance(ph, dict), "per_hour が辞書になっている")
if isinstance(ph, dict):
    check(sum(ph.values()) == 20, f"件数の合計が 20 になる（今は {sum(ph.values())}）")
    check(all(isinstance(k, int) for k in ph), "キーが整数の「時」になっている")
    check(ph.get(9) == 8, f"9 時台が 8 件（今は {ph.get(9)}）")
    check(ph.get(18) == 1, "18 時台が 1 件")
    check(11 in ph and 15 in ph, "11 時台・15 時台も数えられている")
`,
            hint: "時刻は `09:12:03` の形です。`:` で区切って先頭を整数にする方法と、`datetime` に変換してから属性を見る方法のどちらでも構いません。",
            solution: `from datetime import datetime
from pathlib import Path

lines = [
    l for l in Path("access.log").read_text(encoding="utf-8").splitlines() if l.strip()
]

per_hour = {}
for line in lines:
    parts = line.split()
    dt = datetime.strptime(f"{parts[0]} {parts[1]}", "%Y-%m-%d %H:%M:%S")
    per_hour[dt.hour] = per_hour.get(dt.hour, 0) + 1

for hour in sorted(per_hour):
    print(f"{hour:>2}時: {per_hour[hour]}件")`,
          },
        },
      ],
    },

    /* ================= 第3章 ================= */
    {
      id: "ch3",
      title: "第3章　外の世界とつながる",
      lessons: [
        {
          id: "l6",
          title: "HTTP と API の基礎",
          goal: "リクエストとレスポンスの構造を理解し、JSON を扱えるようにする",
          body: `
Web API とのやりとりは、次の 2 つの往復でできています。

- **リクエスト** … メソッド（GET / POST など）、URL、ヘッダー、ボディ
- **レスポンス** … ステータスコード、ヘッダー、ボディ（多くは JSON）

### メソッドの意味

| メソッド | 用途 |
|---|---|
| \`GET\` | 取得する（何も変えない） |
| \`POST\` | 新しく作る |
| \`PUT\` / \`PATCH\` | 置き換える／一部更新 |
| \`DELETE\` | 削除する |

### ステータスコード

| 範囲 | 意味 |
|---|---|
| 2xx | 成功（200 OK, 201 Created, 204 No Content） |
| 3xx | リダイレクト |
| 4xx | **こちら側の問題**（400 不正, 401 未認証, 403 禁止, 404 なし, 429 回数超過） |
| 5xx | **相手側の問題**（500 内部エラー, 503 停止中） |

4xx はリクエストを直す、5xx は時間をおいて再試行する。この切り分けができると、対処がぐっと速くなります。

### Python から呼ぶ

実務では \`requests\`（または \`httpx\`）を使います。**このブラウザ内では外部通信ができない**ので、下のコードは読むだけの参考として載せます。手元で試すときは \`pip install requests\` してください。

このレッスンの演習では、**返ってきた JSON を処理する側** を書きます。実際、API 連携の作業時間のほとんどはこちらです。

### もっと詳しく

- [requests クイックスタート（公式・日本語）](https://requests.readthedocs.io/projects/ja/latest/user/quickstart.html)
- [HTTP ステータスコード一覧（MDN）](https://developer.mozilla.org/ja/docs/Web/HTTP/Status)
`,
          examples: [
            {
              caption: "requests の基本形（手元で動かす用）",
              runnable: false,
              code: `
import requests

# --- GET ---
res = requests.get(
    "https://api.example.com/users",
    params={"page": 1, "per_page": 20},
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    timeout=10,          # タイムアウトは必ず指定する
)
res.raise_for_status()   # 4xx / 5xx なら例外にする
users = res.json()

# --- POST ---
res = requests.post(
    "https://api.example.com/users",
    json={"name": "山田", "plan": "pro"},   # json= で自動的に JSON 化
    timeout=10,
)
print(res.status_code, res.json())

# --- エラー処理 ---
try:
    res = requests.get("https://api.example.com/health", timeout=5)
    res.raise_for_status()
except requests.Timeout:
    print("時間切れ。あとでもう一度試す")
except requests.HTTPError as e:
    print("HTTP エラー:", e.response.status_code)
`,
            },
            {
              caption: "返ってきた JSON を処理する（こちらは実行できます）",
              code: `
import json

# API から返ってきたつもりのレスポンス
raw = """
{
  "page": 1,
  "total": 3,
  "users": [
    {"id": 1, "name": "佐藤", "plan": "pro",  "active": true},
    {"id": 2, "name": "鈴木", "plan": "free", "active": false},
    {"id": 3, "name": "高橋", "plan": "pro",  "active": true}
  ]
}
"""

data = json.loads(raw)

print("総件数:", data["total"])
for u in data["users"]:
    mark = "○" if u["active"] else "×"
    print(f'{mark} {u["id"]}: {u["name"]}（{u["plan"]}）')

print()
active_pro = [u["name"] for u in data["users"] if u["active"] and u["plan"] == "pro"]
print("有効な pro 会員:", active_pro)
`,
            },
          ],
          exercise: {
            prompt: `
API のレスポンスを要約する関数 \`summarize(response)\` を作ってください。

- 引数は \`json.loads\` 済みの辞書
- 次のキーを持つ辞書を返す
  - \`"total"\` … \`users\` の件数
  - \`"active"\` … \`active\` が \`True\` の件数
  - \`"plans"\` … プラン別の件数の辞書（例 \`{"pro": 2, "free": 1}\`）
- \`users\` が無い、または空でも落ちないこと（その場合は \`total\` も \`active\` も \`0\`、\`plans\` は空の辞書）
`,
            starter: `
import json

raw = """
{
  "page": 1,
  "users": [
    {"id": 1, "name": "佐藤", "plan": "pro",  "active": true},
    {"id": 2, "name": "鈴木", "plan": "free", "active": false},
    {"id": 3, "name": "高橋", "plan": "pro",  "active": true},
    {"id": 4, "name": "田中", "plan": "team", "active": true}
  ]
}
"""


def summarize(response):
    pass


print(summarize(json.loads(raw)))
`,
            tests: `
g = globals()
f = g.get("summarize")

check(callable(f), "summarize という関数を定義できている")
if callable(f):
    data = {
        "page": 1,
        "users": [
            {"id": 1, "name": "佐藤", "plan": "pro", "active": True},
            {"id": 2, "name": "鈴木", "plan": "free", "active": False},
            {"id": 3, "name": "高橋", "plan": "pro", "active": True},
            {"id": 4, "name": "田中", "plan": "team", "active": True},
        ],
    }
    r = f(data)
    check(isinstance(r, dict), "辞書を返している")
    check(r.get("total") == 4, f"total が 4（今は {r.get('total')}）")
    check(r.get("active") == 3, f"active が 3（今は {r.get('active')}）")
    check(r.get("plans") == {"pro": 2, "free": 1, "team": 1}, f"plans が正しい（今は {r.get('plans')}）")

    empty = f({"page": 1})
    check(empty.get("total") == 0 and empty.get("plans") == {}, "users が無くても落ちない")
`,
            hint: [
              "返す 3 つの値はすべて `users` のリストだけから出せます。まず `users` を 1 つの変数に取り出し、そこから total・active・plans を順に組み立てると、あとの見通しがよくなります。",
              "`users` キーが無いレスポンスも来ます。「キーがあるかどうかで処理を分ける」と書くこともできますが、取り出す時点で「無ければ空のリスト」にしてしまえば、以降は分岐なしで同じコードが通ります（基本文法コース 第2章）。空のリストなら件数は自然に 0 になります。",
              "`active` は真偽値なので、`active` が真の要素だけを数えることになります。`plans` はプランをキーにした数え上げで、初めて出てきたキーをどう扱うかは前のレッスンと同じ問題です。",
            ],
            solution: `import json


def summarize(response) -> dict:
    users = response.get("users", [])

    plans = {}
    for u in users:
        plan = u.get("plan", "unknown")
        plans[plan] = plans.get(plan, 0) + 1

    return {
        "total": len(users),
        "active": sum(1 for u in users if u.get("active")),
        "plans": plans,
    }


raw = """
{
  "page": 1,
  "users": [
    {"id": 1, "name": "佐藤", "plan": "pro",  "active": true},
    {"id": 2, "name": "鈴木", "plan": "free", "active": false},
    {"id": 3, "name": "高橋", "plan": "pro",  "active": true},
    {"id": 4, "name": "田中", "plan": "team", "active": true}
  ]
}
"""

print(summarize(json.loads(raw)))`,
          },
        },

        {
          id: "l7",
          title: "卒業制作：ログ集計ツール",
          goal: "読み込み・集計・出力を通した、実用スクリプトを完成させる",
          body: `
仕上げです。\`access.log\` を読んで、次のレポートを出すツールを作ります。

- 総アクセス数
- ステータス別の件数
- エラー率
- 人気パス上位

### 実用スクリプトの作法

1. **関数に分ける** — 読み込み・集計・整形を別々にする
2. **入出力を引数にする** — ファイル名を決め打ちにしない
3. **結果はデータで返す** — \`print\` は最後にまとめてやる

3 番目がとくに大事です。集計関数が \`print\` してしまうと、あとで「CSV にも出したい」「Slack にも送りたい」となったときに書き直しになります。**データを返す関数と、表示する関数を分ける**のが再利用のコツです。

> 手元の Python では、この形にしたうえで \`if __name__ == "__main__":\` を書き、\`python report.py access.log\` のように動かせるようにします。
`,
          examples: [
            {
              caption: "手元で仕上げるときの完成形（参考）",
              runnable: false,
              code: `
"""access.log を集計してレポートを出す。

使い方:
    python report.py access.log
"""

import sys
from collections import Counter
from pathlib import Path


def load(path: str) -> list[dict]:
    lines = [
        l.strip()
        for l in Path(path).read_text(encoding="utf-8").splitlines()
        if l.strip()
    ]
    records = []
    for line in lines:
        date, time, method, url, status, ms = line.split()
        records.append(
            {
                "date": date,
                "time": time,
                "method": method,
                "path": url,
                "status": int(status),
                "ms": int(ms),
            }
        )
    return records


def analyze(records: list[dict]) -> dict:
    statuses = Counter(r["status"] for r in records)
    errors = sum(n for s, n in statuses.items() if s >= 400)
    return {
        "total": len(records),
        "statuses": dict(statuses),
        "error_rate": round(errors / len(records) * 100, 1) if records else 0.0,
        "top_paths": Counter(r["path"] for r in records).most_common(3),
    }


def render(report: dict) -> str:
    lines = [
        "=== アクセスレポート ===",
        f'総アクセス数: {report["total"]}',
        f'エラー率    : {report["error_rate"]}%',
        "",
        "ステータス別:",
    ]
    for status, count in sorted(report["statuses"].items()):
        lines.append(f"  {status}: {count}")
    lines.append("")
    lines.append("人気パス:")
    for path, count in report["top_paths"]:
        lines.append(f"  {path:<14} {count}")
    return "\\n".join(lines)


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "access.log"
    print(render(analyze(load(path))))
`,
            },
          ],
          exercise: {
            prompt: `
上の設計にならって、**\`load\` と \`analyze\` の 2 つ** を自分で書いてください。

1. \`load(path)\` … ログを読み、1 行を次の辞書にしたリストを返す
   - \`date\`, \`time\`, \`method\`, \`path\`（str）／\`status\`, \`ms\`（**int**）
2. \`analyze(records)\` … 次のキーを持つ辞書を返す
   - \`"total"\` … 件数
   - \`"statuses"\` … ステータス別件数の辞書（キーは int）
   - \`"error_rate"\` … 400 以上の割合（％、小数第 1 位で丸める）
   - \`"top_paths"\` … 多い順に 3 件の \`(パス, 件数)\` タプルのリスト

> 表示部分は用意してあります。2 つの関数を書けばレポートが出ます。
`,
            starter: `
from collections import Counter
from pathlib import Path


def load(path):
    pass


def analyze(records):
    pass


# --- ここから下は書き換えなくて構いません ---
records = load("access.log")
report = analyze(records)

print("=== アクセスレポート ===")
print("総アクセス数:", report["total"])
print("エラー率    :", f'{report["error_rate"]}%')
print()
print("ステータス別:")
for status, count in sorted(report["statuses"].items()):
    print(f"  {status}: {count}")
print()
print("人気パス:")
for path, count in report["top_paths"]:
    print(f"  {path:<14} {count}")
`,
            tests: `
g = globals()
load = g.get("load")
analyze = g.get("analyze")

check(callable(load), "load を定義できている")
check(callable(analyze), "analyze を定義できている")

if callable(load):
    recs = load("access.log")
    check(isinstance(recs, list) and len(recs) == 20, f"20 件読めている（今は {0 if recs is None else len(recs)}）")
    if recs:
        first = recs[0]
        check(first.get("path") == "/", "1 件目の path が /")
        check(first.get("status") == 200 and isinstance(first["status"], int), "status が int になっている")
        check(isinstance(first.get("ms"), int), "ms が int になっている")

    if callable(analyze):
        rep = analyze(recs)
        check(rep.get("total") == 20, "total が 20")
        check(rep.get("statuses") == {200: 14, 404: 3, 500: 2, 401: 1}, f"statuses が正しい（今は {rep.get('statuses')}）")
        check(rep.get("error_rate") == 30.0, f"error_rate が 30.0（今は {rep.get('error_rate')}）")
        check(rep.get("top_paths")[0] == ("/", 5), f"人気 1 位が ('/', 5)（今は {rep.get('top_paths')[0] if rep.get('top_paths') else None}）")
        check(len(rep.get("top_paths", [])) == 3, "top_paths が 3 件")
`,
            hint: [
              "2 つの関数は役割がはっきり分かれています。`load` は「テキストを扱いやすい形に変える」だけ、`analyze` は「変換済みのデータを数える」だけ。まず `load` のチェックを通してから `analyze` に進むと、どちらの問題か切り分けられます。",
              "`load` … ログの 1 行は空白区切りで 6 つに分かれます。ここで全部を文字列のまま辞書に入れると、あとで「200 かどうか」「400 以上か」を比べるときに文字列の比較になってしまい、結果が狂います。数として扱う列はこの段階で変換しておきましょう。",
              "`analyze` … `total` は件数、`statuses` はステータスごとの数え上げ、`top_paths` は「多い順に 3 件」です。数え上げと順位付けをまとめて引き受けてくれる道具が基本文法コース 第4章にありました。ただし採点は素の辞書と比べるので、返す形が辞書になっているかは確かめてください。",
              "`error_rate` … 「400 以上のステータスの件数 ÷ 全件数 × 100」を、小数第 1 位で丸めた値です。件数を数える条件（400 以上か）と、丸める桁の指定、その 2 つが合っていれば 30.0 になります。",
            ],
            solution: `from collections import Counter
from pathlib import Path


def load(path: str) -> list:
    lines = [
        l.strip()
        for l in Path(path).read_text(encoding="utf-8").splitlines()
        if l.strip()
    ]

    records = []
    for line in lines:
        date, time, method, url, status, ms = line.split()
        records.append(
            {
                "date": date,
                "time": time,
                "method": method,
                "path": url,
                "status": int(status),
                "ms": int(ms),
            }
        )
    return records


def analyze(records: list) -> dict:
    statuses = Counter(r["status"] for r in records)
    errors = sum(n for s, n in statuses.items() if s >= 400)

    return {
        "total": len(records),
        "statuses": dict(statuses),
        "error_rate": round(errors / len(records) * 100, 1) if records else 0.0,
        "top_paths": Counter(r["path"] for r in records).most_common(3),
    }`,
          },
        },
      ],
    },
  ],
};

export default content;
