/* ============================================================
   コース：Python の基本文法
   一覧に出す情報（タイトルやアイコン）は src/courses/registry.ts 側にある。
   ============================================================ */

import type { CourseContent } from "../types";

const content: CourseContent = {
  chapters: [
    /* ================= 第1章 ================= */
    {
      id: "ch1",
      title: "第1章　まずは動かす",
      lessons: [
        {
          id: "l1",
          title: "print と変数",
          goal: "値を画面に出す・名前をつけて取っておく、の 2 つを押さえる",
          body: `
Python のプログラムは、上から順に 1 行ずつ実行されます。まずは 2 つだけ。

- \`print(...)\` … かっこの中身を画面に出す
- \`名前 = 値\` … 値に名前をつけて取っておく（**変数**）

\`=\` は「等しい」ではなく「右の値を左の名前に入れる」という意味です。数学の等号とは違うので、ここは意識して読み替えてください。

### 変数名のルール

- 英小文字と \`_\` で書く（\`user_name\` のようなスネークケース）
- 数字から始められない
- \`if\` や \`for\` などの予約語は使えない

### コメント

\`#\` から行末まではコメントで、実行されません。あとで読み返す自分のためのメモです。
`,
          examples: [
            {
              caption: "そのまま実行してみる",
              code: `
# あいさつを画面に出す
print("こんにちは、Python")

# 変数に入れてから出す
name = "山田"
age = 30

print(name)
print(age)

# print はカンマで区切ると複数まとめて出せる
print(name, "さんは", age, "歳です")
`,
            },
            {
              note: "変数は **上書き** できます。最後に代入した値が残ることを確かめましょう。",
              caption: "上書きされるところを見る",
              code: `
count = 1
print(count)

count = count + 1   # 今の count に 1 を足して、また count に入れ直す
print(count)

count += 10         # += は「今の値に足す」の短い書き方
print(count)
`,
            },
          ],
          exercise: {
            prompt: `
自己紹介を出力するコードを書いてください。

1. 変数 \`name\` に自分の名前（文字列）を入れる
2. 変数 \`year\` に Python を始めた年（整数）を入れる
3. \`print\` で 2 つとも画面に出す
`,
            starter: `
name =
year =

print(name)
print(year)
`,
            tests: `
g = globals()
check("name" in g, "name という変数を作れている")
check(isinstance(g.get("name"), str), "name は文字列（引用符で囲む）になっている")
check(isinstance(g.get("year"), int), "year は整数（引用符なしの数字）になっている")

out = _stdout()
check(str(g.get("name")) in out, "name の中身が画面に出ている")
check(str(g.get("year")) in out, "year の中身が画面に出ている")
`,
            hint: "文字列は `\"山田\"` のように引用符で囲みます。整数は `2020` のように囲みません。",
            solution: `name = "山田"
year = 2020

print(name)
print(year)`,
          },
        },

        {
          id: "l2",
          title: "数と文字列",
          goal: "int / float / str の違いと、それぞれでできる計算を整理する",
          body: `
Python の値には**型**があります。まずはこの 3 つ。

| 型 | 意味 | 例 |
|---|---|---|
| \`int\` | 整数 | \`3\`, \`-10\`, \`0\` |
| \`float\` | 小数 | \`3.14\`, \`-0.5\` |
| \`str\` | 文字列 | \`"あ"\`, \`'hello'\` |

型は \`type(値)\` で確認できます。

### 数の計算

\`+ - * /\` に加えて、Python ならではの 3 つを覚えておくと便利です。

- \`//\` … 切り捨て除算（\`7 // 2\` は \`3\`）
- \`%\` … 余り（\`7 % 2\` は \`1\`）
- \`**\` … べき乗（\`2 ** 10\` は \`1024\`）

**\`/\` は必ず float になります。** \`6 / 2\` は \`3\` ではなく \`3.0\` です。ここはよく引っかかるところ。

### 文字列の計算

文字列同士は \`+\` でつなげられ、\`*\` で繰り返せます。ただし **文字列と数値は \`+\` できません**（\`TypeError\` になります）。

### もっと詳しく

- [文字列のメソッド一覧（公式）](https://docs.python.org/ja/3/library/stdtypes.html#string-methods)
- [数値型（int / float）（公式）](https://docs.python.org/ja/3/library/stdtypes.html#numeric-types-int-float-complex)
`,
          examples: [
            {
              caption: "型と計算を確かめる",
              code: `
print(type(3), type(3.14), type("3"))

print(7 / 2)    # 3.5  ← 必ず float
print(7 // 2)   # 3    ← 切り捨て
print(7 % 2)    # 1    ← 余り
print(2 ** 10)  # 1024

print("Py" + "thon")
print("-" * 20)
`,
            },
            {
              note: "文字列にはたくさんのメソッド（その値専用の関数）があります。よく使うものを見てみましょう。",
              caption: "文字列メソッド",
              code: `
s = "  Hello, Python World  "

print(s.strip())            # 前後の空白を取る
print(s.strip().lower())    # 小文字に
print(s.strip().upper())    # 大文字に
print(s.replace("World", "みんな"))
print(len(s.strip()))       # 文字数
print("Python" in s)        # 含まれているか → True / False
`,
            },
          ],
          exercise: {
            prompt: `
155 分が「何時間何分か」を求めましょう。

1. \`hours\` に時間（切り捨て）を入れる
2. \`rest\` に残りの分を入れる
3. \`print(hours, rest)\` で確認する

> 割り算の記号を選び分けるのがポイントです。
`,
            starter: `
minutes = 155
hours =
rest =

print(hours, rest)
`,
            tests: `
g = globals()
check(g.get("hours") == 2, "hours が 2 になっている（// を使う）")
check(g.get("rest") == 35, "rest が 35 になっている（% を使う）")
check(isinstance(g.get("hours"), int), "hours が整数（/ ではなく // を使う）")
`,
            hint: "`//` は割った答えの整数部分、`%` は余りです。",
            solution: `minutes = 155
hours = minutes // 60
rest = minutes % 60

print(hours, rest)`,
          },
        },

        {
          id: "l3",
          title: "f 文字列と型変換",
          goal: "文字列に値を埋め込む今どきの書き方を身につける",
          body: `
文字列に変数の値を混ぜたいとき、\`+\` でつなぐのは面倒でエラーの元です。現在の Python では **f 文字列**（f-string）を使います。

引用符の前に \`f\` を付け、埋め込みたい式を \`{}\` で囲むだけ。

~~~
name = "Python"
print(f"こんにちは、{name}さん")
~~~

\`{}\` の中には式も書けます（\`{price * 1.1}\` など）。

### 表示の書式

\`{値:書式}\` で見た目を整えられます。よく使うのは 3 つ。

- \`{x:.2f}\` … 小数第 2 位まで
- \`{x:,}\` … 3 桁ごとにカンマ
- \`{x:>8}\` … 右寄せで幅 8

### 型変換

型が合わないときは自分で変換します。

- \`int("42")\` → \`42\`
- \`float("3.5")\` → \`3.5\`
- \`str(42)\` → \`"42"\`

数字に見えない文字列を \`int()\` に渡すと \`ValueError\` になります。
`,
          examples: [
            {
              caption: "f 文字列いろいろ",
              code: `
name = "山田"
price = 1280
rate = 0.1

print(f"{name}さん、こんにちは")
print(f"税込 {price * (1 + rate)} 円")
print(f"税込 {price * (1 + rate):.0f} 円")     # 小数点なし
print(f"合計 {1234567:,} 円")                  # カンマ区切り

# デバッグに便利な書き方（= を付けると 名前=値 で出る）
print(f"{price=}")
`,
            },
            {
              caption: "型変換とその失敗",
              // 最後の 1 行はわざとエラーにする例（検証はエラーになることを確かめる）
              raises: true,
              code: `
text = "42"
print(int(text) + 1)      # 43
print(text + "1")         # "421" ← 文字列の連結

print(str(42) + "歳")

# ここはエラーになります。メッセージを読んでみましょう
print(int("42歳"))
`,
            },
          ],
          exercise: {
            prompt: `
レシート 1 行分の文字列を作りましょう。

変数 \`line\` に、次のとおりの文字列を **f 文字列で** 入れてください。

- 商品名 \`item\`、個数 \`qty\`、単価 \`unit\` を使う
- 形式は \`りんご x3 = 450円\`（合計は \`qty * unit\`）
`,
            starter: `
item = "りんご"
qty = 3
unit = 150

line =

print(line)
`,
            tests: `
g = globals()
check("line" in g, "line という変数を作れている")
check(g.get("line") == "りんご x3 = 450円", "line が 'りんご x3 = 450円' になっている")
`,
            hint: '`f\"{item} x{qty} = {qty * unit}円\"` の形です。空白の位置に注意。',
            solution: `item = "りんご"
qty = 3
unit = 150

line = f"{item} x{qty} = {qty * unit}円"

print(line)`,
          },
        },

        {
          id: "l4",
          title: "条件分岐 if",
          goal: "条件で処理を分ける。インデントがブロックを作ることを再確認する",
          body: `
「もし〜なら」を書くのが \`if\` です。

~~~
if 条件:
    条件が真のときの処理
elif 別の条件:
    こちらが真のときの処理
else:
    どれも偽のときの処理
~~~

**Python はインデント（字下げ）でブロックを表します。** 波かっこはありません。字下げは半角スペース 4 つが標準です。行末の \`:\` を忘れるとエラーになります。

### 比較と論理

| 記号 | 意味 |
|---|---|
| \`==\` \`!=\` | 等しい／等しくない |
| \`<\` \`<=\` \`>\` \`>=\` | 大小 |
| \`and\` \`or\` \`not\` | かつ／または／否定 |

Python では \`0 < x < 10\` のように**つなげて書けます**。これは他の言語にはあまりない書き方です。

### 「偽」とみなされる値

\`0\`、空文字列 \`""\`、空リスト \`[]\`、\`None\` は条件式では偽になります。だから \`if items:\` と書けば「items が空でなければ」の意味になります。
`,
          examples: [
            {
              caption: "点数で判定する",
              code: `
score = 78

if score >= 90:
    grade = "A"
elif score >= 70:
    grade = "B"
elif score >= 50:
    grade = "C"
else:
    grade = "D"

print(f"{score}点 → {grade}")

# つなげた比較
if 0 <= score <= 100:
    print("点数の範囲は正常です")
`,
            },
            {
              caption: "空かどうかで分ける",
              code: `
items = []

if items:
    print("買うものがあります")
else:
    print("買い物リストは空です")

# 三項演算子（1 行で書きたいとき）
n = 7
label = "偶数" if n % 2 == 0 else "奇数"
print(label)
`,
            },
          ],
          exercise: {
            prompt: `
おなじみ FizzBuzz を、関数 \`fizzbuzz(n)\` として書いてください。

- 3 でも 5 でも割り切れる → \`"FizzBuzz"\` を返す
- 3 で割り切れる → \`"Fizz"\` を返す
- 5 で割り切れる → \`"Buzz"\` を返す
- どれでもない → \`str(n)\` を返す

> 判定の**順番**が肝心です。
`,
            starter: `
def fizzbuzz(n):
    pass


for i in range(1, 16):
    print(fizzbuzz(i))
`,
            tests: `
g = globals()
f = g.get("fizzbuzz")

check(callable(f), "fizzbuzz という関数を定義できている")
if callable(f):
    check(f(15) == "FizzBuzz", "fizzbuzz(15) が 'FizzBuzz'")
    check(f(9) == "Fizz", "fizzbuzz(9) が 'Fizz'")
    check(f(20) == "Buzz", "fizzbuzz(20) が 'Buzz'")
    check(f(7) == "7", "fizzbuzz(7) が文字列の '7'")
    check(f(30) == "FizzBuzz", "30 のように両方で割り切れる数も 'FizzBuzz'")
`,
            hint: [
              "15 のような数は「3 の倍数」でもあり「5 の倍数」でもあります。`if` / `elif` は上から順に見て、最初に当てはまったところで決まります。4 つの場合分けをどの順に並べれば、15 が Fizz で止まらずに済むでしょうか。",
              "「割り切れる」は「割った余りが 0 かどうか」で言い換えられます。余りを求める演算子は第1章に出てきました。",
              "`fizzbuzz(7)` は数値の `7` ではなく文字列の `\"7\"` を求められています。4 つの分岐がすべて同じ型を返しているか、そして `print` ではなく `return` で返しているかを見直してください。",
            ],
            solution: `def fizzbuzz(n: int) -> str:
    if n % 3 == 0 and n % 5 == 0:
        return "FizzBuzz"
    elif n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    else:
        return str(n)


for i in range(1, 16):
    print(fizzbuzz(i))`,
          },
        },
      ],
    },

    /* ================= 第2章 ================= */
    {
      id: "ch2",
      title: "第2章　まとめて扱う",
      lessons: [
        {
          id: "l5",
          title: "リスト",
          goal: "順番のある入れ物を作る・取り出す・変える",
          body: `
複数の値をまとめて持つのが **リスト**。角かっこで作ります。

~~~
fruits = ["りんご", "みかん", "ぶどう"]
~~~

### 取り出す（インデックスは 0 から）

\`fruits[0]\` が 1 番目。\`fruits[-1]\` で末尾を取れるのが Python らしいところです。

### 一部を切り出す（スライス）

\`fruits[1:3]\` は「1 番目以上 3 番目未満」。**終わりは含みません。**
\`fruits[:2]\` は先頭から、\`fruits[2:]\` は 2 番目から最後まで。

### よく使う操作

| 書き方 | 意味 |
|---|---|
| \`lst.append(x)\` | 末尾に追加 |
| \`lst.insert(i, x)\` | i 番目に挿入 |
| \`lst.remove(x)\` | 値 x を 1 つ削除 |
| \`lst.pop()\` | 末尾を取り出して削除 |
| \`len(lst)\` | 個数 |
| \`sorted(lst)\` | 並べ替えた**新しい**リスト |
| \`lst.sort()\` | 自分自身を並べ替える |
| \`x in lst\` | 含まれるか |

### もっと詳しく

- [リスト型のメソッド一覧（公式）](https://docs.python.org/ja/3/tutorial/datastructures.html)
`,
          examples: [
            {
              caption: "作る・取り出す・切り出す",
              code: `
fruits = ["りんご", "みかん", "ぶどう", "もも"]

print(fruits[0])     # 最初
print(fruits[-1])    # 最後
print(fruits[1:3])   # みかん, ぶどう
print(fruits[:2])    # 先頭 2 つ
print(len(fruits))
`,
            },
            {
              caption: "変える",
              code: `
nums = [5, 3, 9, 1]

nums.append(7)
print(nums)

nums.sort()
print(nums)

nums.sort(reverse=True)
print(nums)

last = nums.pop()
print("取り出した:", last, "／残り:", nums)

print(sum(nums), max(nums), min(nums))
`,
            },
          ],
          exercise: {
            prompt: `
テストの点数リストから、**上位 3 件** を取り出しましょう。

変数 \`top3\` に、\`scores\` を大きい順に並べ替えて先頭 3 件を入れてください。
（\`scores\` そのものは変えないほうが安全です）
`,
            starter: `
scores = [62, 91, 78, 45, 88, 70]

top3 =

print(top3)
`,
            tests: `
g = globals()
check(g.get("top3") == [91, 88, 78], "top3 が [91, 88, 78] になっている")
check(g.get("scores") == [62, 91, 78, 45, 88, 70], "元の scores は並べ替えずに残っている")
`,
            hint: "`sorted()` には並び順を逆にするオプションがあります。並べ替えた結果から、スライスで先頭 3 件を切り出しましょう。",
            solution: `scores = [62, 91, 78, 45, 88, 70]

top3 = sorted(scores, reverse=True)[:3]

print(top3)`,
          },
        },

        {
          id: "l6",
          title: "for でくり返す",
          goal: "リストの中身を 1 つずつ処理する型を身につける",
          body: `
Python の \`for\` は「回数」ではなく **「中身を 1 つずつ取り出す」** ループです。

~~~
for fruit in fruits:
    print(fruit)
~~~

回数で回したいときは \`range()\` を使います。

- \`range(5)\` → 0,1,2,3,4
- \`range(1, 6)\` → 1〜5
- \`range(0, 10, 2)\` → 0,2,4,6,8

### 番号も一緒にほしいとき

\`enumerate()\` を使います。\`i, value\` の 2 つを同時に受け取れます。

### 2 つのリストを並べて回したいとき

\`zip()\` を使います。

### 途中で抜ける・飛ばす

- \`break\` … ループを抜ける
- \`continue\` … 次の周回へ飛ぶ
`,
          examples: [
            {
              caption: "いろいろな回し方",
              code: `
fruits = ["りんご", "みかん", "ぶどう"]

for fruit in fruits:
    print(fruit)

print("---")

for i, fruit in enumerate(fruits, start=1):
    print(f"{i}. {fruit}")

print("---")

prices = [150, 80, 400]
for fruit, price in zip(fruits, prices):
    print(f"{fruit}は{price}円")
`,
            },
            {
              caption: "合計を作る／条件で飛ばす",
              code: `
nums = [3, -1, 8, 0, -5, 12]

total = 0
for n in nums:
    if n < 0:
        continue          # マイナスは無視
    total += n
print("合計:", total)

# 最初に見つかった 10 以上の値
for n in nums:
    if n >= 10:
        print("見つけた:", n)
        break
`,
            },
          ],
          exercise: {
            prompt: `
売上リストから、**5000 円以上の売上だけの合計** を求めましょう。

変数 \`big_total\` に合計金額（整数）を入れてください。for ループと if を組み合わせます。
`,
            starter: `
sales = [3200, 8100, 4500, 12000, 990, 5000]

big_total = 0

print(big_total)
`,
            tests: `
g = globals()
check(g.get("big_total") == 25100, "big_total が 25100 になっている")
check(g.get("sales") == [3200, 8100, 4500, 12000, 990, 5000], "sales は変更していない")
`,
            hint: "ループの中で条件を満たしたときだけ足し込みます。「5000 円以上」なので 5000 ちょうども含まれる点に注意（`>` と `>=` のどちらを使うか）。",
            solution: `sales = [3200, 8100, 4500, 12000, 990, 5000]

big_total = 0
for s in sales:
    if s >= 5000:
        big_total += s

print(big_total)`,
          },
        },

        {
          id: "l7",
          title: "辞書",
          goal: "「名前で引く」入れ物を扱えるようにする",
          body: `
リストが「番号で引く」入れ物なのに対し、**辞書**（dict）は「キーで引く」入れ物です。波かっこで作ります。

~~~
user = {"name": "山田", "age": 30}
print(user["name"])
~~~

JSON とほぼ同じ形なので、API のレスポンスや設定ファイルを扱うときに必ず出てきます。

### 取り出し方

- \`user["name"]\` … 無いキーだと \`KeyError\`
- \`user.get("email")\` … 無ければ \`None\`（安全）
- \`user.get("email", "未設定")\` … 無いときの既定値を指定

### 回し方

| 書き方 | 取れるもの |
|---|---|
| \`for k in d:\` | キー |
| \`for v in d.values():\` | 値 |
| \`for k, v in d.items():\` | キーと値 |

### 追加・更新・削除

\`d["key"] = 値\` で追加も更新も兼ねます。削除は \`del d["key"]\`。
`,
          examples: [
            {
              caption: "基本操作",
              code: `
user = {"name": "山田", "age": 30, "lang": "Python"}

print(user["name"])
print(user.get("email"))              # None
print(user.get("email", "未登録"))     # 既定値

user["email"] = "me@example.com"      # 追加
user["age"] = 31                      # 更新
del user["lang"]                      # 削除

for key, value in user.items():
    print(f"{key}: {value}")
`,
            },
            {
              caption: "集計に使う（登場回数を数える）",
              code: `
words = ["python", "go", "python", "rust", "go", "python"]

counter = {}
for w in words:
    counter[w] = counter.get(w, 0) + 1

print(counter)

for word, count in counter.items():
    print(f"{word}: {count}回")

# 「多い順に並べ替え」は key= を使います。第3章「短く書く記法」で扱います。
`,
            },
          ],
          exercise: {
            prompt: `
商品と価格の辞書から、**合計金額** と **一番高い商品名** を求めましょう。

- \`total\` … すべての価格の合計
- \`most_expensive\` … 価格が最も高い商品の**名前**（文字列）
`,
            starter: `
prices = {"りんご": 150, "メロン": 3800, "みかん": 80, "ぶどう": 1200}

total = 0
most_expensive = ""

print(total, most_expensive)
`,
            tests: `
g = globals()
check(g.get("total") == 5230, "total が 5230 になっている")
check(g.get("most_expensive") == "メロン", "most_expensive が 'メロン' になっている")
`,
            hint: "合計は値だけを集めれば出せます（`.values()` と組み込み関数）。最大は、「今のところ一番高い商品」を変数に覚えながらループで比べていくのが確実です。",
            solution: `prices = {"りんご": 150, "メロン": 3800, "みかん": 80, "ぶどう": 1200}

total = sum(prices.values())

most_expensive = ""
highest = 0
for name, price in prices.items():
    if price > highest:
        highest = price
        most_expensive = name

print(total, most_expensive)

# 第3章の key= を使うと、最大値の行は max(prices, key=prices.get) の 1 行になります。`,
          },
        },

        {
          id: "l8",
          title: "タプル・集合・while",
          goal: "残りの基本コンテナと、条件つきループを押さえる",
          body: `
### タプル — 変更できないリスト

丸かっこで作ります。作ったあと中身を変えられません。

~~~
point = (10, 20)
x, y = point        # 分解して受け取れる（アンパック）
~~~

「関数から複数の値を返す」「辞書のキーにする」といった場面で登場します。

### 集合（set） — 重複のない入れ物

~~~
tags = {"python", "web", "python"}   # → {"python", "web"}
~~~

**重複を消す**用途が圧倒的に多いです。\`list(set(lst))\` は定番。
\`&\`（共通）、\`|\`（合併）、\`-\`（差）も使えます。

集合は **順番を持ちません**。\`print\` したときの並びは実行するたびに変わることがあるので、順番が必要なときは \`sorted()\` を通してください。

### while — 条件が真の間くり返す

回数が決まっていないときに使います。

~~~
while 条件:
    処理
~~~

> 条件がずっと真だと無限ループになります。このアプリでは「停止」ボタンで止められるので、恐れず試してかまいません。
`,
          examples: [
            {
              caption: "タプルと集合",
              code: `
point = (10, 20)
x, y = point
print(x, y)

# 値の入れ替えもタプルで一行
a, b = 1, 2
a, b = b, a
print(a, b)

nums = [3, 1, 3, 7, 1, 9]
print(set(nums))
print(sorted(set(nums)))

front = {"html", "css", "js"}
mine = {"js", "python", "css"}
print(front & mine)   # 共通
print(mine - front)   # 自分だけ
`,
            },
            {
              caption: "while で数を減らす",
              code: `
balance = 1000
day = 0

while balance > 0:
    balance -= 300
    day += 1
    print(f"{day}日目: 残り {balance} 円")

print(f"{day}日でなくなりました")
`,
            },
          ],
          exercise: {
            prompt: `
アンケートの回答リストから、**重複を除いて並べ替えたリスト** を作ってください。

変数名は \`unique_answers\` とします。
`,
            starter: `
answers = ["Python", "Go", "Python", "Rust", "Go", "Python", "Ruby"]

unique_answers =

print(unique_answers)
`,
            tests: `
g = globals()
check(
    g.get("unique_answers") == ["Go", "Python", "Ruby", "Rust"],
    "unique_answers が ['Go', 'Python', 'Ruby', 'Rust'] になっている",
)
check(isinstance(g.get("unique_answers"), list), "リストになっている（set のままではない）")
`,
            hint: "重複を消せる入れ物が第2章にありました。それを並べ替える関数に渡すと、戻り値はリストになります。",
            solution: `answers = ["Python", "Go", "Python", "Rust", "Go", "Python", "Ruby"]

unique_answers = sorted(set(answers))

print(unique_answers)`,
          },
        },
      ],
    },

    /* ================= 第3章 ================= */
    {
      id: "ch3",
      title: "第3章　関数で整理する",
      lessons: [
        {
          id: "l9",
          title: "関数を定義する",
          goal: "処理に名前をつけて、何度でも呼べる形にする",
          body: `
同じ処理を何度も書くかわりに、名前をつけてまとめるのが **関数** です。

~~~
def greet(name):
    return f"こんにちは、{name}さん"

print(greet("山田"))
~~~

- \`def 名前(引数):\` で定義
- \`return\` で値を返す。書かないと \`None\` が返る
- **定義しただけでは動きません。** 呼び出して初めて実行されます

### print と return の違い

ここは最初につまずきやすいところです。

- \`print\` … 画面に**出すだけ**。あとで使えない
- \`return\` … 呼び出し元に値を**渡す**。変数に入れて使える

「関数は計算して return、表示は呼び出し側で print」と分けておくと、あとで再利用しやすくなります。

### 型ヒント

引数と戻り値の型をメモできます。動作は変わりませんが、読みやすさとエディタの補助が段違いです。

~~~
def add(a: int, b: int) -> int:
    return a + b
~~~
`,
          examples: [
            {
              caption: "定義して呼ぶ",
              code: `
def tax_included(price: int, rate: float = 0.1) -> int:
    """税込価格を返す（1円未満切り捨て）"""
    return int(price * (1 + rate))


print(tax_included(1000))
print(tax_included(1000, 0.08))

# 変数に入れて使えるのが return のいいところ
total = tax_included(1200) + tax_included(800)
print(f"合計 {total} 円")
`,
            },
            {
              caption: "return を忘れるとどうなるか",
              code: `
def bad_double(n):
    print(n * 2)      # 表示するだけ


def good_double(n):
    return n * 2      # 値を返す


x = bad_double(5)
print("bad の結果:", x)     # None になる

y = good_double(5)
print("good の結果:", y)
`,
            },
          ],
          exercise: {
            prompt: `
BMI を計算する関数 \`bmi\` を作ってください。

- 引数は \`weight\`（kg）と \`height\`（m）
- 戻り値は \`体重 ÷ 身長の 2 乗\` を **小数第 1 位に丸めた値**（\`round(x, 1)\`）
- \`print\` ではなく \`return\` で返すこと
`,
            starter: `
def bmi(weight, height):
    pass


print(bmi(62, 1.72))
`,
            tests: `
g = globals()
f = g.get("bmi")

check(callable(f), "bmi という関数を定義できている")
if callable(f):
    check(f(62, 1.72) == 21.0, "bmi(62, 1.72) が 21.0 を返す")
    check(f(80, 1.8) == 24.7, "bmi(80, 1.8) が 24.7 を返す")
    check(f(50, 1.6) is not None, "return で値を返している（print だけになっていない）")
`,
            hint: "2 乗はべき乗の演算子で書けます（第1章）。丸めは `round(値, 桁数)`。`print` ではなく `return` で返すこと。",
            solution: `def bmi(weight: float, height: float) -> float:
    return round(weight / height ** 2, 1)


print(bmi(62, 1.72))`,
          },
        },

        {
          id: "l10",
          title: "引数のいろいろ",
          goal: "既定値・キーワード引数・可変長引数を使い分ける",
          body: `
### 既定値つき引数

\`def f(a, b=10)\` のように既定値を書くと、呼ぶときに省略できます。既定値のある引数は、必ず後ろにまとめます。

> **落とし穴**：既定値にリストや辞書を書いてはいけません（\`def f(items=[])\`）。関数を呼ぶたびに同じリストが使い回されます。空にしたいときは \`def f(items=None)\` として、中で \`if items is None: items = []\` とします。

### キーワード引数

呼ぶときに \`f(rate=0.08)\` と名前を書けます。引数が多い関数では、読み手に親切になります。

### 可変長引数

- \`*args\` … 位置引数をタプルでまとめて受け取る
- \`**kwargs\` … キーワード引数を辞書でまとめて受け取る

### スコープ

関数の中で作った変数は、関数の外からは見えません。外の変数を関数の中で読むことはできますが、**書き換えるには工夫が要ります**（原則、引数で受けて return で返すほうが安全）。
`,
          examples: [
            {
              caption: "既定値とキーワード",
              code: `
def make_url(host, path="/", scheme="https", port=None):
    url = f"{scheme}://{host}"
    if port:
        url += f":{port}"
    return url + path


print(make_url("example.com"))
print(make_url("example.com", "/api/users"))
print(make_url("localhost", "/", scheme="http", port=8000))
`,
            },
            {
              caption: "*args と **kwargs",
              code: `
def total(*nums):
    return sum(nums)


print(total(1, 2, 3))
print(total(10, 20, 30, 40))


def show_info(**info):
    for k, v in info.items():
        print(f"{k} = {v}")


show_info(name="山田", lang="Python", year=2020)
`,
            },
          ],
          exercise: {
            prompt: `
文章を装飾する関数 \`decorate\` を作ってください。

- 第 1 引数 \`text\`（必須）
- 第 2 引数 \`mark\`（既定値 \`"*"\`）
- 第 3 引数 \`times\`（既定値 \`3\`）
- \`mark\` を \`times\` 回くり返したもので \`text\` を挟んだ文字列を返す

例：\`decorate("重要")\` → \`"***重要***"\`
`,
            starter: `
def decorate(text, mark="*", times=3):
    pass


print(decorate("重要"))
print(decorate("注意", mark="!", times=2))
`,
            tests: `
g = globals()
f = g.get("decorate")

check(callable(f), "decorate という関数を定義できている")
if callable(f):
    check(f("重要") == "***重要***", 'decorate("重要") が "***重要***" を返す')
    check(f("注意", mark="!", times=2) == "!!注意!!", "キーワード引数つきの呼び出しも正しい")
    check(f("A", "-") == "---A---", "mark だけ変えた呼び出しも正しい")
`,
            hint: "同じ文字を繰り返した文字列は、掛け算の演算子で作れます（第1章）。作った飾りで text を挟みましょう。",
            solution: `def decorate(text: str, mark: str = "*", times: int = 3) -> str:
    edge = mark * times
    return f"{edge}{text}{edge}"


print(decorate("重要"))
print(decorate("注意", mark="!", times=2))`,
          },
        },

        {
          id: "shorthand",
          title: "短く書く記法",
          goal: "三項演算子・lambda・key= を読めるようにし、使いどころを判断できるようにする",
          body: `
実務のコードには「短く書くための記法」がよく出てきます。**知らないと読めない**ので、ここで一度まとめて押さえます。

### 条件を 1 行で書く（三項演算子）

~~~
label = "偶数" if n % 2 == 0 else "奇数"
~~~

読み方は真ん中の \`if\` から。「n が偶数なら \`"偶数"\`、そうでなければ \`"奇数"\`」。

これは **式** なので、そのまま代入したり、関数の引数に渡したりできます（\`if\` 文はできません）。

### 名前のない関数（lambda）

\`lambda 引数: 式\` で、その場限りの小さな関数を作れます。

~~~
double = lambda n: n * 2      # def で書くのとほぼ同じ
~~~

- 中に書けるのは **式ひとつだけ**。\`return\` は書きません（式の値がそのまま戻り値）
- 上のように変数へ代入するだけなら、素直に \`def\` で書くべきです
- **本当の使いどころは「他の関数に渡すとき」**

### key= — 「何を基準に比べるか」を渡す

\`sorted\` \`max\` \`min\` は \`key\` に **関数** を受け取り、その戻り値どうしを比べます。

~~~
people = [("佐藤", 30), ("鈴木", 25)]
sorted(people, key=lambda p: p[1])     # 年齢の小さい順
~~~

\`lambda p: p[1]\` は「渡された値の 1 番目を取り出す関数」。並べ替えたい基準を、その場で書けるわけです。

関数をそのまま渡すこともできます。このとき **かっこを付けない** のがポイントです（呼ぶのではなく、関数自体を渡す）。

~~~
prices = {"りんご": 150, "メロン": 3800}
max(prices, key=prices.get)            # → "メロン"
~~~

\`prices.get()\` と書くと「呼んだ結果」を渡してしまいエラーになります。

### or で既定値を入れる

\`or\` は「左が偽なら右を返す」ため、既定値の指定に使えます。

~~~
name = user_name or "ゲスト"
~~~

### 短くしすぎない

これらは **読みやすくなるときだけ** 使います。三項演算子を入れ子にしたり、lambda に複雑な式を詰め込んだりすると、かえって読めなくなります。迷ったら \`def\` と \`if\` 文に戻してください。

### もっと詳しく

- [ソート HOWTO — key の使い方](https://docs.python.org/ja/3/howto/sorting.html)
- [組み込み関数（sorted / max / min）](https://docs.python.org/ja/3/library/functions.html)
`,
          examples: [
            {
              caption: "三項演算子と or",
              code: `
for n in [3, 8, 0, -5]:
    label = "偶数" if n % 2 == 0 else "奇数"
    sign = "正" if n > 0 else "0以下"
    print(f"{n:>3} → {label} / {sign}")

print("---")

# or で既定値を入れる（空文字列・0・空リストは「偽」）
for entered in ["山田", "", None]:
    name = entered or "ゲスト"
    print(f"{entered!r} → {name}")
`,
            },
            {
              note: "**ここからが本題です。** 同じ並べ替えを、key を変えて 3 通り試してみましょう。",
              caption: "key= で比べ方を変える",
              code: `
people = [
    {"name": "佐藤", "age": 30, "score": 72},
    {"name": "鈴木", "age": 25, "score": 88},
    {"name": "高橋", "age": 41, "score": 65},
]

# 年齢の小さい順
for p in sorted(people, key=lambda p: p["age"]):
    print(p["name"], p["age"])

print("---")

# 点数の高い順（降順）
for p in sorted(people, key=lambda p: p["score"], reverse=True):
    print(p["name"], p["score"])

print("---")

# 最年長 / 最高得点
print("最年長  :", max(people, key=lambda p: p["age"])["name"])
print("最高得点:", max(people, key=lambda p: p["score"])["name"])

# key を渡さないと「どう比べればいいか」が分からずエラーになります
# print(max(people))
`,
            },
          ],
          exercise: {
            prompt: `
社員リストを扱います。次の 2 つを作ってください。

1. \`by_salary\` … \`employees\` を **給与の高い順** に並べた新しいリスト
2. \`youngest\` … **最年少** の社員の**名前**（文字列）

> \`employees\` そのものは変更しないでください。
`,
            starter: `
employees = [
    {"name": "佐藤", "age": 30, "salary": 320000},
    {"name": "鈴木", "age": 25, "salary": 280000},
    {"name": "高橋", "age": 41, "salary": 450000},
    {"name": "田中", "age": 34, "salary": 380000},
]

by_salary =
youngest =

for e in by_salary:
    print(f'{e["name"]} {e["salary"]:,}円')
print("最年少:", youngest)
`,
            tests: `
g = globals()
bs = g.get("by_salary")

check(isinstance(bs, list) and len(bs) == 4, "by_salary が 4 件のリストになっている")
if isinstance(bs, list) and len(bs) == 4:
    check([e["name"] for e in bs] == ["高橋", "田中", "佐藤", "鈴木"], "給与の高い順に並んでいる")
    check(g.get("employees")[0]["name"] == "佐藤", "元の employees は並べ替えていない")

check(g.get("youngest") == "鈴木", "youngest が '鈴木' になっている")
check(isinstance(g.get("youngest"), str), "youngest は名前の文字列（辞書のままではない）")
`,
            hint: "`sorted` と `min` の `key` には「比べたい値を取り出す関数」を渡します。辞書から 1 つの項目を取り出す関数を lambda で書いてみましょう。降順にするオプションも必要です。最後に、取れた社員から名前だけを取り出します。",
            solution: `employees = [
    {"name": "佐藤", "age": 30, "salary": 320000},
    {"name": "鈴木", "age": 25, "salary": 280000},
    {"name": "高橋", "age": 41, "salary": 450000},
    {"name": "田中", "age": 34, "salary": 380000},
]

by_salary = sorted(employees, key=lambda e: e["salary"], reverse=True)
youngest = min(employees, key=lambda e: e["age"])["name"]

for e in by_salary:
    print(f'{e["name"]} {e["salary"]:,}円')
print("最年少:", youngest)`,
          },
        },

        {
          id: "l11",
          title: "内包表記",
          goal: "「ループして新しいリストを作る」を 1 行で書く",
          body: `
リストを作る for ループは、Python では 1 行で書けます。これが **内包表記**（comprehension）。

~~~
# ふつうに書くと
squares = []
for n in range(1, 6):
    squares.append(n ** 2)

# 内包表記だと
squares = [n ** 2 for n in range(1, 6)]
~~~

読み方は「**\`for\` の部分を先に読み、前の式を当てはめる**」。慣れると圧倒的に読みやすくなります。

### 条件でしぼる

~~~
evens = [n for n in nums if n % 2 == 0]
~~~

\`if\` は末尾。「絞ってから変換する」の順です。

### 辞書・集合でも使える

- 辞書：\`{k: v for k, v in pairs}\`
- 集合：\`{x for x in items}\`

> 何でも 1 行にすればいいわけではありません。**入れ子が 2 段を超えたら、素直に for 文に戻す**のが読みやすさのコツです。
`,
          examples: [
            {
              caption: "作る・しぼる",
              code: `
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

print([n ** 2 for n in nums])
print([n for n in nums if n % 2 == 0])
print([n * 10 for n in nums if n > 7])

words = ["  python ", "GO", " Rust  "]
print([w.strip().lower() for w in words])
`,
            },
            {
              caption: "辞書内包表記",
              code: `
names = ["りんご", "みかん", "ぶどう"]
prices = [150, 80, 1200]

catalog = {name: price for name, price in zip(names, prices)}
print(catalog)

# 値でしぼる
expensive = {k: v for k, v in catalog.items() if v >= 100}
print(expensive)
`,
            },
          ],
          exercise: {
            prompt: `
ユーザー名のリストから、**空白を取り除いて小文字にした、空でないものだけ** のリストを作ってください。

変数名は \`cleaned\`。内包表記 1 行で書いてみましょう。
`,
            starter: `
raw = ["  Alice ", "BOB", "   ", "Carol  ", ""]

cleaned =

print(cleaned)
`,
            tests: `
g = globals()
check(g.get("cleaned") == ["alice", "bob", "carol"], "cleaned が ['alice', 'bob', 'carol'] になっている")
`,
            hint: "内包表記は「変換する式 → for → 絞り込みの if」の順です。空白だけの文字列は `strip()` すると空になり、条件式では偽になります。",
            solution: `raw = ["  Alice ", "BOB", "   ", "Carol  ", ""]

cleaned = [w.strip().lower() for w in raw if w.strip()]

print(cleaned)`,
          },
        },

        {
          id: "l12",
          title: "例外処理",
          goal: "エラーで止まらないコードの書き方を知る",
          body: `
実行時のエラーを **例外** と呼びます。放っておくとプログラムが止まりますが、\`try\` で受け止められます。

~~~
try:
    n = int(text)
except ValueError:
    n = 0
~~~

### 書き方の全体像

~~~
try:
    危ないかもしれない処理
except エラーの種類 as e:
    失敗したときの処理
else:
    成功したときだけの処理   # 省略可
finally:
    成否にかかわらず必ず実行  # 省略可
~~~

### よく出会う例外

| 例外 | いつ出るか |
|---|---|
| \`ValueError\` | 型は合うが値がおかしい（\`int("abc")\`） |
| \`TypeError\` | 型が合わない（\`"a" + 1\`） |
| \`KeyError\` | 辞書に無いキー |
| \`IndexError\` | リストの範囲外 |
| \`ZeroDivisionError\` | 0 で割った |
| \`FileNotFoundError\` | ファイルが無い |

> **\`except:\` とだけ書いて全部を握りつぶすのは避けましょう。** 想定した種類だけを捕まえるほうが、あとでバグを見つけやすくなります。

自分でエラーを起こしたいときは \`raise ValueError("メッセージ")\`。

### もっと詳しく

- [組み込み例外の一覧（公式）](https://docs.python.org/ja/3/library/exceptions.html)
- [エラーと例外（公式チュートリアル）](https://docs.python.org/ja/3/tutorial/errors.html)
`,
          examples: [
            {
              caption: "受け止める",
              code: `
values = ["10", "abc", "3.5", "7"]

for v in values:
    try:
        n = int(v)
    except ValueError as e:
        print(f"{v!r} は整数にできません（{e}）")
    else:
        print(f"{v!r} → {n}")
`,
            },
            {
              caption: "自分で投げる",
              code: `
def withdraw(balance: int, amount: int) -> int:
    if amount <= 0:
        raise ValueError("金額は 1 以上にしてください")
    if amount > balance:
        raise ValueError("残高が足りません")
    return balance - amount


print(withdraw(1000, 300))

try:
    withdraw(1000, 5000)
except ValueError as e:
    print("エラー:", e)
`,
            },
          ],
          exercise: {
            prompt: `
文字列を安全に整数へ変換する関数 \`to_int\` を作ってください。

- 変換できたらその整数を返す
- 変換できなければ \`default\`（既定値 \`0\`）を返す
- 例外で止まらないこと
`,
            starter: `
def to_int(text, default=0):
    pass


print(to_int("42"))
print(to_int("abc"))
print(to_int("abc", -1))
`,
            tests: `
g = globals()
f = g.get("to_int")

check(callable(f), "to_int という関数を定義できている")
if callable(f):
    check(f("42") == 42, 'to_int("42") が 42 を返す')
    check(f("abc") == 0, 'to_int("abc") が既定値 0 を返す')
    check(f("abc", -1) == -1, 'to_int("abc", -1) が -1 を返す')
    check(f("  7 ") == 7, "前後に空白があっても int() は変換できる")
`,
            hint: "`int(\"abc\")` で出る例外の種類を、本文の表で確認しましょう。`try` の中で変換して返し、その例外を受け止めたほうで既定値を返します。",
            solution: `def to_int(text: str, default: int = 0) -> int:
    try:
        return int(text)
    except ValueError:
        return default


print(to_int("42"))
print(to_int("abc"))
print(to_int("abc", -1))`,
          },
        },
      ],
    },

    /* ================= 第4章 ================= */
    {
      id: "ch4",
      title: "第4章　かたまりを作る",
      lessons: [
        {
          id: "l13",
          title: "クラスの基本",
          goal: "データと処理をひとまとめにする書き方を理解する",
          body: `
関連するデータと、それを扱う処理をまとめたものが **クラス** です。

~~~
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"{self.name}（{self.age}歳）です"
~~~

- \`__init__\` … 作られるときに呼ばれる初期化メソッド
- \`self\` … 「この個体自身」。メソッドの第 1 引数に必ず書く（呼ぶときは書かない）
- \`u = User("山田", 30)\` で **インスタンス**（実体）を作る

### いつクラスを使うか

「同じ形のデータをいくつも作り、それぞれに操作がある」ときです。データを持ち回すだけなら辞書で十分なこともあります。迷ったら、まず関数と辞書で書いてみて、引数の受け渡しが煩雑になってきたらクラスにする、で構いません。

### \`__str__\`

\`print(オブジェクト)\` したときの表示を決められます。デバッグがぐっと楽になります。
`,
          examples: [
            {
              caption: "定義して使う",
              code: `
class BankAccount:
    def __init__(self, owner: str, balance: int = 0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount: int) -> None:
        self.balance += amount

    def withdraw(self, amount: int) -> None:
        if amount > self.balance:
            raise ValueError("残高不足")
        self.balance -= amount

    def __str__(self) -> str:
        return f"{self.owner}さんの口座：{self.balance:,}円"


acc = BankAccount("山田", 10000)
acc.deposit(5000)
acc.withdraw(3000)
print(acc)

try:
    acc.withdraw(999999)
except ValueError as e:
    print("エラー:", e)
`,
            },
            {
              caption: "インスタンスはそれぞれ独立している",
              code: `
class Counter:
    def __init__(self):
        self.count = 0

    def tick(self):
        self.count += 1
        return self.count


a = Counter()
b = Counter()

a.tick()
a.tick()
b.tick()

print("a:", a.count)   # 2
print("b:", b.count)   # 1
`,
            },
          ],
          exercise: {
            prompt: `
買い物かごを表す \`Cart\` クラスを作ってください。

- \`__init__\` で空のリスト \`self.items\` を用意する
- \`add(self, name, price)\` … \`(name, price)\` のタプルを \`items\` に追加する
- \`total(self)\` … 価格の合計を返す
- \`count(self)\` … 入っている個数を返す
`,
            starter: `
class Cart:
    def __init__(self):
        pass

    def add(self, name, price):
        pass

    def total(self):
        pass

    def count(self):
        pass


cart = Cart()
cart.add("りんご", 150)
cart.add("メロン", 3800)
print(cart.count(), cart.total())
`,
            tests: `
g = globals()
C = g.get("Cart")

check(C is not None, "Cart クラスを定義できている")
if C is not None:
    c = C()
    check(c.total() == 0, "空のかごの total() が 0")
    check(c.count() == 0, "空のかごの count() が 0")

    c.add("A", 100)
    c.add("B", 250)
    check(c.count() == 2, "2 つ追加したら count() が 2")
    check(c.total() == 350, "合計 total() が 350")

    check(C().count() == 0, "別のかごは独立している（items を共有していない）")
`,
            hint: [
              "4 つのメソッドはどれも「このかごの中身」を見ます。`add` で足したものが `total` や `count` からも見えるように、中身の置き場所を 1 か所に決めるのが最初の仕事です。",
              "空のかごでも `total()` と `count()` が答えを返さなければいけません。中身の入れ物を「最初に `add` されたとき」に作る設計だと、一度も追加せずに呼ばれた時点で壊れます。いつ用意しておくべきでしょうか。",
              "「別のかごは独立している」というチェックがあります。入れ物をメソッドの外（クラス直下）に書くと、すべてのかごが同じものを共有してしまいます。かご 1 つずつが自分の入れ物を持つには、どこで作ればよいか考えてください。",
              "1 件は「品名」と「価格」の 2 つで 1 セットです。これを 1 つの値としてまとめて持っておくと、`count` は件数を数えるだけ、`total` はその中の価格側だけを足すだけで済みます（第2章のタプル）。",
            ],
            solution: `class Cart:
    def __init__(self):
        self.items = []

    def add(self, name: str, price: int) -> None:
        self.items.append((name, price))

    def total(self) -> int:
        return sum(price for _, price in self.items)

    def count(self) -> int:
        return len(self.items)


cart = Cart()
cart.add("りんご", 150)
cart.add("メロン", 3800)
print(cart.count(), cart.total())`,
          },
        },

        {
          id: "l14",
          title: "継承と dataclass",
          goal: "クラスを土台に広げる方法と、定型文を省く書き方を知る",
          body: `
### 継承

既存のクラスを土台に、差分だけ書き足せます。

~~~
class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "ワン"
~~~

親のメソッドを呼びたいときは \`super().メソッド()\`。

同じメソッド名で違う振る舞いをさせることを**ポリモーフィズム**と呼びますが、実用上は「同じ使い方ができるクラスたち」くらいに捉えておけば十分です。

### dataclass

「データを持つだけ」のクラスは \`__init__\` を書くのが面倒です。\`@dataclass\` を付けると自動で用意されます。

~~~
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int = 0
~~~

\`__init__\`、\`__repr__\`（見やすい表示）、\`==\`（値どうしの比較）が自動生成されます。設定やレコードを表すクラスは、まずこれで書き始めるのがおすすめです。
`,
          examples: [
            {
              caption: "継承と super()",
              code: `
class Employee:
    def __init__(self, name: str, salary: int):
        self.name = name
        self.salary = salary

    def profile(self) -> str:
        return f"{self.name}（月給 {self.salary:,}円）"


class Manager(Employee):
    def __init__(self, name: str, salary: int, members: int):
        super().__init__(name, salary)    # 親の初期化を呼ぶ
        self.members = members

    def profile(self) -> str:
        base = super().profile()
        return f"{base} / 部下 {self.members}名"


people = [Employee("佐藤", 300000), Manager("鈴木", 500000, 4)]
for p in people:
    print(p.profile())
`,
            },
            {
              caption: "dataclass で楽をする",
              code: `
from dataclasses import dataclass, field


@dataclass
class Task:
    title: str
    done: bool = False
    tags: list = field(default_factory=list)   # 可変な既定値はこう書く

    def complete(self):
        self.done = True


t1 = Task("ドキュメントを読む")
t2 = Task("ドキュメントを読む")

print(t1)              # 自動で見やすく表示される
print(t1 == t2)        # 中身が同じなら True

t1.complete()
print(t1)
`,
            },
          ],
          exercise: {
            prompt: `
\`@dataclass\` を使って書籍を表す \`Book\` を作ってください。

- \`title\`（str）、\`author\`（str）、\`price\`（int、既定値 \`0\`）
- メソッド \`label(self)\` は \`"タイトル / 著者 (価格円)"\` の形の文字列を返す
  - 例：\`"リーダブルコード / Dustin Boswell (2640円)"\`
`,
            starter: `
from dataclasses import dataclass


@dataclass
class Book:
    pass


b = Book("リーダブルコード", "Dustin Boswell", 2640)
print(b)
print(b.label())
`,
            tests: `
g = globals()
B = g.get("Book")

check(B is not None, "Book クラスを定義できている")
if B is not None:
    b = B("リーダブルコード", "Dustin Boswell", 2640)
    check(b.title == "リーダブルコード", "title を受け取れている")
    check(b.label() == "リーダブルコード / Dustin Boswell (2640円)", "label() の形式が正しい")
    check(B("A", "B").price == 0, "price の既定値が 0 になっている")
    check(B("A", "B") == B("A", "B"), "dataclass なので中身が同じなら == が True になる")
`,
            hint: "クラス本体に `title: str` のように型つきで並べるだけで `__init__` ができます。`label` は普通のメソッドとして書きます。",
            solution: `from dataclasses import dataclass


@dataclass
class Book:
    title: str
    author: str
    price: int = 0

    def label(self) -> str:
        return f"{self.title} / {self.author} ({self.price}円)"


b = Book("リーダブルコード", "Dustin Boswell", 2640)
print(b)
print(b.label())`,
          },
        },

        {
          id: "l15",
          title: "標準ライブラリを使う",
          goal: "「まず標準ライブラリを探す」習慣をつける",
          body: `
Python には最初から膨大な道具が付いています（"batteries included"）。自分で書く前に、まず標準ライブラリを疑うのが上達の近道です。

~~~
import math
from datetime import date
~~~

### よく使うもの

| モジュール | 用途 |
|---|---|
| \`math\` | 数学関数（\`sqrt\`, \`ceil\`, \`floor\`, \`pi\`） |
| \`random\` | 乱数、シャッフル、抽選 |
| \`datetime\` | 日付と時刻の計算 |
| \`collections\` | \`Counter\`, \`defaultdict\` |
| \`itertools\` | 組み合わせ、繰り返し |
| \`json\` | JSON の読み書き |
| \`pathlib\` | ファイルパス操作 |
| \`re\` | 正規表現 |
| \`statistics\` | 平均・中央値・標準偏差 |

### とくに便利な 2 つ

- \`collections.Counter\` … 登場回数の集計が 1 行で終わります
- \`datetime\` … 日付の引き算で「何日前か」が出せます

### もっと詳しく

- [標準ライブラリ目次（公式）](https://docs.python.org/ja/3/library/index.html)
- [collections（Counter / defaultdict）](https://docs.python.org/ja/3/library/collections.html)
- [datetime（日付と時刻）](https://docs.python.org/ja/3/library/datetime.html)
`,
          examples: [
            {
              caption: "Counter と statistics",
              code: `
from collections import Counter
import statistics

logs = ["GET", "POST", "GET", "GET", "DELETE", "POST"]

c = Counter(logs)
print(c)
print(c.most_common(2))     # 上位 2 件
print(c["GET"])

scores = [62, 91, 78, 45, 88, 70]
print("平均:", statistics.mean(scores))
print("中央値:", statistics.median(scores))
print("標準偏差:", round(statistics.stdev(scores), 2))
`,
            },
            {
              caption: "日付を扱う",
              code: `
from datetime import date, timedelta

today = date(2026, 7, 30)
print("今日:", today)
print("書式:", today.strftime("%Y年%m月%d日"))

deadline = date(2026, 12, 31)
print("残り日数:", (deadline - today).days)

print("1週間後:", today + timedelta(days=7))

# 文字列から日付へ
d = date.fromisoformat("2026-01-01")
print("元日からの経過:", (today - d).days, "日")
`,
            },
          ],
          exercise: {
            prompt: `
アクセスログのリストから、**最も多いパスとその回数** を求めてください。

- \`collections.Counter\` を使う
- \`top_path\` … 最も多いパス（文字列）
- \`top_count\` … その回数（整数）
`,
            starter: `
from collections import Counter

paths = ["/", "/about", "/", "/contact", "/", "/about"]

top_path = ""
top_count = 0

print(top_path, top_count)
`,
            tests: `
g = globals()
check(g.get("top_path") == "/", "top_path が '/' になっている")
check(g.get("top_count") == 3, "top_count が 3 になっている")
`,
            hint: "`most_common(n)` は `[(値, 回数), ...]` という形で返ってきます。1 件だけ取り出して、タプルを 2 つの変数に分解しましょう（第2章のアンパック）。",
            solution: `from collections import Counter

paths = ["/", "/about", "/", "/contact", "/", "/about"]

top_path, top_count = Counter(paths).most_common(1)[0]

print(top_path, top_count)`,
          },
        },

        {
          id: "l16",
          title: "総合演習：小さな家計簿",
          goal: "ここまでの道具を組み合わせて、ひとまとまりのプログラムを書く",
          body: `
最後は総合演習です。第1章から第4章までの内容を組み合わせます。

使う道具の確認：

- 辞書のリスト（\`[{"item": ..., "price": ...}, ...]\`）でレコードを表す
- 関数に分けて、\`return\` で値を返す
- \`sum\` と内包表記で集計する
- \`sorted\` の \`key\` で並べ替える
- f 文字列で整形する

実務のデータ処理も、突き詰めればこの組み合わせです。ここができれば、他のコースへ進む土台は十分にできています。
`,
          examples: [
            {
              caption: "扱うデータの形を確認する",
              code: `
records = [
    {"date": "2026-07-01", "item": "ランチ", "category": "食費", "price": 980},
    {"date": "2026-07-01", "item": "電車", "category": "交通費", "price": 420},
    {"date": "2026-07-03", "item": "本", "category": "教養", "price": 2640},
    {"date": "2026-07-05", "item": "夕食", "category": "食費", "price": 1580},
    {"date": "2026-07-08", "item": "タクシー", "category": "交通費", "price": 1900},
    {"date": "2026-07-12", "item": "オンライン講座", "category": "教養", "price": 4800},
]

for r in records[:3]:
    print(r["date"], r["item"], r["price"])

print("件数:", len(records))
print("総額:", sum(r["price"] for r in records))
`,
            },
          ],
          exercise: {
            prompt: `
上の \`records\` を集計する関数を 3 つ作ってください。

1. \`total(records)\` … 合計金額（int）を返す
2. \`by_category(records)\` … \`{"食費": 2560, ...}\` のようなカテゴリ別合計の辞書を返す
3. \`top_items(records, n=3)\` … 金額の大きい順に \`n\` 件、\`(item, price)\` のタプルのリストを返す

> 一度に全部書こうとせず、1 つずつ「採点する」を押しながら進めてください。
`,
            starter: `
records = [
    {"date": "2026-07-01", "item": "ランチ", "category": "食費", "price": 980},
    {"date": "2026-07-01", "item": "電車", "category": "交通費", "price": 420},
    {"date": "2026-07-03", "item": "本", "category": "教養", "price": 2640},
    {"date": "2026-07-05", "item": "夕食", "category": "食費", "price": 1580},
    {"date": "2026-07-08", "item": "タクシー", "category": "交通費", "price": 1900},
    {"date": "2026-07-12", "item": "オンライン講座", "category": "教養", "price": 4800},
]


def total(records):
    pass


def by_category(records):
    pass


def top_items(records, n=3):
    pass


print("合計:", total(records))
print("カテゴリ別:", by_category(records))
for item, price in top_items(records):
    print(f"  {item:<12} {price:>6,}円")
`,
            tests: `
g = globals()
data = [
    {"item": "a", "category": "X", "price": 100},
    {"item": "b", "category": "Y", "price": 300},
    {"item": "c", "category": "X", "price": 250},
    {"item": "d", "category": "Z", "price": 50},
]

t = g.get("total")
bc = g.get("by_category")
ti = g.get("top_items")

check(callable(t), "total を定義できている")
check(callable(bc), "by_category を定義できている")
check(callable(ti), "top_items を定義できている")

if callable(t):
    check(t(data) == 700, "total が合計 700 を返す")
    check(t([]) == 0, "空のリストなら 0 を返す")
if callable(bc):
    check(bc(data) == {"X": 350, "Y": 300, "Z": 50}, "by_category がカテゴリ別合計を返す")
if callable(ti):
    check(ti(data, 2) == [("b", 300), ("c", 250)], "top_items(data, 2) が上位 2 件を返す")
    check(len(ti(data)) == 3, "n の既定値が 3 になっている")
`,
            hint: [
              "3 つの関数は互いに独立しています。1 つ書くたびに採点して、どこまで通ったかを確かめながら進めてください。共通するのは「辞書のリストから、必要なキーの値だけを取り出す」という動きです。",
              "`total` … 全件の price を足すだけですが、空のリストを渡されたときに 0 になる必要があります。合計を「0 から始めて足していく」と考えると、空でも自然に 0 になります。",
              "`by_category` … 同じカテゴリが何度も出てきます。1 回目はそのキーがまだ辞書に無い状態です。「無ければ 0 から、あればそこに足す」をどう書くかが山場で、そのまま `+=` すると最初の 1 件で落ちます（第2章）。",
              "`top_items` … 並べ替えの基準は辞書そのものではなく、その中の price です。基準を指定して降順に並べ、上位 n 件を切り出し、最後に求められている形（品名と価格の組）へ変換する、という 3 段階に分けて考えましょう。`n` の既定値も忘れずに。",
            ],
            solution: `def total(records) -> int:
    return sum(r["price"] for r in records)


def by_category(records) -> dict:
    result = {}
    for r in records:
        result[r["category"]] = result.get(r["category"], 0) + r["price"]
    return result


def top_items(records, n: int = 3) -> list:
    ordered = sorted(records, key=lambda r: r["price"], reverse=True)
    return [(r["item"], r["price"]) for r in ordered[:n]]`,
          },
        },
      ],
    },
  ],
};

export default content;
