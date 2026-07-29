/* ============================================================
   コース：データ分析・集計
   一覧に出す情報（タイトルやアイコン）は src/courses/registry.ts 側にある。
   ============================================================ */

import type { CourseContent } from "../types";

/** 全レッスンで使う練習用データ（仮想ファイルシステムに置かれる）。 */
const SALES_CSV = `date,store,category,item,quantity,price
2026-04-02,渋谷,ドリンク,カフェラテ,12,480
2026-04-02,渋谷,フード,サンドイッチ,5,620
2026-04-02,新宿,ドリンク,ブレンド,20,380
2026-04-03,渋谷,ドリンク,ブレンド,15,380
2026-04-03,新宿,フード,キッシュ,3,780
2026-04-03,横浜,ドリンク,カフェラテ,9,480
2026-04-05,渋谷,スイーツ,チーズケーキ,7,520
2026-04-05,新宿,ドリンク,カフェラテ,18,480
2026-04-06,横浜,フード,サンドイッチ,6,620
2026-04-07,渋谷,ドリンク,カフェラテ,14,480
2026-04-08,新宿,スイーツ,ガトーショコラ,11,560
2026-04-09,横浜,ドリンク,ブレンド,22,380
2026-04-10,渋谷,フード,キッシュ,4,780
2026-04-12,新宿,ドリンク,ブレンド,25,380
2026-04-13,横浜,スイーツ,チーズケーキ,8,520
2026-04-14,渋谷,ドリンク,カフェラテ,16,480
2026-04-15,新宿,フード,サンドイッチ,9,620
2026-04-16,横浜,ドリンク,カフェラテ,13,480
2026-04-17,渋谷,スイーツ,ガトーショコラ,6,560
2026-04-19,新宿,ドリンク,カフェラテ,21,480
2026-04-20,横浜,フード,キッシュ,2,780
2026-04-21,渋谷,ドリンク,ブレンド,17,380
2026-04-22,新宿,スイーツ,チーズケーキ,10,520
2026-04-23,横浜,ドリンク,ブレンド,19,380
2026-04-24,渋谷,フード,サンドイッチ,7,620
2026-04-26,新宿,ドリンク,ブレンド,23,380
2026-04-27,横浜,スイーツ,ガトーショコラ,5,560
2026-04-28,渋谷,ドリンク,カフェラテ,15,480
2026-04-29,新宿,フード,キッシュ,6,780
2026-04-30,横浜,ドリンク,カフェラテ,11,480
`;

const content: CourseContent = {
  files: { "sales.csv": SALES_CSV },

  chapters: [
    /* ================= 第1章 ================= */
    {
      id: "ch1",
      title: "第1章　まず素の Python で集計する",
      lessons: [
        {
          id: "l1",
          title: "データの持ち方を決める",
          goal: "表形式のデータを Python でどう表すかを整理する",
          body: `
分析の第一歩は **データの形を決めること** です。表（行と列）を Python で持つ方法は主に 2 つあります。

### 1. 辞書のリスト（レコード型）

~~~
rows = [
    {"store": "渋谷", "item": "カフェラテ", "quantity": 12, "price": 480},
    {"store": "新宿", "item": "ブレンド", "quantity": 20, "price": 380},
]
~~~

1 行 = 1 つの辞書。**人間が読みやすく、行単位の処理に強い**のが利点です。JSON や API のレスポンスもだいたいこの形です。

### 2. 列ごとのリスト（列指向）

~~~
stores = ["渋谷", "新宿"]
quantities = [12, 20]
~~~

「この列の合計」「この列の平均」といった**列単位の計算に強い**形です。pandas の DataFrame は内部的にこちら側の考え方でできています。

まずは 1 の形で手を動かし、限界を感じたところで pandas に移ります。**pandas が何を楽にしてくれるのか**が体でわかると、覚え方がまったく違ってきます。
`,
          examples: [
            {
              caption: "レコード型で持って眺める",
              code: `
rows = [
    {"store": "渋谷", "item": "カフェラテ", "quantity": 12, "price": 480},
    {"store": "新宿", "item": "ブレンド", "quantity": 20, "price": 380},
    {"store": "渋谷", "item": "サンドイッチ", "quantity": 5, "price": 620},
]

for r in rows:
    amount = r["quantity"] * r["price"]
    print(f'{r["store"]:<4} {r["item"]:<10} {amount:>7,}円')

print("行数:", len(rows))
print("列名:", list(rows[0].keys()))
`,
            },
          ],
          exercise: {
            prompt: `
各行の売上（\`quantity * price\`）を計算して、**\`amount\` というキーを追加した新しいリスト** を作ってください。

- 変数名は \`with_amount\`
- 元の \`rows\` は変更しない（新しい辞書を作る）
`,
            starter: `
rows = [
    {"store": "渋谷", "item": "カフェラテ", "quantity": 12, "price": 480},
    {"store": "新宿", "item": "ブレンド", "quantity": 20, "price": 380},
    {"store": "渋谷", "item": "サンドイッチ", "quantity": 5, "price": 620},
]

with_amount =

for r in with_amount:
    print(r)
`,
            tests: `
g = globals()
wa = g.get("with_amount")

check(isinstance(wa, list) and len(wa) == 3, "with_amount が 3 件のリストになっている")
if isinstance(wa, list) and len(wa) == 3:
    check(all("amount" in r for r in wa), "すべての行に amount がある")
    check([r.get("amount") for r in wa] == [5760, 7600, 3100], "amount の値が正しい")
    check(all("amount" not in r for r in g["rows"]), "元の rows は変更していない")
`,
            hint: "内包表記で `{**r, \"amount\": r[\"quantity\"] * r[\"price\"]}` と書くと、元の辞書をコピーしつつキーを足せます。",
            solution: `with_amount = [
    {**r, "amount": r["quantity"] * r["price"]}
    for r in rows
]

for r in with_amount:
    print(r)`,
          },
        },

        {
          id: "l2",
          title: "グループごとに集計する",
          goal: "「◯◯別の合計」を素の Python で書けるようにする",
          body: `
分析でいちばん多い操作が **グループ別の集計** です。「店舗別の売上」「カテゴリ別の平均」など。

素の Python なら、**空の辞書に足し込んでいく**のが基本形です。

~~~
totals = {}
for r in rows:
    key = r["store"]
    totals[key] = totals.get(key, 0) + r["amount"]
~~~

\`collections.defaultdict\` を使うと \`.get(key, 0)\` を省けます。

~~~
from collections import defaultdict

totals = defaultdict(int)
for r in rows:
    totals[r["store"]] += r["amount"]
~~~

平均が欲しいときは、合計と件数の両方を持つのがコツです。

> この「キーごとに足し込む」処理こそ、pandas の \`groupby\` が 1 行で置き換えてくれるものです。
`,
          examples: [
            {
              caption: "店舗別・カテゴリ別に集計する",
              code: `
from collections import defaultdict
import statistics

rows = [
    {"store": "渋谷", "category": "ドリンク", "amount": 5760},
    {"store": "新宿", "category": "ドリンク", "amount": 7600},
    {"store": "渋谷", "category": "フード", "amount": 3100},
    {"store": "横浜", "category": "ドリンク", "amount": 4320},
    {"store": "新宿", "category": "スイーツ", "amount": 6160},
]

by_store = defaultdict(int)
for r in rows:
    by_store[r["store"]] += r["amount"]

for store, total in sorted(by_store.items(), key=lambda x: x[1], reverse=True):
    print(f"{store}: {total:,}円")

print("---")
amounts = [r["amount"] for r in rows]
print("合計:", f"{sum(amounts):,}円")
print("平均:", f"{statistics.mean(amounts):,.0f}円")
print("中央値:", f"{statistics.median(amounts):,.0f}円")
`,
            },
          ],
          exercise: {
            prompt: `
関数 \`average_by(rows, key)\` を作ってください。

- \`rows\` の各行を \`key\` の値でグループ分けする
- グループごとの \`amount\` の**平均**（小数のまま）を辞書で返す
- 例：\`average_by(rows, "store")\` → \`{"渋谷": 4430.0, ...}\`
`,
            starter: `
rows = [
    {"store": "渋谷", "category": "ドリンク", "amount": 5760},
    {"store": "新宿", "category": "ドリンク", "amount": 7600},
    {"store": "渋谷", "category": "フード", "amount": 3100},
    {"store": "横浜", "category": "ドリンク", "amount": 4320},
    {"store": "新宿", "category": "スイーツ", "amount": 6160},
]


def average_by(rows, key):
    pass


print(average_by(rows, "store"))
print(average_by(rows, "category"))
`,
            tests: `
g = globals()
f = g.get("average_by")
data = g.get("rows")

check(callable(f), "average_by という関数を定義できている")
if callable(f):
    by_store = f(data, "store")
    check(isinstance(by_store, dict), "辞書を返している")
    check(by_store.get("渋谷") == 4430.0, "渋谷の平均が 4430.0")
    check(by_store.get("横浜") == 4320.0, "1 件しかないグループも平均になる")

    by_cat = f(data, "category")
    check(round(by_cat.get("ドリンク", 0)) == 5893, "カテゴリでもグループ分けできている")
    check(len(by_cat) == 3, "カテゴリは 3 グループ")
`,
            hint: "グループごとに `合計` と `件数` を辞書に貯めてから、最後に `合計 / 件数` を計算します。",
            solution: `from collections import defaultdict


def average_by(rows, key):
    totals = defaultdict(int)
    counts = defaultdict(int)

    for r in rows:
        totals[r[key]] += r["amount"]
        counts[r[key]] += 1

    return {k: totals[k] / counts[k] for k in totals}


print(average_by(rows, "store"))
print(average_by(rows, "category"))`,
          },
        },

        {
          id: "l3",
          title: "CSV を読む（標準ライブラリ）",
          goal: "ファイルからデータを読み込む流れを押さえる",
          body: `
このコースには練習用の \`sales.csv\` が用意してあります（ブラウザ内の仮想ファイルシステムに置かれています）。まずは標準ライブラリの \`csv\` で読んでみましょう。

~~~
import csv

with open("sales.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
~~~

- \`with open(...) as f:\` … 使い終わったら自動で閉じてくれる書き方。ファイルを開くときは必ずこれを使います
- \`csv.DictReader\` … 1 行目をヘッダーとみなして、各行を辞書にしてくれます

### 注意：CSV の値は全部「文字列」

\`quantity\` は \`12\` ではなく \`"12"\` として読まれます。計算する前に \`int()\` で変換が必要です。**この型変換の手間こそ、pandas を使う大きな理由の 1 つ**です。
`,
          examples: [
            {
              caption: "csv モジュールで読む",
              code: `
import csv

with open("sales.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

print("行数:", len(rows))
print("列名:", list(rows[0].keys()))
print()

for r in rows[:3]:
    print(r)

print()
# 文字列のままだと足し算がおかしくなる
print("そのまま足すと:", rows[0]["quantity"] + rows[1]["quantity"])
print("int にすれば:", int(rows[0]["quantity"]) + int(rows[1]["quantity"]))
`,
            },
          ],
          exercise: {
            prompt: `
\`sales.csv\` を読み込み、**全体の売上合計** を求めてください。

- 売上 = \`quantity * price\`（どちらも \`int()\` で変換が必要）
- 変数名は \`grand_total\`（整数）
`,
            starter: `
import csv

with open("sales.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

grand_total = 0

print(f"{grand_total:,}円")
`,
            tests: `
g = globals()
check(g.get("grand_total") == 169260, f"grand_total が 169,260 になっている（今は {g.get('grand_total')}）")
check(isinstance(g.get("grand_total"), int), "整数になっている")
`,
            hint: "`sum(int(r[\"quantity\"]) * int(r[\"price\"]) for r in rows)` で一気に出せます。",
            solution: `import csv

with open("sales.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

grand_total = sum(int(r["quantity"]) * int(r["price"]) for r in rows)

print(f"{grand_total:,}円")`,
          },
        },
      ],
    },

    /* ================= 第2章 ================= */
    {
      id: "ch2",
      title: "第2章　pandas 入門",
      lessons: [
        {
          id: "l4",
          title: "Series と DataFrame",
          goal: "pandas の 2 つの基本の器を理解する",
          packages: ["pandas"],
          body: `
pandas には基本の器が 2 つあります。

- **Series** … ラベル付きの 1 次元データ（＝ 1 列）
- **DataFrame** … Series を横に並べた 2 次元データ（＝ 表）

~~~
import pandas as pd

s = pd.Series([100, 200, 300])
df = pd.DataFrame({"item": ["A", "B"], "price": [100, 200]})
~~~

### なにが嬉しいのか

**列ごとにまとめて計算できる**ことです。for ループを書かずに済みます。

~~~
df["amount"] = df["quantity"] * df["price"]   # 全行が一度に計算される
~~~

これを **ベクトル化** と呼びます。行数が増えても速く、書く量も減ります。

> pandas の import は \`import pandas as pd\` が慣習です。世界中のコードがこの名前で書かれているので、これに合わせておきましょう。

> 初回だけライブラリの読み込みに数秒かかります。
`,
          examples: [
            {
              caption: "Series を作って触る",
              packages: ["pandas"],
              code: `
import pandas as pd

s = pd.Series([480, 380, 620, 780], index=["ラテ", "ブレンド", "サンド", "キッシュ"])
print(s)
print()

print("合計:", s.sum())
print("平均:", s.mean())
print("最大:", s.max(), "→", s.idxmax())
print()

# 列まるごとの計算（ベクトル化）
print(s * 1.1)
`,
            },
            {
              caption: "DataFrame を作る",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.DataFrame(
    {
        "item": ["カフェラテ", "ブレンド", "サンドイッチ"],
        "quantity": [12, 20, 5],
        "price": [480, 380, 620],
    }
)

print(df)
print()

# 新しい列を作る（for ループ不要）
df["amount"] = df["quantity"] * df["price"]
print(df)
print()

print("売上合計:", df["amount"].sum())
`,
            },
          ],
          exercise: {
            prompt: `
次の DataFrame に、**税込金額の列 \`total\`** を追加してください。

- \`total\` = \`quantity * price\` の 1.1 倍を、**整数に丸めた**もの（\`.round().astype(int)\`）
`,
            packages: ["pandas"],
            starter: `
import pandas as pd

df = pd.DataFrame(
    {
        "item": ["カフェラテ", "ブレンド", "サンドイッチ"],
        "quantity": [12, 20, 5],
        "price": [480, 380, 620],
    }
)

df["total"] =

print(df)
`,
            tests: `
g = globals()
df = g.get("df")

check(df is not None and "total" in df.columns, "total 列を追加できている")
if df is not None and "total" in df.columns:
    values = list(df["total"])
    check(values == [6336, 8360, 3410], f"total の値が正しい（今は {values}）")
    check(str(df["total"].dtype).startswith("int"), "total が整数型になっている")
`,
            hint: "`(df[\"quantity\"] * df[\"price\"] * 1.1).round().astype(int)` を代入します。",
            solution: `df["total"] = (df["quantity"] * df["price"] * 1.1).round().astype(int)

print(df)`,
          },
        },

        {
          id: "l5",
          title: "CSV を読み込んで全体をつかむ",
          goal: "read_csv と、最初にやるべき確認の型を覚える",
          packages: ["pandas"],
          body: `
pandas なら CSV の読み込みは 1 行です。しかも**数値の列は自動で数値型として読まれます**。

~~~
df = pd.read_csv("sales.csv")
~~~

### 読んだら最初にやること

分析を始める前に、必ずこの 4 つでデータの様子を見ます。

| メソッド | 分かること |
|---|---|
| \`df.head()\` | 先頭数行の中身 |
| \`df.shape\` | （行数, 列数） |
| \`df.info()\` | 列名・型・欠損の有無 |
| \`df.describe()\` | 数値列の統計量（件数・平均・最大…） |

ここを飛ばすと、型が文字列のままだったり欠損値が混ざっていたりして、あとで必ず詰まります。**最初に 30 秒かけて眺める**のが結局いちばん速い道です。

### 日付を日付として読む

\`parse_dates=["date"]\` を付けると、日付の列を \`datetime\` として読んでくれます。月ごとの集計などがぐっと楽になります。
`,
          examples: [
            {
              caption: "読み込んで全体を眺める",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])

print("形:", df.shape)
print()
print(df.head())
print()
df.info()
`,
            },
            {
              caption: "統計量とユニーク値",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])

print(df.describe())
print()

print("店舗:", df["store"].unique())
print("カテゴリ:", df["category"].unique())
print()
print(df["category"].value_counts())
`,
            },
          ],
          exercise: {
            prompt: `
\`sales.csv\` を読み込み、次の 2 つを用意してください。

- \`df\` … \`amount\` 列（= \`quantity * price\`）を追加した DataFrame
- \`grand_total\` … \`amount\` の合計（int）
`,
            packages: ["pandas"],
            starter: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])

# amount 列を追加する


grand_total = 0

print(df.head())
print("合計:", f"{grand_total:,}円")
`,
            tests: `
g = globals()
df = g.get("df")

check(df is not None and "amount" in df.columns, "amount 列を追加できている")
if df is not None and "amount" in df.columns:
    check(int(df["amount"].sum()) == 169260, "amount の合計が 169,260 になっている")
    check(int(df.loc[0, "amount"]) == 5760, "1 行目の amount が 5760")
check(int(g.get("grand_total", 0)) == 169260, "grand_total が 169,260 になっている")
`,
            hint: "`df[\"amount\"] = df[\"quantity\"] * df[\"price\"]` のあと、`grand_total = int(df[\"amount\"].sum())`。",
            solution: `import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])

df["amount"] = df["quantity"] * df["price"]
grand_total = int(df["amount"].sum())

print(df.head())
print("合計:", f"{grand_total:,}円")`,
          },
        },

        {
          id: "l6",
          title: "列を選ぶ・行を絞る",
          goal: "見たいところだけ取り出す書き方を身につける",
          packages: ["pandas"],
          body: `
### 列を選ぶ

~~~
df["store"]              # 1 列 → Series
df[["store", "amount"]]  # 複数列 → DataFrame（角かっこが 2 重）
~~~

### 行を絞る（ブールインデックス）

条件式を角かっこに入れます。

~~~
df[df["amount"] >= 5000]
~~~

これは「各行について条件を判定した True/False の Series」を作り、True の行だけ残す、という仕組みです。

### 条件を組み合わせる

**\`and\` / \`or\` ではなく \`&\` / \`|\` を使い、各条件をかっこで囲みます。** ここは pandas 特有の落とし穴です。

~~~
df[(df["store"] == "渋谷") & (df["amount"] >= 5000)]
~~~

### 便利な絞り込み

- \`df[df["store"].isin(["渋谷", "新宿"])]\` … 複数候補
- \`df[df["item"].str.contains("ラテ")]\` … 部分一致
- \`df.query("amount >= 5000 and store == '渋谷'")\` … 文字列で書く書き方
`,
          examples: [
            {
              caption: "選ぶ・絞る",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

print(df[["store", "item", "amount"]].head())
print()

big = df[df["amount"] >= 8000]
print("8000円以上の行:", len(big))
print(big[["date", "store", "item", "amount"]])
`,
            },
            {
              caption: "条件を組み合わせる",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

shibuya_drink = df[(df["store"] == "渋谷") & (df["category"] == "ドリンク")]
print("渋谷のドリンク:", len(shibuya_drink), "件")
print("売上:", f'{shibuya_drink["amount"].sum():,}円')
print()

# query で書くとこうなる（読みやすいことも多い）
print(df.query("store == '新宿' and amount > 7000")[["date", "item", "amount"]])
`,
            },
          ],
          exercise: {
            prompt: `
\`sales.csv\` から、**新宿店のドリンク** の行だけを取り出してください。

- 変数 \`shinjuku_drink\` … 絞り込んだ DataFrame
- 変数 \`shinjuku_drink_total\` … その \`amount\` 合計（int）
`,
            packages: ["pandas"],
            starter: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

shinjuku_drink =
shinjuku_drink_total = 0

print(shinjuku_drink[["date", "item", "amount"]])
print("合計:", f"{shinjuku_drink_total:,}円")
`,
            tests: `
g = globals()
sd = g.get("shinjuku_drink")

check(sd is not None and len(sd) == 5, f"5 行に絞り込めている（今は {0 if sd is None else len(sd)} 行）")
if sd is not None and len(sd) == 5:
    check(set(sd["store"]) == {"新宿"}, "新宿店だけになっている")
    check(set(sd["category"]) == {"ドリンク"}, "ドリンクだけになっている")
check(int(g.get("shinjuku_drink_total", 0)) == 44560, "合計が 44,560 になっている")
`,
            hint: "`df[(df[\"store\"] == \"新宿\") & (df[\"category\"] == \"ドリンク\")]`。かっこと `&` を忘れずに。",
            solution: `shinjuku_drink = df[(df["store"] == "新宿") & (df["category"] == "ドリンク")]
shinjuku_drink_total = int(shinjuku_drink["amount"].sum())

print(shinjuku_drink[["date", "item", "amount"]])
print("合計:", f"{shinjuku_drink_total:,}円")`,
          },
        },
      ],
    },

    /* ================= 第3章 ================= */
    {
      id: "ch3",
      title: "第3章　集計してグラフにする",
      lessons: [
        {
          id: "l7",
          title: "groupby で集計する",
          goal: "第1章で手書きした集計を 1 行に置き換える",
          packages: ["pandas"],
          body: `
第1章では、辞書に足し込んでグループ集計を書きました。pandas ならこうです。

~~~
df.groupby("store")["amount"].sum()
~~~

読み方は「**store でグループ分けし、amount 列の合計を出す**」。ほぼ日本語の順番どおりです。

### よく使う集計関数

\`sum()\` \`mean()\` \`count()\` \`max()\` \`min()\` \`median()\` \`nunique()\`

### 複数の集計を一度に

\`agg\` を使います。

~~~
df.groupby("store")["amount"].agg(["sum", "mean", "count"])
~~~

### 2 つのキーでグループ分け

キーをリストで渡します。

~~~
df.groupby(["store", "category"])["amount"].sum()
~~~

### クロス集計

行と列にキーを割り当てた表が欲しいときは \`pivot_table\` が便利です。

~~~
df.pivot_table(index="store", columns="category", values="amount", aggfunc="sum")
~~~
`,
          examples: [
            {
              caption: "groupby いろいろ",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

print("店舗別の売上")
print(df.groupby("store")["amount"].sum())
print()

print("カテゴリ別の複数集計")
print(df.groupby("category")["amount"].agg(["sum", "mean", "count"]).round(0))
`,
            },
            {
              caption: "2 軸で集計してクロス表にする",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

print(df.groupby(["store", "category"])["amount"].sum())
print()

pivot = df.pivot_table(
    index="store", columns="category", values="amount", aggfunc="sum", fill_value=0
)
print(pivot)
`,
            },
          ],
          exercise: {
            prompt: `
商品（\`item\`）ごとの売上合計を求め、**多い順に並べた Series** を作ってください。

- 変数名は \`item_sales\`
- 降順（大きいほうが先）に並べること
`,
            packages: ["pandas"],
            starter: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

item_sales =

print(item_sales)
`,
            tests: `
g = globals()
s = g.get("item_sales")

check(s is not None and len(s) == 6, "6 商品ぶんの集計になっている")
if s is not None and len(s) == 6:
    check(s.index[0] == "カフェラテ", f"1 位が カフェラテ になっている（今は {s.index[0]}）")
    check(int(s.iloc[0]) == 61920, "1 位の売上が 61,920")
    check(list(s) == sorted(list(s), reverse=True), "降順に並んでいる")
`,
            hint: "`df.groupby(\"item\")[\"amount\"].sum().sort_values(ascending=False)`。",
            solution: `item_sales = (
    df.groupby("item")["amount"].sum().sort_values(ascending=False)
)

print(item_sales)`,
          },
        },

        {
          id: "l8",
          title: "並べ替えと上位抽出",
          goal: "「上位◯件」「割合」を出せるようにする",
          packages: ["pandas"],
          body: `
### 並べ替え

~~~
df.sort_values("amount", ascending=False)      # 降順
df.sort_values(["store", "amount"])            # 複数キー
~~~

### 上位 n 件

\`head(n)\` でも取れますが、\`nlargest\` のほうが意図が明確です。

~~~
df.nlargest(5, "amount")
~~~

### 割合を出す

構成比は分析の基本です。合計で割るだけ。

~~~
share = sales / sales.sum() * 100
~~~

### 日付でまとめる

\`parse_dates\` で読んだ列は \`.dt\` アクセサが使えます。

- \`df["date"].dt.month\` … 月
- \`df["date"].dt.day_name()\` … 曜日名
- \`df.groupby(df["date"].dt.to_period("W"))\` … 週ごと
`,
          examples: [
            {
              caption: "上位を出す・構成比を出す",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

print("売上上位 5 件")
print(df.nlargest(5, "amount")[["date", "store", "item", "amount"]])
print()

by_cat = df.groupby("category")["amount"].sum().sort_values(ascending=False)
share = (by_cat / by_cat.sum() * 100).round(1)

summary = pd.DataFrame({"売上": by_cat, "構成比(%)": share})
print(summary)
`,
            },
            {
              caption: "日付を使ってまとめる",
              packages: ["pandas"],
              code: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

df["week"] = df["date"].dt.isocalendar().week
print(df.groupby("week")["amount"].sum())
print()

df["weekday"] = df["date"].dt.day_name()
print(df.groupby("weekday")["amount"].sum().sort_values(ascending=False))
`,
            },
          ],
          exercise: {
            prompt: `
店舗別の売上と、その**構成比（％、小数第 1 位）** を並べた DataFrame を作ってください。

- 変数名は \`store_summary\`
- 列名は \`"売上"\` と \`"構成比"\`
- 売上の多い順に並べる
`,
            packages: ["pandas"],
            starter: `
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

store_summary =

print(store_summary)
`,
            tests: `
g = globals()
s = g.get("store_summary")

check(s is not None and len(s) == 3, "3 店舗ぶんの表になっている")
if s is not None and len(s) == 3:
    check(list(s.columns) == ["売上", "構成比"], f'列名が ["売上", "構成比"]（今は {list(s.columns)}）')
    check(s.index[0] == "新宿", f"1 位が 新宿（今は {s.index[0]}）")
    check(int(s["売上"].sum()) == 169260, "売上の合計が全体と一致する")
    check(abs(float(s["構成比"].sum()) - 100.0) < 0.2, "構成比の合計がほぼ 100 になる")
`,
            hint: "まず `by_store = df.groupby(\"store\")[\"amount\"].sum().sort_values(ascending=False)`。次に `pd.DataFrame({\"売上\": by_store, \"構成比\": (by_store / by_store.sum() * 100).round(1)})`。",
            solution: `by_store = df.groupby("store")["amount"].sum().sort_values(ascending=False)

store_summary = pd.DataFrame(
    {
        "売上": by_store,
        "構成比": (by_store / by_store.sum() * 100).round(1),
    }
)

print(store_summary)`,
          },
        },

        {
          id: "l9",
          title: "matplotlib でグラフにする",
          goal: "集計結果を図にして、傾向を目で確かめる",
          packages: ["pandas", "matplotlib"],
          body: `
数字の表だけでは傾向が見えにくいときがあります。グラフにしましょう。

~~~
import matplotlib.pyplot as plt

plt.bar(labels, values)
show()
~~~

> \`show()\` はこの学習アプリ用に用意したヘルパーです。図を PNG にして画面へ出します。
> 手元の Python では代わりに \`plt.show()\`（画面表示）や \`plt.savefig("out.png")\`（保存）を使います。

### よく使うグラフ

| 関数 | 用途 |
|---|---|
| \`plt.bar\` | 項目ごとの比較（棒） |
| \`plt.barh\` | 項目が多いとき（横棒） |
| \`plt.plot\` | 時間による変化（折れ線） |
| \`plt.pie\` | 構成比（円） |
| \`plt.scatter\` | 2 つの量の関係（散布） |

### 見せ方の基本

- \`plt.title\` \`plt.xlabel\` \`plt.ylabel\` で「何のグラフか」を必ず書く
- \`plt.figure(figsize=(幅, 高さ))\` で大きさを調整する
- \`plt.grid(axis="y", alpha=.3)\` で薄い目盛り線を入れると読みやすい

> 日本語のラベルは、フォントの都合で豆腐（□）になることがあります。ここでは英数字のラベルを使っています。
`,
          examples: [
            {
              caption: "店舗別の棒グラフ",
              packages: ["pandas", "matplotlib"],
              code: `
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

by_store = df.groupby("store")["amount"].sum().sort_values(ascending=False)

# 日本語フォントがないので英字ラベルにしておく
labels = {"渋谷": "Shibuya", "新宿": "Shinjuku", "横浜": "Yokohama"}
names = [labels[s] for s in by_store.index]

plt.figure(figsize=(6, 3.5))
plt.bar(names, by_store.values, color="#22b8a6")
plt.title("Sales by store")
plt.ylabel("amount (JPY)")
plt.grid(axis="y", alpha=0.3)
show()
`,
            },
            {
              caption: "日ごとの推移（折れ線）",
              packages: ["pandas", "matplotlib"],
              code: `
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

daily = df.groupby("date")["amount"].sum()

plt.figure(figsize=(7, 3.5))
plt.plot(daily.index, daily.values, marker="o", color="#4f8cff")
plt.title("Daily sales")
plt.ylabel("amount (JPY)")
plt.xticks(rotation=45)
plt.grid(alpha=0.3)
show()
`,
            },
          ],
          exercise: {
            prompt: `
**カテゴリ別売上の円グラフ** を描いてください。

- \`category\` ごとの \`amount\` 合計を \`category_sales\` に入れる
- \`plt.pie(...)\` で円グラフにし、最後に \`show()\` を呼ぶ
- ラベルは英字に変換した \`names\` を使う（用意してあります）
`,
            packages: ["pandas", "matplotlib"],
            starter: `
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]

category_sales =

labels = {"ドリンク": "Drink", "フード": "Food", "スイーツ": "Sweets"}
names = [labels[c] for c in category_sales.index]

plt.figure(figsize=(4.5, 4.5))
plt.pie(category_sales.values, labels=names, autopct="%1.1f%%")
plt.title("Sales share by category")
show()
`,
            tests: `
g = globals()
cs = g.get("category_sales")

check(cs is not None and len(cs) == 3, "category_sales が 3 カテゴリぶんになっている")
if cs is not None and len(cs) == 3:
    check(int(cs.sum()) == 169260, "合計が全体の売上と一致する")
    check(int(cs.get("ドリンク", 0)) == 115500, "ドリンクの売上が 115,500")
check(_shown(), "show() でグラフを表示できている")
`,
            hint: "`category_sales = df.groupby(\"category\")[\"amount\"].sum()` を入れるだけで、あとは用意されたコードが動きます。",
            solution: `category_sales = df.groupby("category")["amount"].sum()

labels = {"ドリンク": "Drink", "フード": "Food", "スイーツ": "Sweets"}
names = [labels[c] for c in category_sales.index]

plt.figure(figsize=(4.5, 4.5))
plt.pie(category_sales.values, labels=names, autopct="%1.1f%%")
plt.title("Sales share by category")
show()`,
          },
        },
      ],
    },

    /* ================= 第4章 ================= */
    {
      id: "ch4",
      title: "第4章　卒業制作",
      lessons: [
        {
          id: "l10",
          title: "売上レポートを作る",
          goal: "読み込み → 集計 → 出力までを一本のプログラムにまとめる",
          packages: ["pandas", "matplotlib"],
          body: `
実務で書く分析スクリプトは、だいたい次の 4 段構えです。

1. **読み込む** — \`read_csv\`、型と欠損の確認
2. **整える** — 計算列を足す、いらない行を落とす
3. **集計する** — \`groupby\`、\`pivot_table\`、構成比
4. **出力する** — 表を print、グラフを保存

この形をひとつ自分の手で書いておくと、次からは中身を差し替えるだけで済みます。

### 関数に分ける意味

「読み込み」「集計」「表示」を関数に分けておくと、あとでデータが変わっても壊れにくくなります。とくに **集計関数は DataFrame を受け取って DataFrame を返す** 形にしておくと、テストも書きやすく再利用しやすい形になります。
`,
          examples: [
            {
              caption: "完成イメージを先に見る",
              packages: ["pandas", "matplotlib"],
              code: `
import pandas as pd
import matplotlib.pyplot as plt


def load(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["date"])
    df["amount"] = df["quantity"] * df["price"]
    return df


def summarize(df: pd.DataFrame, key: str) -> pd.DataFrame:
    grouped = df.groupby(key)["amount"].agg(["sum", "count"])
    grouped.columns = ["売上", "件数"]
    grouped["構成比"] = (grouped["売上"] / grouped["売上"].sum() * 100).round(1)
    return grouped.sort_values("売上", ascending=False)


df = load("sales.csv")

print("=== 全体 ===")
print(f'期間: {df["date"].min().date()} 〜 {df["date"].max().date()}')
print(f'売上: {df["amount"].sum():,}円 / {len(df)}件')
print()
print("=== 店舗別 ===")
print(summarize(df, "store"))
`,
            },
          ],
          exercise: {
            prompt: `
仕上げです。次の 2 つを作ってください。

1. 関数 \`build_report(df)\`
   - \`df\` を受け取り、**店舗 × カテゴリ** のクロス集計 DataFrame を返す
   - 行が店舗、列がカテゴリ、値が \`amount\` の合計
   - 該当なしのセルは \`0\`
2. 変数 \`report\` に \`build_report(df)\` の結果を入れる
3. \`report\` を棒グラフ（積み上げ）にして \`show()\` する

> グラフ部分は用意してあります。\`build_report\` を書けば動きます。
`,
            packages: ["pandas", "matplotlib"],
            starter: `
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["amount"] = df["quantity"] * df["price"]


def build_report(df):
    pass


report = build_report(df)
print(report)

# --- グラフ（ここは書き換えなくて構いません） ---
en = {"渋谷": "Shibuya", "新宿": "Shinjuku", "横浜": "Yokohama",
      "ドリンク": "Drink", "フード": "Food", "スイーツ": "Sweets"}
chart = report.rename(index=en, columns=en)

chart.plot(kind="bar", stacked=True, figsize=(7, 4), colormap="viridis")
plt.title("Sales by store and category")
plt.ylabel("amount (JPY)")
plt.xticks(rotation=0)
plt.grid(axis="y", alpha=0.3)
show()
`,
            tests: `
g = globals()
f = g.get("build_report")
r = g.get("report")

check(callable(f), "build_report という関数を定義できている")
check(r is not None, "report に結果を入れられている")

if r is not None:
    check(r.shape == (3, 3), f"3 店舗 × 3 カテゴリの表になっている（今は {r.shape}）")
    check(set(r.index) == {"渋谷", "新宿", "横浜"}, "行が店舗になっている")
    check(set(r.columns) == {"ドリンク", "フード", "スイーツ"}, "列がカテゴリになっている")
    check(int(r.values.sum()) == 169260, "全体の合計が売上総額と一致する")
    check(int(r.loc["渋谷", "ドリンク"]) == 39520, "渋谷 × ドリンクの値が 39,520")
    check(not r.isna().any().any(), "空のセルが 0 で埋まっている")

check(_shown(), "show() でグラフを表示できている")
`,
            hint: "`df.pivot_table(index=\"store\", columns=\"category\", values=\"amount\", aggfunc=\"sum\", fill_value=0)` を返します。",
            solution: `def build_report(df):
    return df.pivot_table(
        index="store",
        columns="category",
        values="amount",
        aggfunc="sum",
        fill_value=0,
    )


report = build_report(df)
print(report)`,
          },
        },
      ],
    },
  ],
};

export default content;
