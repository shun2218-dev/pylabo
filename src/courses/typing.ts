/* ============================================================
   コース：型ヒントと静的解析
   一覧に出す情報（タイトルやアイコン）は src/courses/registry.ts 側にある。

   このコースだけの事情：
   エディタが 1 枚しかないので、「ファイルを mypy にかける」を run_mypy()
   というヘルパーで代用している（src/lib/python-helpers.ts）。いま書いている
   コードをそのままファイルとして書き出し、mypy に渡す。
   手元でどう動かすか（pip install mypy → mypy ファイル名）は、各レッスンの
   本文で必ず示すこと。

   採点の考え方：
   「注釈が書いてあるか」を数えるのではなく、**書いた型が誤った使い方を
   捕まえられるか** を見る。学習者のコードの後ろにわざと間違った呼び出しを
   足して mypy にかけ、そこでエラーが出るかを確かめている。型が緩ければ
   （list や dict と書いただけなら）捕まらないので、そこで落ちる。
   ============================================================ */

import type { CourseContent } from "../types";

const content: CourseContent = {
  chapters: [
    /* ================= 第1章 ================= */
    {
      id: "ch1",
      title: "第1章　型ヒントを書いて mypy にかける",
      lessons: [
        {
          id: "l1",
          title: "型ヒントを書く",
          goal: "引数と戻り値に型を書き、それが実行時には効かないことを知る",
          body: `
Python は、変数の型を書かなくても動きます。

~~~
def greet(name):
    return "こんにちは、" + name
~~~

このコードを読んだ人は、\`name\` に何を渡せばよいのかを**本文から推測する**しかありません。**型ヒント**は、その推測を書き残すための記法です。

~~~
def greet(name: str) -> str:
    return "こんにちは、" + name
~~~

- \`name: str\` … 引数の型
- \`-> str\` … 戻り値の型

変数にも書けます。

~~~
count: int = 0
rate: float = 0.1
names: list[str] = []
~~~

### 書いても、実行時には検査されない

ここが最初のつまずきどころです。型ヒントは**注釈**であって、チェックではありません。

~~~
def double(n: int) -> int:
    return n * 2


print(double("あ"))   # → ああ（止まらない）
~~~

\`str\` を渡しても Python は何も言いません。\`n * 2\` が文字列にも通る演算なので、そのまま最後まで走ります。

つまり型ヒントは、**別の道具に読ませてはじめて意味を持ちます**。その道具が次のレッスンで動かす mypy です。

### では何のために書くのか

| 相手 | 効き目 |
|---|---|
| 読む人 | 引数に何を渡すのか、何が返るのかが、本文を読まなくても分かる |
| エディタ | 補完が効く。\`.\` を打った時点で候補が出る |
| 静的解析（mypy など） | 実行する前に、型の食い違いを見つけてくれる |

3 つめが本命です。テストは「動かして」確かめますが、型は**動かす前**に確かめられます。

### 注釈は値として取り出せる

関数に付けた注釈は \`__annotations__\` に残ります。

~~~
print(double.__annotations__)
~~~

普段これを読むことはありませんが、「注釈はただのデータであって、Python 自身は使っていない」ことがはっきりします。

### もっと詳しく

注釈に書けるのは型だけではなく、\`Annotated[int, "円"]\` のように追加の情報を添えることもできます。実行時にこれを読み取って検証する仕組みを持つライブラリ（FastAPI の \`Query\`、Pydantic のフィールドなど）は、この仕掛けの上に立っています。「注釈は実行時に無視される」は Python 本体の話であって、**読み取って使うライブラリはある**、と分けて覚えてください。

Python 3.14 では注釈の評価が遅延されるようになり（PEP 649）、まだ定義していないクラスを注釈に書いても文字列で囲む必要がなくなりました。古い記事に出てくる \`from __future__ import annotations\` は、その前身にあたる書き方です。

- [typing --- 型ヒントのサポート（公式）](https://docs.python.org/ja/3/library/typing.html)
- [PEP 484 -- Type Hints（英語）](https://peps.python.org/pep-0484/)
- [PEP 649 -- 注釈の遅延評価（英語）](https://peps.python.org/pep-0649/)
`,
          examples: [
            {
              caption: "型ヒントを付けた関数",
              code: `
def greet(name: str) -> str:
    return "こんにちは、" + name


count: int = 3

for _ in range(count):
    print(greet("山田"))
`,
            },
            {
              caption: "型と違う値を渡しても止まらない",
              note: "`int` と書いてあるのに `str` を渡しています。それでも Python は動かしてしまう、という確認です。",
              code: `
def double(n: int) -> int:
    return n * 2


print(double(21))
print(double("あ"))
`,
            },
            {
              caption: "注釈はデータとして残っている",
              code: `
def double(n: int) -> int:
    return n * 2


print(double.__annotations__)
`,
            },
          ],
          exercise: {
            prompt: `
商品名と価格から、表示用の文字列を作る関数 \`label\` に型ヒントを付けてください。

| 呼び出し | 返る値 |
|---|---|
| \`label("りんご", 100)\` | \`"りんご: 100円"\` |
| \`label("みかん", 80)\` | \`"みかん: 80円"\` |

- 引数 \`name\` は文字列、\`price\` は整数、戻り値は文字列です
- あわせて、税率を表す変数 \`TAX_RATE\` を **型ヒント付きで** \`0.1\` として定義してください（小数です）

> このレッスンではまだ mypy を動かしません。採点は「注釈が書けているか」と「関数が仕様どおり動くか」を見ます。
`,
            starter: `
def label(name, price):
    return ""


TAX_RATE = 0.1
`,
            tests: `
import ast
from typing import get_type_hints

g = globals()
f = g.get("label")

check(callable(f), "label という関数を定義できている")

if callable(f):
    got = f("りんご", 100)
    check(got == "りんご: 100円", "label('りんご', 100) が 'りんご: 100円' になる（今は {!r}）".format(got))
    got = f("みかん", 80)
    check(got == "みかん: 80円", "label('みかん', 80) が 'みかん: 80円' になる（今は {!r}）".format(got))

    try:
        hints = get_type_hints(f)
    except Exception:
        hints = {}

    check(hints.get("name") is str, "引数 name に str の型ヒントが付いている")
    check(hints.get("price") is int, "引数 price に int の型ヒントが付いている")
    check(hints.get("return") is str, "戻り値に str の型ヒントが付いている")

# 変数の型ヒントは、書いたコードから直接読む
# （モジュールの注釈は実行のしかたによって取り出し方が変わるため）
annotated = []
try:
    for node in ast.walk(ast.parse(_source())):
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            annotated.append(node.target.id)
except SyntaxError:
    pass

check("TAX_RATE" in annotated, "TAX_RATE を型ヒント付きで定義できている")
check(g.get("TAX_RATE") == 0.1, "TAX_RATE の値が 0.1 になっている（今は {!r}）".format(g.get("TAX_RATE")))
`,
            hint: "文字列の中に値を差し込む書き方は基本文法コースで扱ったものがそのまま使えます。変数の型ヒントは「名前 : 型 = 値」の形で、小数は int ではありません。",
            solution: `def label(name: str, price: int) -> str:
    """商品名と価格を表示用の文字列にする。"""
    return f"{name}: {price}円"


TAX_RATE: float = 0.1

print(label("りんご", 100))
print(label("みかん", 80))`,
            rejects: [
              {
                caption: "動きはするが、型ヒントを書いていない",
                code: `def label(name, price):
    return f"{name}: {price}円"


TAX_RATE = 0.1`,
              },
            ],
          },
        },

        {
          id: "l2",
          title: "mypy にかける",
          goal: "書いた型ヒントを mypy に読ませ、エラーの読み方を覚える",
          packages: ["mypy"],
          body: `
型ヒントを読んで、食い違いを教えてくれる道具が **mypy** です。

手元では、こう使います。

~~~
pip install mypy
mypy shop.py
~~~

このアプリはエディタが 1 枚しかないので、**いま書いているコードをそのままファイルとして mypy にかける** ヘルパーを用意しました。

~~~
run_mypy()            # 型チェックして、見つかったものを表示する
run_mypy("--strict")  # 引数はそのまま mypy へ渡る
~~~

コードの末尾に \`run_mypy()\` と書いて実行してください。手元で \`mypy ファイル名\` を叩いたのと同じことが起きます。

### 出力の読み方

~~~
lesson.py:5: error: Argument 1 to "greet" has incompatible type "int"; expected "str"  [arg-type]
Found 1 error in 1 file (checked 1 source file)
~~~

| 部分 | 意味 |
|---|---|
| \`lesson.py:5\` | ファイルと**行番号**。エディタの行と一致します |
| \`error:\` | 深刻度。\`note:\` は補足の説明 |
| 本文 | 何と何が食い違ったか（「\`str\` を期待したのに \`int\` が来た」） |
| \`[arg-type]\` | **エラーコード**。検索するとき、無視するときに使う |

問題が無ければ \`Success: no issues found in 1 source file\` と出ます。

### よく出るエラーコード

| コード | いつ出るか |
|---|---|
| \`arg-type\` | 引数の型が合っていない |
| \`return-value\` | 戻り値の型が宣言と違う |
| \`assignment\` | 変数に、宣言と違う型を入れた |
| \`attr-defined\` | その型には無い属性・メソッドを触った |
| \`operator\` | その型どうしでは使えない演算をした（\`str + int\` など） |

コードが分かると調べやすくなります。メッセージ全文ではなく、まずコードで検索してください。

> mypy は**実行しません**。コードを読んで矛盾を探すだけなので、時間のかかる処理やネットワークにつながる処理が入っていても、待たされることはありません。

### もっと詳しく

型チェッカは mypy だけではありません。Microsoft の **pyright**（VS Code の Pylance の中身）は Node.js で動き、エディタ上での速さに強みがあります。同じコードでも指摘が微妙に違うことがあるので、チームでは**どれを使うかを決めて設定ファイルに残す**のが定石です。

エラーメッセージの意味が分からないときは、mypy 公式の「よくあるエラー」の一覧が近道です。コード（\`[arg-type]\` など）から引けます。

- [mypy 公式ドキュメント（英語）](https://mypy.readthedocs.io/en/stable/)
- [mypy のエラーコード一覧（英語）](https://mypy.readthedocs.io/en/stable/error_code_list.html)
- [pyright（英語）](https://microsoft.github.io/pyright/)
`,
          examples: [
            {
              caption: "問題のないコードを mypy にかける",
              note: "`Success` と出れば、mypy が見た範囲では食い違いがありません。",
              code: `
def greet(name: str) -> str:
    return "こんにちは、" + name


print(greet("山田"))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "型が食い違っているコードを mypy にかける",
              note: "実行そのものは通ってしまいます。**行番号とエラーコード**を確かめてください。",
              code: `
def double(n: int) -> int:
    return n * 2


print(double("あ"))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "いろいろなエラーコードを一度に見る",
              note: "`show` は **一度も呼んでいません**。実行しても何も起きませんが、mypy はコードを読むので中身の間違いを見つけます。",
              code: `
def price_of(name: str) -> int:
    return "100"


def show(name: str) -> None:
    print(name.uppercase())


total: int = "500"

print("実行そのものは最後まで通る")

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
下のコードには**型の食い違いが 2 か所**あります。mypy が何も言わなくなるまで直してください。

| 関数 | 仕様 |
|---|---|
| \`tax_included(price)\` | 税込価格（10%）を**整数**で返す。1 円未満は切り捨て |
| \`summary(items)\` | \`["A", "B"]\` → \`"A, B の 2 件"\` |

- 戻り値の型は変えずに、**中身のほうを仕様に合わせて**直してください
- 直したら \`run_mypy()\` で確かめられます

> 採点では mypy を通し、そのうえで関数が仕様どおり動くかを見ます。\`# type: ignore\` で黙らせた回答は通りません。
`,
            starter: `
def tax_included(price: int) -> int:
    return price * 1.1


def summary(items: list[str]) -> str:
    return ", ".join(items) + " の " + len(items) + " 件"


print(tax_included(100))
print(summary(["りんご", "みかん"]))

run_mypy()
`,
            tests: `
g = globals()
tax = g.get("tax_included")
summ = g.get("summary")

check(callable(tax), "tax_included がある")
check(callable(summ), "summary がある")

if callable(tax):
    got = tax(100)
    check(got == 110, "tax_included(100) が 110（今は {!r}）".format(got))
    check(tax(255) == 280, "tax_included(255) が 280（1 円未満は切り捨て。今は {!r}）".format(tax(255)))
    check(isinstance(tax(999), int), "tax_included(999) が整数（今は {!r}）".format(tax(999)))

if callable(summ):
    got = summ(["A", "B"])
    check(got == "A, B の 2 件", "summary(['A', 'B']) が 'A, B の 2 件'（今は {!r}）".format(got))
    got = summ(["りんご"])
    check(got == "りんご の 1 件", "1 件でも同じ形になる（今は {!r}）".format(got))

check("type: ignore" not in _source(), "# type: ignore で黙らせていない")

report = run_mypy(quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))
`,
            hint: [
              "エラーメッセージの行番号を頼りに、まず「何が期待され、何が来ているのか」を読みます。2 か所とも、宣言した戻り値の型と、実際に作られる値の型が食い違っています。",
              "税込のほうは、小数のかけ算をした時点で結果が小数になります。整数にそろえる方法は複数あり、四捨五入と切り捨てでは 1 円ずれることがあります（仕様は切り捨てです）。",
              "件数のほうは、文字列と数値をそのまま `+` でつなげません。数を文字列にするか、文字列の中に値を差し込む書き方に変えます。",
            ],
            solution: `def tax_included(price: int) -> int:
    """税込価格（10%）を整数で返す。1 円未満は切り捨て。"""
    return price * 11 // 10


def summary(items: list[str]) -> str:
    """項目を並べて件数を添える。"""
    return f"{', '.join(items)} の {len(items)} 件"


print(tax_included(100))
print(summary(["りんご", "みかん"]))

run_mypy()`,
            rejects: [
              {
                caption: "型エラーを type: ignore で黙らせただけ",
                code: `def tax_included(price: int) -> int:
    return price * 1.1  # type: ignore[return-value]


def summary(items: list[str]) -> str:
    return ", ".join(items) + " の " + str(len(items)) + " 件"


print(tax_included(100))
print(summary(["りんご", "みかん"]))`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l3",
          title: "コレクションの型",
          goal: "リスト・辞書・タプルの「中身の型」まで書けるようにする",
          packages: ["mypy"],
          body: `
\`list\` とだけ書いても間違いではありませんが、それでは**中身が何なのか**が分かりません。角かっこで中身の型を書きます。

| 書き方 | 意味 |
|---|---|
| \`list[int]\` | 整数のリスト |
| \`dict[str, int]\` | キーが文字列・値が整数の辞書 |
| \`tuple[str, int]\` | 文字列と整数の **2 要素** タプル（順番も決まっている） |
| \`tuple[int, ...]\` | 整数がいくつでも並ぶタプル |
| \`set[str]\` | 文字列の集合 |

中身まで書いてあると、mypy は要素を触ったところまで追いかけられます。

~~~
prices: dict[str, int] = {"りんご": 100}

print(prices["りんご"] + 1)      # OK
print(prices["りんご"].upper())  # error: "int" has no attribute "upper"  [attr-defined]
~~~

\`list\` としか書いていなければ、この \`.upper()\` は見逃されます。**型を書く細かさが、そのまま見つかるバグの量になります。**

### 入れ子にできる

~~~
rows: list[tuple[str, int]] = [("りんご", 100), ("みかん", 80)]
by_shop: dict[str, list[int]] = {"新宿": [100, 200]}
~~~

データ分析・自動化コースで扱った「CSV を読んで集計する」形は、たいていこの入れ子で書けます。

### 引数は「広く」、戻り値は「狭く」

引数に \`list[str]\` と書くと、呼ぶ側はリストしか渡せません。中身を順に見るだけなら、\`Iterable[str]\` や \`Sequence[str]\` と書くほうが、タプルでもジェネレータでも受け取れて親切です。

~~~
from collections.abc import Iterable


def join_names(names: Iterable[str]) -> str:
    return "、".join(names)
~~~

逆に**戻り値はできるだけ具体的に**書きます。受け取った側が何をできるか分かるからです。

> \`Iterable\` や \`Sequence\` は \`collections.abc\` にあります。\`typing.List\` のような大文字の別名は古い書き方で、いまは \`list[int]\` と小文字で書きます。

### もっと詳しく

読み取り専用のつもりで渡した \`list\` を、呼ばれた側で書き換えられると困ることがあります。\`Sequence[str]\` と書いておくと \`append\` が型エラーになるので、「この関数は中身を変えない」という約束を**型で**示せます。辞書なら \`Mapping\`、集合なら \`AbstractSet\` が同じ役目です。

なお \`list[str]\` は \`list[object]\` の代わりには使えません（不変・invariant）。この性質は最初は不思議に見えますが、「片方で入れた値がもう片方から見ると型違いになる」事故を防ぐためのものです。

- [collections.abc --- コレクションの抽象基底クラス（公式）](https://docs.python.org/ja/3/library/collections.abc.html)
- [ジェネリック型としての標準コレクション（公式）](https://docs.python.org/ja/3/library/typing.html#generic-concrete-collections)
- [mypy: 共変・反変の話（英語）](https://mypy.readthedocs.io/en/stable/generics.html#variance-of-generic-types)
`,
          examples: [
            {
              caption: "中身の型まで書くと、要素を触ったところまで見てくれる",
              note: "`shout` は呼んでいないので実行時には何も起きません。それでも mypy は「`int` に `.upper()` は無い」と気づきます。",
              code: `
prices: dict[str, int] = {"りんご": 100, "みかん": 80}


def shout() -> None:
    print(prices["りんご"].upper())


for name, price in prices.items():
    print(name, price + 10)

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "中身を書かないと見逃される",
              note: "同じ間違いでも、`dict` としか書いていないと mypy は何も言いません。",
              code: `
prices: dict = {"りんご": 100, "みかん": 80}


def shout() -> None:
    print(prices["りんご"].upper())


print(prices["りんご"])

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "入れ子と、広く受け取る書き方",
              code: `
from collections.abc import Iterable

rows: list[tuple[str, int]] = [("新宿", 100), ("渋谷", 80), ("新宿", 20)]


def join_names(names: Iterable[str]) -> str:
    return "、".join(names)


print(join_names(name for name, _ in rows))
print(join_names(("A", "B")))

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
店舗ごとの売上を合計する関数 \`total_by_shop\` を、**中身の型まで書いて**実装してください。

| 呼び出し | 返る値 |
|---|---|
| \`total_by_shop([("新宿", 100), ("渋谷", 80), ("新宿", 20)])\` | \`{"新宿": 120, "渋谷": 80}\` |
| \`total_by_shop([])\` | \`{}\` |

- 引数は「（店舗名, 金額）のタプル」のリストです
- 戻り値は「店舗名 → 合計金額」の辞書です
- 出てきた順は問いません（採点では辞書として比べます）

> 採点では \`mypy --disallow-untyped-defs\`（注釈の無い関数を見逃さない設定）を通します。さらに、**あなたの書いた型が誤った使い方を捕まえられるか**も見ます。金額の側を文字列として扱うコードを後ろに足して、mypy がそれを指摘できるかを確かめます。
`,
            starter: `
def total_by_shop(rows):
    return {}


print(total_by_shop([("新宿", 100), ("渋谷", 80), ("新宿", 20)]))
`,
            tests: `
g = globals()
f = g.get("total_by_shop")

check(callable(f), "total_by_shop という関数を定義できている")

if callable(f):
    got = f([("新宿", 100), ("渋谷", 80), ("新宿", 20)])
    check(got == {"新宿": 120, "渋谷": 80}, "同じ店舗をまとめて合計できる（今は {!r}）".format(got))
    check(f([]) == {}, "空のリストなら空の辞書")
    got = f([("A", 5)])
    check(got == {"A": 5}, "1 件だけでも動く（今は {!r}）".format(got))

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

# 型を「書いたこと」ではなく「効いていること」を見る。
# 合計を文字列として扱うコードを足して、そこを捕まえられるか。
PROBE = "\\n\\nfor shop, total in total_by_shop([('A', 1)]).items():\\n    print(total.upper())\\n"
probe = run_mypy(source=_source() + PROBE, quiet=True)
check(
    probe.find(code="attr-defined") != [],
    "合計が整数だと分かる型になっている（緩い型だと、数に .upper() を呼んでも気づけない）",
)

PROBE2 = "\\n\\ntotal_by_shop([('A', '100')])\\n"
probe2 = run_mypy(source=_source() + PROBE2, quiet=True)
check(
    probe2.find(code="arg-type") != [] or probe2.find(code="list-item") != [],
    "金額に文字列を渡すと mypy が指摘する型になっている",
)
`,
            hint: [
              "先に「引数は何のリストで、1 件は何と何の組か」「戻り値は何をキーにして、値は何か」を日本語で言い切ってから、それを角かっこの記法に置き換えます。",
              "中身を省いた list や dict は書けてしまいますが、それだと採点の後半（誤った使い方を捕まえられるか）が通りません。要素の型まで書いてください。",
              "集計そのものは、辞書に「まだ無ければ 0 から」足していく形です。辞書のメソッドに、キーが無いときの既定値を返すものがあります。",
            ],
            solution: `def total_by_shop(rows: list[tuple[str, int]]) -> dict[str, int]:
    """（店舗名, 金額）の一覧を、店舗ごとの合計にまとめる。"""
    totals: dict[str, int] = {}
    for shop, amount in rows:
        totals[shop] = totals.get(shop, 0) + amount
    return totals


print(total_by_shop([("新宿", 100), ("渋谷", 80), ("新宿", 20)]))
print(total_by_shop([]))`,
            rejects: [
              {
                caption: "動きはするが、型が緩くて誤用を捕まえられない",
                code: `def total_by_shop(rows: list) -> dict:
    totals = {}
    for shop, amount in rows:
        totals[shop] = totals.get(shop, 0) + amount
    return totals


print(total_by_shop([("新宿", 100), ("渋谷", 80), ("新宿", 20)]))`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l4",
          title: "「値が無いかもしれない」を型にする",
          goal: "X | None を書き、使う前に絞り込む形を身につける",
          packages: ["mypy"],
          body: `
「見つからなければ \`None\`」を返す関数はよく書きます。この「かもしれない」を型で表すのが \`|\` です。

~~~
def find_price(name: str) -> int | None:
    prices = {"りんご": 100, "みかん": 80}
    return prices.get(name)
~~~

\`int | None\` は「整数か、\`None\` のどちらか」という意味です。古い書き方の \`Optional[int]\` と同じものですが、いまは \`|\` を使います。

### 型を書くと、使い方の抜けが見つかる

~~~
price = find_price("りんご")
print(price + 10)
# error: Unsupported operand types for + ("None" and "int")  [operator]
~~~

**これがこのレッスンの本題です。** 実行すると、たまたま \`"りんご"\` が見つかるので動いてしまいます。落ちるのは、見つからない名前を渡した日——つまり本番です。mypy は「\`None\` のときにどうするのか書いていない」ことを、動かす前に指摘します。

### 絞り込む（narrowing）

\`if\` で \`None\` を除けば、その先では \`int\` として扱えます。

~~~
price = find_price("りんご")
if price is None:
    print("その商品はありません")
else:
    print(price + 10)
~~~

mypy は \`if\` の分岐を追いかけて、\`else\` の中では \`price\` が \`int\` だと判断します。これを**型の絞り込み**と呼びます。

早めに返してしまう形も同じです。

~~~
def show(name: str) -> None:
    price = find_price(name)
    if price is None:
        return
    print(price + 10)   # ここでは int
~~~

| 書き方 | mypy から見ると |
|---|---|
| \`if x is None: return\` | その後ろは \`None\` ではない |
| \`if x is not None:\` の中 | \`None\` ではない |
| \`if x:\` の中 | \`None\` ではない。ただし \`0\` や \`""\` も一緒に弾かれる |

3 番目は要注意です。\`0\` を「無い」と同じ扱いにしてしまう間違いは、型では見つけられません。

### 戻り値が None の関数

何も返さない関数には \`-> None\` と書きます。書かないと mypy は「注釈の無い関数」とみなし、中身をほとんど見てくれません。

### もっと詳しく

\`None\` を返す代わりに**例外を送出する**設計もあります。「見つからないのは異常事態か、ふつうに起こることか」で選びます。ふつうに起こるなら \`None\`、呼び出し側が必ず対処すべき異常なら例外のほうが、読み手に意図が伝わります。

\`dict.get()\` は第 2 引数で既定値を渡せるので、\`prices.get(name, 0)\` と書けば戻り値は \`int\` になり、\`None\` の分岐そのものが要らなくなります。**型を減らせるなら、減らすのがいちばん簡単な解決**です。

- [None（公式）](https://docs.python.org/ja/3/library/constants.html#None)
- [typing.Optional（公式）](https://docs.python.org/ja/3/library/typing.html#typing.Optional)
- [mypy: 型の絞り込み（英語）](https://mypy.readthedocs.io/en/stable/type_narrowing.html)
`,
          examples: [
            {
              caption: "None かもしれない値を、そのまま使ってしまう",
              note: "実行は通ります。mypy だけが「`None` のときの話が抜けている」と言います。",
              code: `
def find_price(name: str) -> int | None:
    prices = {"りんご": 100, "みかん": 80}
    return prices.get(name)


price = find_price("りんご")
print(price + 10)

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "見つからない名前を渡すと、実際に落ちる",
              note: "mypy が指摘していたのは、この事故のことです。",
              raises: true,
              code: `
def find_price(name: str) -> int | None:
    prices = {"りんご": 100, "みかん": 80}
    return prices.get(name)


price = find_price("ぶどう")
print(price + 10)
`,
            },
            {
              caption: "絞り込んでから使う",
              code: `
def find_price(name: str) -> int | None:
    prices = {"りんご": 100, "みかん": 80}
    return prices.get(name)


def show(name: str) -> None:
    price = find_price(name)
    if price is None:
        print(name + " は取り扱っていません")
        return
    print(name + " は税込 " + str(price * 11 // 10) + " 円")


show("りんご")
show("ぶどう")

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
在庫表から商品を探す関数と、それを使う関数を書いてください。

| 関数 | 仕様 |
|---|---|
| \`find_stock(name)\` | \`STOCK\` にあれば在庫数、無ければ \`None\` を返す |
| \`describe(name)\` | 在庫があれば \`"りんご: 残り 3 個"\`、無ければ \`"りんご: 取り扱いなし"\` を返す |

\`STOCK\` は用意してあります（\`{"りんご": 3, "みかん": 0}\`）。

- \`find_stock\` の戻り値は「整数か \`None\`」であることを型で表してください
- \`describe\` は \`find_stock\` を呼び、**\`None\` の場合を絞り込んでから**使ってください
- 在庫が \`0\` のときは「残り 0 個」です（取り扱いなしではありません）

> 採点では \`mypy --disallow-untyped-defs\` を通します。加えて、\`find_stock\` の戻り値をそのまま計算に使うコードを後ろに足し、mypy がそれを指摘できるか（＝\`None\` の可能性が型に残っているか）を見ます。
`,
            starter: `
STOCK = {"りんご": 3, "みかん": 0}


def find_stock(name):
    return STOCK.get(name)


def describe(name):
    return ""


print(describe("りんご"))
print(describe("みかん"))
print(describe("ぶどう"))
`,
            tests: `
g = globals()
find = g.get("find_stock")
describe = g.get("describe")

check(callable(find), "find_stock という関数を定義できている")
check(callable(describe), "describe という関数を定義できている")

if callable(find):
    check(find("りんご") == 3, "find_stock('りんご') が 3（今は {!r}）".format(find("りんご")))
    check(find("みかん") == 0, "find_stock('みかん') が 0（今は {!r}）".format(find("みかん")))
    check(find("ぶどう") is None, "find_stock('ぶどう') が None（今は {!r}）".format(find("ぶどう")))

if callable(describe):
    got = describe("りんご")
    check(got == "りんご: 残り 3 個", "在庫があるときの文言（今は {!r}）".format(got))
    got = describe("みかん")
    check(got == "みかん: 残り 0 個", "在庫 0 は「取り扱いなし」ではない（今は {!r}）".format(got))
    got = describe("ぶどう")
    check(got == "ぶどう: 取り扱いなし", "在庫が無いときの文言（今は {!r}）".format(got))

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

# find_stock の戻り値に None の可能性が残っているか。
# 残っていれば、絞り込まずに計算するコードは mypy に捕まる。
PROBE = "\\n\\nprint(find_stock('りんご') + 1)\\n"
probe = run_mypy(source=_source() + PROBE, quiet=True)
check(
    probe.find(code="operator") != [],
    "find_stock の戻り値に「None かもしれない」が型として残っている",
)
`,
            hint: [
              "2 つの関数で役割が分かれています。探すほうは「見つからなかった」をどう表すか、使うほうは「見つからなかった場合」をどこで処理するかが問われています。",
              "在庫 0 と「取り扱いなし」は別物です。`if not count:` のような書き方だと、0 が「無い」側に落ちてしまいます。`None` かどうかだけを見る比較を使ってください。",
              "絞り込みは、早めに返してしまう形でも `else` を使う形でも構いません。どちらでも、その先では整数として扱えることを mypy が理解します。",
            ],
            solution: `STOCK = {"りんご": 3, "みかん": 0}


def find_stock(name: str) -> int | None:
    """在庫数を返す。取り扱いが無ければ None。"""
    return STOCK.get(name)


def describe(name: str) -> str:
    """在庫の状況を 1 行の文にする。"""
    count = find_stock(name)
    if count is None:
        return f"{name}: 取り扱いなし"
    return f"{name}: 残り {count} 個"


print(describe("りんご"))
print(describe("みかん"))
print(describe("ぶどう"))`,
            rejects: [
              {
                caption: "在庫 0 を「取り扱いなし」にしてしまっている",
                code: `STOCK = {"りんご": 3, "みかん": 0}


def find_stock(name: str) -> int | None:
    return STOCK.get(name)


def describe(name: str) -> str:
    count = find_stock(name)
    if not count:
        return f"{name}: 取り扱いなし"
    return f"{name}: 残り {count} 個"


print(describe("りんご"))`,
              },
            ],
            packages: ["mypy"],
          },
        },
      ],
    },

    /* ================= 第2章 ================= */
    {
      id: "ch2",
      title: "第2章　型で設計する",
      lessons: [
        {
          id: "l5",
          title: "関数の型を細かく書く",
          goal: "デフォルト引数・可変長引数・「関数を受け取る関数」に型を付ける",
          packages: ["mypy"],
          body: `
関数の型は、引数と戻り値を書くだけでは足りない場面があります。

### デフォルト引数

型は名前のすぐ後ろ、既定値はその後ろです。

~~~
def greet(name: str, prefix: str = "こんにちは") -> str:
    return prefix + "、" + name
~~~

\`prefix: str = "こんにちは"\` の順番を間違えやすいので、\`名前: 型 = 既定値\` と覚えてください。

### 可変長引数

~~~
def total(*prices: int, discount: int = 0) -> int:
    return sum(prices) - discount
~~~

\`*prices: int\` は「**1 つ 1 つが** \`int\`」という意味です。関数の中では \`prices\` は \`tuple[int, ...]\` になります。\`**options: str\` も同じで、中では \`dict[str, str]\` です。

### 関数を受け取る関数

「あとで呼ぶための関数」を引数に取るときは \`Callable\` を使います。

~~~
from collections.abc import Callable


def apply_all(items: list[int], func: Callable[[int], int]) -> list[int]:
    return [func(item) for item in items]
~~~

\`Callable[[int], int]\` の読み方は、**\`[引数の型のリスト]\` と \`戻り値の型\`** です。

| 書き方 | 意味 |
|---|---|
| \`Callable[[int], int]\` | 整数を 1 つ受け取り、整数を返す |
| \`Callable[[str, int], None]\` | 文字列と整数を受け取り、何も返さない |
| \`Callable[[], str]\` | 引数なしで、文字列を返す |

これを書いておくと、\`apply_all(prices, str.upper)\` のような取り違えを mypy が止めてくれます。**関数を渡す設計は、型を書いていないと事故が読み取れません。**

### 何も返さない関数

\`-> None\` を忘れると、mypy はその関数を「注釈が無い関数」と見なし、中身をほとんど検査しません。**戻り値が無いことこそ明記する**、と覚えておいてください。

### もっと詳しく

\`Callable\` は「呼べること」しか表せず、引数の名前やキーワード専用引数までは表現できません。そこまで固めたいときは、次の章で出てくる \`Protocol\` に \`__call__\` を定義する方法があります。

引数の個数だけ違う関数をまとめて受け取りたい場合は \`Callable[..., int]\`（引数は問わない）と書けますが、これは検査をあきらめる書き方です。使うなら「なぜ固定できないのか」をコメントに残しておくと、あとで読む人が迷いません。

- [collections.abc.Callable（公式）](https://docs.python.org/ja/3/library/collections.abc.html#collections.abc.Callable)
- [mypy: 関数の型（英語）](https://mypy.readthedocs.io/en/stable/kinds_of_types.html#callable-types-and-lambdas)
`,
          examples: [
            {
              caption: "デフォルト引数と可変長引数",
              code: `
def greet(name: str, prefix: str = "こんにちは") -> str:
    return prefix + "、" + name


def total(*prices: int, discount: int = 0) -> int:
    return sum(prices) - discount


print(greet("山田"))
print(greet("佐藤", "はじめまして"))
print(total(100, 200, 300))
print(total(100, 200, discount=50))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "関数を受け取る関数",
              code: `
from collections.abc import Callable


def apply_all(items: list[int], func: Callable[[int], int]) -> list[int]:
    return [func(item) for item in items]


def double(n: int) -> int:
    return n * 2


print(apply_all([1, 2, 3], double))
print(apply_all([1, 2, 3], lambda n: n + 100))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "渡す関数が合っていないと、動かす前に分かる",
              note: "`str.upper` は文字列を受け取る関数です。整数を渡す `apply_all` には合いません。",
              code: `
from collections.abc import Callable


def apply_all(items: list[int], func: Callable[[int], int]) -> list[int]:
    return [func(item) for item in items]


def describe(n: int) -> str:
    return str(n) + " 円"


def use() -> None:
    print(apply_all([1, 2, 3], describe))


print("mypy の指摘だけを見ます（use() は呼びません）")

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
価格のリストに「値引きのルール」を適用する関数 \`apply_rule\` を書いてください。

| 引数 | 意味 |
|---|---|
| \`prices\` | 価格（整数）のリスト |
| \`rule\` | 価格を 1 つ受け取り、値引き後の価格（整数）を返す**関数** |
| \`minimum\` | 下限。適用後にこれを下回ったら、この値にそろえる。**既定は 0** |

| 呼び出し | 返る値 |
|---|---|
| \`apply_rule([100, 200], half)\` | \`[50, 100]\` |
| \`apply_rule([100, 200], half, 80)\` | \`[80, 100]\` |
| \`apply_rule([], half)\` | \`[]\` |

\`half\` は「半額にする関数」の例です（採点側で用意します）。

> 採点では \`mypy --disallow-untyped-defs\` を通します。加えて、**戻り値が整数でない関数を渡すコード**を後ろに足し、mypy がそれを指摘できるかを見ます。\`rule\` の型を \`Callable\` の中身まで書いていないと、そこで落ちます。
`,
            starter: `
from collections.abc import Callable


def apply_rule(prices, rule, minimum=0):
    return []


def half(price: int) -> int:
    return price // 2


print(apply_rule([100, 200], half))
`,
            tests: `
g = globals()
f = g.get("apply_rule")

check(callable(f), "apply_rule という関数を定義できている")


def _half(price):
    return price // 2


if callable(f):
    got = f([100, 200], _half)
    check(got == [50, 100], "ルールを全部の価格に適用できる（今は {!r}）".format(got))
    got = f([100, 200], _half, 80)
    check(got == [80, 100], "下限を下回ったら下限にそろえる（今は {!r}）".format(got))
    got = f([], _half)
    check(got == [], "空のリストなら空のリスト（今は {!r}）".format(got))
    got = f([100], _half)
    check(got == [50], "minimum を省くと既定の 0 が使われる（今は {!r}）".format(got))

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

# rule の型が「整数を受け取り整数を返す関数」になっているか。
# なっていれば、文字列を返す関数を渡したところで捕まる。
PROBE = (
    "\\n\\ndef as_text(price: int) -> str:\\n    return str(price)\\n\\n\\n"
    "apply_rule([100], as_text)\\n"
)
probe = run_mypy(source=_source() + PROBE, quiet=True)
check(
    probe.find(code="arg-type") != [],
    "rule の型が Callable の中身まで書けている（文字列を返す関数を渡すと指摘される）",
)
`,
            hint: [
              "3 つの引数それぞれに型が要ります。いちばん考えるところは 2 つめで、「価格を受け取って価格を返す関数」をどう書くかです。",
              "既定値のある引数は、型と既定値を両方書きます。順番は「名前 : 型 = 既定値」です。",
              "下限の処理は、適用後の値と下限のうち大きいほうを取れば 1 行で書けます。組み込み関数にそのものがあります。",
            ],
            solution: `from collections.abc import Callable


def apply_rule(
    prices: list[int], rule: Callable[[int], int], minimum: int = 0
) -> list[int]:
    """各価格にルールを適用し、下限を下回らないようにそろえる。"""
    return [max(rule(price), minimum) for price in prices]


def half(price: int) -> int:
    return price // 2


print(apply_rule([100, 200], half))
print(apply_rule([100, 200], half, 80))
print(apply_rule([], half))`,
            rejects: [
              {
                caption: "動きはするが、rule の型が Callable としか書かれていない",
                code: `from collections.abc import Callable


def apply_rule(prices: list[int], rule: Callable, minimum: int = 0) -> list[int]:
    return [max(rule(price), minimum) for price in prices]


def half(price: int) -> int:
    return price // 2


print(apply_rule([100, 200], half))`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l6",
          title: "データの形を型にする",
          goal: "dataclass と TypedDict で「このデータには何が入っているか」を型で書く",
          packages: ["mypy"],
          body: `
辞書でデータを持ち回ると、キーの打ち間違いに気づけません。

~~~
item = {"name": "りんご", "price": 100}
print(item["prise"])     # 実行するまで分からない
~~~

型で形を決めておけば、動かす前に分かります。方法は 2 つです。

### dataclass — 新しく作るデータはこちら

~~~
from dataclasses import dataclass


@dataclass
class Item:
    name: str
    price: int
    tags: list[str]
~~~

これだけで \`__init__\` も \`__repr__\` も \`==\` も付いてきます。

~~~
item = Item("りんご", 100, ["果物"])
print(item.price)      # 100
print(item.prise)      # error: "Item" has no attribute "prise"  [attr-defined]
~~~

属性は \`.\` で触るので、**mypy が名前と型の両方を見ます**。辞書のキーより間違いに強い書き方です。

\`@dataclass(frozen=True)\` にすると、あとから書き換えられないデータになります。集計の途中で値がすり替わる事故を防げます。

### TypedDict — もう辞書として存在しているデータはこちら

JSON を読み込んだ結果のように、**すでに辞書として手元にあるもの**の形を表します。

~~~
from typing import TypedDict


class ItemDict(TypedDict):
    name: str
    price: int


data: ItemDict = {"name": "りんご", "price": 100}
print(data["prise"])   # error: TypedDict "ItemDict" has no key "prise"  [typeddict-item]
~~~

実行時はただの \`dict\` のままなので、既存のコードに後から足しやすいのが利点です。

| | dataclass | TypedDict |
|---|---|---|
| 実体 | クラスのインスタンス | ただの辞書 |
| アクセス | \`item.price\` | \`item["price"]\` |
| 向いている場面 | 自分のコードの中で作るデータ | 外から来た JSON・CSV の行 |
| メソッドを足せる | できる | できない |

新しく設計するなら dataclass、外から来た辞書をそのまま扱うなら TypedDict、と考えると迷いません。

### もっと詳しく

入力の検証（「price が負なら弾く」など）まで実行時にやりたいなら、**Pydantic** のような外部ライブラリが向いています。FastAPI がリクエストの検証に使っているのがこれです。dataclass は「形をそろえる」ところまでで、値の妥当性までは見ません。

標準ライブラリの \`typing.NamedTuple\` も似た用途に使えます。タプルとしても振る舞うため、既存のタプルを返している関数に、後から名前を付けたいときに便利です。

- [dataclasses（公式）](https://docs.python.org/ja/3/library/dataclasses.html)
- [typing.TypedDict（公式）](https://docs.python.org/ja/3/library/typing.html#typing.TypedDict)
- [typing.NamedTuple（公式）](https://docs.python.org/ja/3/library/typing.html#typing.NamedTuple)
`,
          examples: [
            {
              caption: "dataclass でデータの形を決める",
              code: `
from dataclasses import dataclass


@dataclass
class Item:
    name: str
    price: int
    tags: list[str]


items = [Item("りんご", 100, ["果物"]), Item("牛乳", 200, ["飲料", "冷蔵"])]

for item in items:
    print(item.name, item.price, item.tags)

print(items[0])
print(Item("りんご", 100, ["果物"]) == items[0])

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "打ち間違いと型違いを、動かす前に見つける",
              note: "`report` は呼んでいません。mypy の指摘だけを見ます。",
              code: `
from dataclasses import dataclass


@dataclass
class Item:
    name: str
    price: int


def report(item: Item) -> None:
    print(item.prise)


bad = Item("りんご", "100")

print("実行は最後まで通ってしまう:", bad)

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "TypedDict で、辞書のまま形を決める",
              code: `
from typing import TypedDict


class ItemDict(TypedDict):
    name: str
    price: int


def total(rows: list[ItemDict]) -> int:
    return sum(row["price"] for row in rows)


rows: list[ItemDict] = [
    {"name": "りんご", "price": 100},
    {"name": "牛乳", "price": 200},
]

print(total(rows))
print(rows[0]["name"])

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
商品を表す dataclass \`Item\` と、集計する関数 \`expensive\` を作ってください。

**\`Item\` が持つもの**

| 属性 | 型 |
|---|---|
| \`name\` | 文字列 |
| \`price\` | 整数 |
| \`tags\` | 文字列のリスト |

**\`expensive(items, limit)\`**

価格が \`limit\` **以上**の商品の名前を、元の順番のままリストで返します。

| 呼び出し | 返る値 |
|---|---|
| \`expensive([りんご100, 牛乳200], 150)\` | \`["牛乳"]\` |
| \`expensive([], 100)\` | \`[]\` |

> 採点では \`mypy --disallow-untyped-defs\` を通します。加えて、\`Item("x", "100", [])\` のように**型の違う値で作るコード**を後ろに足し、mypy がそれを指摘できるかを見ます。
`,
            starter: `
from dataclasses import dataclass


@dataclass
class Item:
    pass


def expensive(items, limit):
    return []


print(expensive([Item(), Item()], 150))
`,
            tests: `
g = globals()
Item = g.get("Item")
f = g.get("expensive")

check(Item is not None and isinstance(Item, type), "Item というクラスを定義できている")
check(callable(f), "expensive という関数を定義できている")

made = None
if isinstance(Item, type):
    try:
        made = Item("りんご", 100, ["果物"])
    except Exception as e:
        made = None
    check(made is not None, "Item('りんご', 100, ['果物']) の形で作れる")

if made is not None:
    check(getattr(made, "name", None) == "りんご", "name を属性として取り出せる")
    check(getattr(made, "price", None) == 100, "price を属性として取り出せる")
    check(getattr(made, "tags", None) == ["果物"], "tags を属性として取り出せる")
    check(Item("りんご", 100, ["果物"]) == made, "同じ中身どうしを == で比べられる（dataclass になっている）")

if callable(f) and made is not None:
    rows = [Item("りんご", 100, ["果物"]), Item("牛乳", 200, ["飲料"]), Item("和牛", 5000, [])]
    got = f(rows, 150)
    check(got == ["牛乳", "和牛"], "limit 以上の商品の名前を順番どおり返す（今は {!r}）".format(got))
    got = f(rows, 100)
    check(got == ["りんご", "牛乳", "和牛"], "limit と同じ額も含む（以上）（今は {!r}）".format(got))
    check(f([], 100) == [], "空なら空のリスト")

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

PROBE = "\\n\\nItem('ぶどう', '400', [])\\n"
probe = run_mypy(source=_source() + PROBE, quiet=True)
check(
    probe.find(code="arg-type") != [],
    "price に文字列を渡すと mypy が指摘する（属性に型が書けている）",
)
`,
            hint: [
              "dataclass では、クラスの中に「属性名: 型」を並べるだけで `__init__` ができます。並べた順が、そのまま作るときの引数の順です。",
              "`expensive` の戻り値は商品そのものではなく、名前のリストです。引数の型（何のリストか）と戻り値の型（何のリストか）は別物になります。",
              "「以上」と「より大きい」は 1 件ぶんの差になります。境界の値（limit と同じ額）で確かめてください。",
            ],
            solution: `from dataclasses import dataclass


@dataclass
class Item:
    """商品 1 件。"""

    name: str
    price: int
    tags: list[str]


def expensive(items: list[Item], limit: int) -> list[str]:
    """limit 以上の商品の名前を返す。"""
    return [item.name for item in items if item.price >= limit]


items = [Item("りんご", 100, ["果物"]), Item("牛乳", 200, ["飲料"])]
print(expensive(items, 150))
print(expensive([], 100))`,
            rejects: [
              {
                caption: "属性に型を書かず、辞書のように扱っている",
                code: `class Item:
    def __init__(self, name, price, tags):
        self.name = name
        self.price = price
        self.tags = tags

    def __eq__(self, other):
        return (self.name, self.price, self.tags) == (other.name, other.price, other.tags)


def expensive(items: list, limit: int) -> list:
    return [item.name for item in items if item.price >= limit]


print(expensive([Item("りんご", 100, [])], 50))`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l7",
          title: "決まった値だけを許す",
          goal: "Literal と Enum で「取りうる値」を型にして、想定外の文字列を弾く",
          packages: ["mypy"],
          body: `
文字列で選択肢を受け取る関数はよくあります。

~~~
def sort_names(names: list[str], order: str) -> list[str]:
    ...


sort_names(names, "asec")   # 打ち間違い。実行するまで気づけない
~~~

\`str\` と書いてしまうと、**どんな文字列でも通ります**。取りうる値が決まっているなら、そう書けます。

### Literal

~~~
from typing import Literal


def sort_names(names: list[str], order: Literal["asc", "desc"]) -> list[str]:
    return sorted(names, reverse=(order == "desc"))
~~~

これで \`"asec"\` は \`arg-type\` エラーになります。**候補がその場に書いてある**ので、読む人にも分かりやすくなります。

### Enum

選択肢に名前を付けて持ち回りたいときは \`Enum\` です。

~~~
from enum import Enum


class Order(Enum):
    ASC = "asc"
    DESC = "desc"


def sort_names(names: list[str], order: Order) -> list[str]:
    return sorted(names, reverse=(order is Order.DESC))


sort_names(names, Order.DESC)
~~~

| | Literal | Enum |
|---|---|---|
| 呼ぶ側の書き方 | \`"desc"\` とそのまま書く | \`Order.DESC\` と書く |
| 値の一覧を実行時に取れる | 取りにくい | \`list(Order)\` で取れる |
| 向いている場面 | 小さな関数の引数、JSON の値 | アプリ全体で使う区分、画面に出す名前も持たせたいとき |

**どちらでもよい場面では Literal のほうが軽い**ので、まず Literal を考えて、値の一覧やメソッドが欲しくなったら Enum にする、で構いません。

### 分岐の書き漏らしも見つかる

\`Literal\` や \`Enum\` を \`if\` で分けるとき、**全部の場合を書いたか**まで mypy に確かめてもらえます。書き漏らしがあると「戻り値が \`None\` になる経路がある」と指摘されます。

~~~
def label(order: Literal["asc", "desc"]) -> str:
    if order == "asc":
        return "昇順"
    return "降順"
~~~

> \`Literal\` に並べる値は、その場で書いた定数だけです。変数や計算結果は書けません。

### もっと詳しく

「全部の場合を尽くしたか」を厳密に確かめたいときは \`typing.assert_never\` を使います。\`else\` の側に \`assert_never(order)\` と書いておくと、あとから選択肢を 1 つ増やしたときに、**対応し忘れている分岐すべてが mypy のエラーになります**。区分が増えがちなコードでは、この書き方が効きます。

\`Enum\` には \`StrEnum\`（Python 3.11 以降）という派生もあり、こちらは文字列としても振る舞うので、JSON への書き出しがそのまま通ります。

- [typing.Literal（公式）](https://docs.python.org/ja/3/library/typing.html#typing.Literal)
- [enum --- 列挙型（公式）](https://docs.python.org/ja/3/library/enum.html)
- [typing.assert_never（公式）](https://docs.python.org/ja/3/library/typing.html#typing.assert_never)
`,
          examples: [
            {
              caption: "Literal で候補を決める",
              code: `
from typing import Literal


def sort_names(names: list[str], order: Literal["asc", "desc"]) -> list[str]:
    return sorted(names, reverse=(order == "desc"))


names = ["佐藤", "山田", "鈴木"]
print(sort_names(names, "asc"))
print(sort_names(names, "desc"))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "候補にない値は、動かす前に弾かれる",
              note: "実行すると `sorted` はそのまま動いてしまい、`\"asec\"` は「降順ではない」として静かに昇順になります。",
              code: `
from typing import Literal


def sort_names(names: list[str], order: Literal["asc", "desc"]) -> list[str]:
    return sorted(names, reverse=(order == "desc"))


print(sort_names(["佐藤", "山田"], "asec"))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "Enum で名前を付ける",
              code: `
from enum import Enum


class Order(Enum):
    ASC = "asc"
    DESC = "desc"


def sort_names(names: list[str], order: Order) -> list[str]:
    return sorted(names, reverse=(order is Order.DESC))


print(sort_names(["佐藤", "山田"], Order.DESC))
print([member.value for member in Order])

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
点数のリストを並べ替えて、上位・下位を取り出す関数 \`pick\` を書いてください。

| 引数 | 意味 |
|---|---|
| \`scores\` | 点数（整数）のリスト |
| \`side\` | \`"top"\`（高い順）か \`"bottom"\`（低い順）の**どちらか** |
| \`count\` | 何件取り出すか。**既定は 3** |

| 呼び出し | 返る値 |
|---|---|
| \`pick([50, 90, 70, 60], "top")\` | \`[90, 70, 60]\` |
| \`pick([50, 90, 70, 60], "bottom", 2)\` | \`[50, 60]\` |
| \`pick([90], "top")\` | \`[90]\` |

- \`side\` は **2 つの値しか取らない**ことが型から分かるように書いてください
- 件数がリストの長さを超えたら、あるだけ返します

> 採点では \`mypy --disallow-untyped-defs\` を通します。加えて、\`pick(scores, "TOP")\` のような**候補にない値で呼ぶコード**を後ろに足し、mypy がそれを指摘できるかを見ます。
`,
            starter: `
from typing import Literal


def pick(scores, side, count=3):
    return []


print(pick([50, 90, 70, 60], "top"))
`,
            tests: `
g = globals()
f = g.get("pick")

check(callable(f), "pick という関数を定義できている")

if callable(f):
    got = f([50, 90, 70, 60], "top")
    check(got == [90, 70, 60], "top は高い順に既定の 3 件（今は {!r}）".format(got))
    got = f([50, 90, 70, 60], "bottom", 2)
    check(got == [50, 60], "bottom は低い順（今は {!r}）".format(got))
    got = f([90], "top")
    check(got == [90], "件数より短いリストでも、あるだけ返す（今は {!r}）".format(got))
    got = f([], "bottom")
    check(got == [], "空なら空のリスト（今は {!r}）".format(got))

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

PROBE = "\\n\\npick([1, 2, 3], 'TOP')\\n"
probe = run_mypy(source=_source() + PROBE, quiet=True)
check(
    probe.find(code="arg-type") != [],
    "side が 2 つの値しか取らない型になっている（'TOP' が指摘される）",
)
`,
            hint: [
              "並べ替えの向きが 2 通りあるだけで、やることは同じです。向きの違いを 1 か所（並べ替えの引数）に押し込めると短く書けます。",
              "候補が 2 つしかない引数は、`str` ではなく候補そのものを型にできます。本文の表の 1 つめの道具です。",
              "取り出す件数は、リストが短いときのことも考えます。スライスは長さを超えても落ちず、あるぶんだけ返します。",
            ],
            solution: `from typing import Literal


def pick(scores: list[int], side: Literal["top", "bottom"], count: int = 3) -> list[int]:
    """点数を上位（top）または下位（bottom）から count 件取り出す。"""
    ordered = sorted(scores, reverse=(side == "top"))
    return ordered[:count]


print(pick([50, 90, 70, 60], "top"))
print(pick([50, 90, 70, 60], "bottom", 2))
print(pick([90], "top"))`,
            rejects: [
              {
                caption: "動きはするが、side が str のままで候補を絞れていない",
                code: `def pick(scores: list[int], side: str, count: int = 3) -> list[int]:
    ordered = sorted(scores, reverse=(side == "top"))
    return ordered[:count]


print(pick([50, 90, 70, 60], "top"))`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l8",
          title: "使い回せる型（ジェネリクス）",
          goal: "受け取った型をそのまま返す関数を、型を保ったまま書く",
          packages: ["mypy"],
          body: `
「リストの最初の要素を返す」関数に型を付けてみます。

~~~
def first(items: list[int]) -> int | None:
    return items[0] if items else None
~~~

これでは整数のリストにしか使えません。かといって \`list[object]\` にすると、返ってきた値で \`.upper()\` も \`+ 1\` もできなくなります。**中身が何であっても、渡されたものと同じ型を返す**——これを書くのが型変数です。

~~~
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None
~~~

\`[T]\` は「この関数の中で使う型の名前」です。呼び出しごとに中身が決まります。

~~~
name = first(["佐藤", "山田"])   # str | None
score = first([90, 80])          # int | None
~~~

同じ 1 つの関数が、渡したものに応じて型を変えます。これが**ジェネリクス**です。

### 型が本当に保たれているか確かめる

\`reveal_type()\` を使うと、mypy が「その式をどう見ているか」を教えてくれます。

~~~
from typing import reveal_type

reveal_type(first(["佐藤"]))    # note: Revealed type is "Union[builtins.str, None]"
~~~

**デバッグ用の道具**なので、確かめ終わったら消します。\`print\` を挟んで値を見るのと同じ感覚で、型を見られると思ってください。

### クラスにも書ける

~~~
class Box[T]:
    def __init__(self, value: T) -> None:
        self.value = value

    def get(self) -> T:
        return self.value
~~~

\`Box("りんご").get()\` は \`str\`、\`Box(100).get()\` は \`int\` になります。

### 制限を付ける

「何でもよい」わけではなく「数値だけ」にしたいなら、上限を書けます。

~~~
def largest[T: (int, float)](items: list[T]) -> T:
    return max(items)
~~~

> \`def first[T](...)\` の書き方は Python 3.12 以降のものです。それより前は \`TypeVar\` を使って \`T = TypeVar("T")\` と宣言していました。古いコードで見かけたら同じものだと思ってください。

### もっと詳しく

戻り値だけに型変数が出てくる関数（\`def make[T]() -> T\`）は書けてしまいますが、呼ぶ側が型を決められないため、たいてい設計の間違いです。型変数は**引数と戻り値の関係**を表すためのもの、と覚えておくと迷いません。

複数の型をまとめて扱う \`ParamSpec\`（デコレータで引数をそのまま引き継ぐ）や \`TypeVarTuple\` もありますが、必要になるのはライブラリを書くときです。アプリケーションのコードでは、まず \`T\` 1 つで足ります。

- [型パラメータ構文（公式）](https://docs.python.org/ja/3/reference/compound_stmts.html#type-params)
- [typing.TypeVar（公式）](https://docs.python.org/ja/3/library/typing.html#typing.TypeVar)
- [mypy: ジェネリクス（英語）](https://mypy.readthedocs.io/en/stable/generics.html)
`,
          examples: [
            {
              caption: "型を保ったまま返す",
              code: `
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None


print(first(["佐藤", "山田"]))
print(first([90, 80]))
print(first([]))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "mypy がどう見ているかを確かめる",
              note: "`reveal_type` は mypy 向けの目印です。実行しても値はそのまま返ります。",
              code: `
from typing import reveal_type


def first[T](items: list[T]) -> T | None:
    return items[0] if items else None


reveal_type(first(["佐藤"]))
reveal_type(first([90]))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "型が保たれていると、使い方の間違いに気づける",
              note: "`use` は呼んでいません。整数のリストから取り出した値に `.upper()` を呼んでいます。",
              code: `
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None


def use() -> None:
    value = first([90, 80])
    if value is not None:
        print(value.upper())


print("mypy の指摘だけを見ます")

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
リストの**最後**の要素を返す関数 \`last\` を、**中身の型を保ったまま**書いてください。

| 呼び出し | 返る値 |
|---|---|
| \`last(["佐藤", "山田"])\` | \`"山田"\` |
| \`last([90, 80])\` | \`80\` |
| \`last([])\` | \`None\` |

- 空のリストでは \`None\` を返します（エラーにしない）
- 文字列のリストを渡したら文字列が、整数のリストを渡したら整数が返る、と**型から分かる**ように書いてください

> 採点では、文字列のリストから取り出した値に \`.upper()\` を呼ぶコード（**指摘されてはいけない**）と、整数のリストから取り出した値に \`.upper()\` を呼ぶコード（**指摘されるべき**）の両方を後ろに足して mypy にかけます。戻り値を \`object\` や \`Any\` にすると、どちらかで落ちます。
`,
            starter: `
def last(items):
    return None


print(last(["佐藤", "山田"]))
print(last([90, 80]))
print(last([]))
`,
            tests: `
g = globals()
f = g.get("last")

check(callable(f), "last という関数を定義できている")

if callable(f):
    check(f(["佐藤", "山田"]) == "山田", "最後の要素を返す（今は {!r}）".format(f(["佐藤", "山田"])))
    check(f([90, 80]) == 80, "整数のリストでも動く（今は {!r}）".format(f([90, 80])))
    check(f([]) is None, "空のリストでは None（今は {!r}）".format(f([])))
    check(f([1]) == 1, "1 件だけのリストでも動く")

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

OK_PROBE = (
    "\\n\\ndef _probe_ok() -> None:\\n"
    "    value = last(['佐藤'])\\n"
    "    if value is not None:\\n"
    "        print(value.upper())\\n"
)
ok_probe = run_mypy(source=_source() + OK_PROBE, quiet=True)
check(
    ok_probe.ok,
    "文字列のリストから取り出した値は str として扱える（今は {}）".format(ok_probe.codes),
)

NG_PROBE = (
    "\\n\\ndef _probe_ng() -> None:\\n"
    "    value = last([90])\\n"
    "    if value is not None:\\n"
    "        print(value.upper())\\n"
)
ng_probe = run_mypy(source=_source() + NG_PROBE, quiet=True)
check(
    ng_probe.find(code="attr-defined") != [],
    "整数のリストから取り出した値に .upper() を呼ぶと指摘される（型が保たれている）",
)
`,
            hint: [
              "処理そのものは 1 行で書けます。考えどころは「渡されたリストの中身の型を、戻り値にどう引き継ぐか」だけです。",
              "`list[str]` や `list[int]` と書き分けると 2 つの関数が要ります。中身の型に名前を付けて、その名前を戻り値にも使ってください。",
              "空のときに `None` を返すので、戻り値は「その型か、None か」になります。第1章で扱った `|` の書き方をそのまま使えます。",
            ],
            solution: `def last[T](items: list[T]) -> T | None:
    """最後の要素を返す。空なら None。"""
    return items[-1] if items else None


print(last(["佐藤", "山田"]))
print(last([90, 80]))
print(last([]))`,
            rejects: [
              {
                caption: "動きはするが、戻り値を object にしていて型が保たれない",
                code: `def last(items: list[object]) -> object | None:
    return items[-1] if items else None


print(last(["佐藤", "山田"]))
print(last([90, 80]))
print(last([]))`,
              },
            ],
            packages: ["mypy"],
          },
        },
      ],
    },

    /* ================= 第3章 ================= */
    {
      id: "ch3",
      title: "第3章　静的解析を運用に載せる",
      lessons: [
        {
          id: "l9",
          title: "Protocol で疎結合にする",
          goal: "「何であるか」ではなく「何ができるか」で受け取る型を書く",
          packages: ["mypy"],
          body: `
Python では、クラスの継承関係を気にせず「同じメソッドがあれば同じように使える」書き方をします（ダックタイピング）。これを**型として**書けるのが \`Protocol\` です。

~~~
from typing import Protocol


class Sender(Protocol):
    def send(self, message: str) -> bool: ...
~~~

\`...\` は本体を書かないという意味です。中身は要りません。「\`send(str) -> bool\` を持っているものは \`Sender\` だ」という宣言だけです。

### 継承しなくても満たせる

~~~
class MailSender:          # Sender を継承していない
    def send(self, message: str) -> bool:
        print("メール:", message)
        return True


def notify_all(sender: Sender, messages: list[str]) -> int:
    return sum(1 for message in messages if sender.send(message))


notify_all(MailSender(), ["こんにちは"])   # 通る
~~~

これが**構造的部分型**です。\`MailSender\` は \`Sender\` の存在すら知りませんが、形が合っているので通ります。

| 書き方 | 呼ぶ側に要求すること |
|---|---|
| 抽象基底クラス（\`ABC\`）を継承 | そのクラスを継承すること |
| \`Protocol\` | 形（メソッドと型）が合っていること |

**外部ライブラリのクラスや、自分では書き換えられないクラスを渡したい**ときに効きます。継承を強制できないからです。

### テストが書きやすくなる

「テストと品質」コースで、本物の送信をモックに差し替えました。\`Protocol\` で受け取っておくと、テスト用のダミーは**ただのクラス**で済みます。

~~~
class FakeSender:
    def __init__(self) -> None:
        self.sent: list[str] = []

    def send(self, message: str) -> bool:
        self.sent.append(message)
        return True
~~~

このダミーも \`Sender\` として通ります。型で受け取っているので、**差し替えられる設計かどうかが型に現れます**。

### 形が合わなければ、動かす前に分かる

\`send\` が無いクラスや、戻り値の型が違うクラスを渡すと \`arg-type\` エラーになります。「渡せるつもりだった」を実行前に潰せます。

> \`Protocol\` は属性も書けます（\`name: str\` のように）。メソッドだけの決まりではありません。

### もっと詳しく

実行時に \`isinstance(obj, Sender)\` で判定したい場合は、\`@runtime_checkable\` を付けます。ただし確かめられるのは**メソッドの名前があるか**までで、引数や戻り値の型までは見ません。実行時の検査は静的解析の代わりにはならない、と割り切って使ってください。

すでに標準ライブラリにも \`Protocol\` で書かれた型があります。\`collections.abc\` の \`Iterable\` や \`Sized\`（\`len()\` が使える）などがそれで、自分で定義する前に使えるものが無いか探すと、書く量が減ります。

- [typing.Protocol（公式）](https://docs.python.org/ja/3/library/typing.html#typing.Protocol)
- [PEP 544 -- Protocols（英語）](https://peps.python.org/pep-0544/)
- [mypy: Protocol と構造的部分型（英語）](https://mypy.readthedocs.io/en/stable/protocols.html)
`,
          examples: [
            {
              caption: "形が合っていれば、継承しなくても渡せる",
              code: `
from typing import Protocol


class Sender(Protocol):
    def send(self, message: str) -> bool: ...


class MailSender:
    def send(self, message: str) -> bool:
        print("メール:", message)
        return True


class SlackSender:
    def send(self, message: str) -> bool:
        print("Slack:", message)
        return True


def notify_all(sender: Sender, messages: list[str]) -> int:
    return sum(1 for message in messages if sender.send(message))


print(notify_all(MailSender(), ["こんにちは", "お知らせ"]))
print(notify_all(SlackSender(), ["こんにちは"]))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "テスト用のダミーも、ただのクラスでよい",
              code: `
from typing import Protocol


class Sender(Protocol):
    def send(self, message: str) -> bool: ...


class FakeSender:
    def __init__(self) -> None:
        self.sent: list[str] = []

    def send(self, message: str) -> bool:
        self.sent.append(message)
        return True


def notify_all(sender: Sender, messages: list[str]) -> int:
    return sum(1 for message in messages if sender.send(message))


fake = FakeSender()
print(notify_all(fake, ["A", "B"]))
print(fake.sent)

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "形が合わないと、渡す前に止められる",
              note: "`Printer` にあるのは `write` で、`send` ではありません。`use` は呼んでいません。",
              code: `
from typing import Protocol


class Sender(Protocol):
    def send(self, message: str) -> bool: ...


class Printer:
    def write(self, message: str) -> None:
        print(message)


def notify_all(sender: Sender, messages: list[str]) -> int:
    return sum(1 for message in messages if sender.send(message))


def use() -> None:
    notify_all(Printer(), ["A"])


print("mypy の指摘だけを見ます")

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
「保存できるもの」を \`Protocol\` で表し、それを使う関数を書いてください。

**\`Storage\` プロトコル**

| メソッド | 型 |
|---|---|
| \`save(self, key, value)\` | \`key\` は文字列、\`value\` は文字列、戻り値は \`bool\`（保存できたか） |

**\`save_all(storage, rows)\`**

\`rows\`（\`(キー, 値)\` のタプルのリスト）を順に保存し、**保存できた件数**を返します。

| 呼び出し | 返る値 |
|---|---|
| すべて保存できるとき | 件数 |
| \`save\` が \`False\` を返したもの | 数えない |

> 採点では、\`Storage\` を継承していないクラス（形だけ合っているもの）を渡して動くこと、\`save\` を持たないクラスを渡すと mypy が指摘することの両方を見ます。\`mypy --disallow-untyped-defs\` も通します。
`,
            starter: `
from typing import Protocol


class Storage(Protocol):
    pass


def save_all(storage, rows):
    return 0
`,
            tests: `
g = globals()
Storage = g.get("Storage")
f = g.get("save_all")

check(Storage is not None and isinstance(Storage, type), "Storage を定義できている")
check(callable(f), "save_all という関数を定義できている")


class _Memory:
    def __init__(self):
        self.saved = {}

    def save(self, key, value):
        self.saved[key] = value
        return True


class _Picky:
    """空の値は保存しない置き場。"""

    def __init__(self):
        self.saved = {}

    def save(self, key, value):
        if not value:
            return False
        self.saved[key] = value
        return True


if callable(f):
    memory = _Memory()
    got = f(memory, [("a", "1"), ("b", "2")])
    check(got == 2, "保存できた件数を返す（今は {!r}）".format(got))
    check(memory.saved == {"a": "1", "b": "2"}, "渡したものを実際に保存している（今は {!r}）".format(memory.saved))

    picky = _Picky()
    got = f(picky, [("a", "1"), ("b", ""), ("c", "3")])
    check(got == 2, "save が False を返したものは数えない（今は {!r}）".format(got))

    check(f(_Memory(), []) == 0, "空のリストなら 0")

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))

# 継承していないクラスでも、形が合っていれば通ること
OK_PROBE = (
    "\\n\\nclass _Fake:\\n"
    "    def save(self, key: str, value: str) -> bool:\\n"
    "        return True\\n\\n\\n"
    "def _probe_ok() -> None:\\n"
    "    save_all(_Fake(), [('a', '1')])\\n"
)
ok_probe = run_mypy(source=_source() + OK_PROBE, quiet=True)
check(ok_probe.ok, "継承していなくても、形が合えば渡せる（今は {}）".format(ok_probe.codes))

# save を持たないクラスは弾かれること
NG_PROBE = (
    "\\n\\nclass _NoSave:\\n"
    "    def write(self, key: str, value: str) -> None:\\n"
    "        return None\\n\\n\\n"
    "def _probe_ng() -> None:\\n"
    "    save_all(_NoSave(), [('a', '1')])\\n"
)
ng_probe = run_mypy(source=_source() + NG_PROBE, quiet=True)
check(
    ng_probe.find(code="arg-type") != [],
    "save を持たないクラスを渡すと mypy が指摘する",
)
`,
            hint: [
              "プロトコルの中身は「呼べるメソッドの形」だけです。処理は書きません。本体のかわりに `...` を置きます。",
              "`save_all` の引数は 2 つで、1 つめの型がプロトコル、2 つめが「（キー, 値）の組のリスト」です。第1章のタプルの書き方を思い出してください。",
              "戻り値は「保存できた件数」なので、`save` が返した真偽値を見て数えます。すべて数えてしまうと、`False` を返す置き場のテストで落ちます。",
            ],
            solution: `from typing import Protocol


class Storage(Protocol):
    """キーと値を保存できるもの。"""

    def save(self, key: str, value: str) -> bool: ...


def save_all(storage: Storage, rows: list[tuple[str, str]]) -> int:
    """順に保存して、保存できた件数を返す。"""
    saved = 0
    for key, value in rows:
        if storage.save(key, value):
            saved += 1
    return saved


class MemoryStorage:
    def __init__(self) -> None:
        self.saved: dict[str, str] = {}

    def save(self, key: str, value: str) -> bool:
        self.saved[key] = value
        return True


memory = MemoryStorage()
print(save_all(memory, [("a", "1"), ("b", "2")]))
print(memory.saved)`,
            rejects: [
              {
                caption: "保存できたかを見ずに、全部数えている",
                code: `from typing import Protocol


class Storage(Protocol):
    def save(self, key: str, value: str) -> bool: ...


def save_all(storage: Storage, rows: list[tuple[str, str]]) -> int:
    for key, value in rows:
        storage.save(key, value)
    return len(rows)`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l10",
          title: "厳しさを調整する",
          goal: "--strict が何を見るのかを知り、Any と type: ignore の扱いを決める",
          packages: ["mypy"],
          body: `
既定の mypy は、**注釈の無い関数の中身をほとんど見ません**。

~~~
def average(values):
    return sum(values) / len(values) + "円"    # 明らかにおかしい
~~~

これを既定の設定で通すと \`Success\` と出ます。「型が書かれていないので判断しない」という方針だからです。**注釈を書かないかぎり、mypy は何も守ってくれない**ということでもあります。

### --strict

\`--strict\` は、厳しめの設定をまとめてオンにする近道です。主なものはこれです。

| 設定 | 何を言われるようになるか |
|---|---|
| \`disallow_untyped_defs\` | 注釈の無い関数があると指摘される |
| \`disallow_any_generics\` | \`list\` のように中身を省いた書き方が指摘される |
| \`no_implicit_optional\` | 既定値が \`None\` なのに \`| None\` を書いていないと指摘される |
| \`warn_return_any\` | \`Any\` をそのまま返していると指摘される |
| \`warn_unused_ignores\` | 効いていない \`# type: ignore\` が指摘される |

新しく書くコードは \`--strict\` から始めるのが楽です。あとから厳しくすると、直す量が一気に増えます。

### 設定はファイルに書く

毎回オプションを並べるのは現実的ではないので、\`pyproject.toml\` に書きます。

~~~
[tool.mypy]
python_version = "3.14"
strict = true

[[tool.mypy.overrides]]
module = "legacy.*"
strict = false
~~~

**モジュールごとに厳しさを変えられる**のが大事なところです。既存のコードを持つプロジェクトでは、新しいところだけ \`strict\`、古いところは緩め、という運用ができます。

### type: ignore は「例外の申請」

どうしても消せない指摘は、その行に \`# type: ignore[コード]\` を書けば黙らせられます。

~~~
value = legacy_api()  # type: ignore[no-any-return]
~~~

- **コードを必ず書く**（\`# type: ignore\` だけだと、その行のすべてのエラーを隠します）
- **理由をコメントで残す**
- 数が増えてきたら、それは設計の問題である可能性が高い

### Any は伝染する

\`Any\` は「何でもよい」という型です。\`Any\` の値は何をしても怒られず、そこから作った値も \`Any\` になります。\`json.loads()\` のように外から来るデータは \`Any\` なので、**受け取ったらすぐに具体的な型へ移す**のが定石です。

~~~
raw = json.loads(text)             # Any
name = str(raw["name"])            # ここで str にする
~~~

### もっと詳しく

段階的に厳しくするときは、\`--strict\` を一度に入れるより \`disallow_untyped_defs\` だけを先に有効にするほうが進めやすいことがあります。mypy には現状のエラーを一覧にする \`--html-report\` などの出力もあり、「どのモジュールから手を付けるか」を決める材料になります。

外部ライブラリに型情報が無い場合は、\`types-requests\` のような **型スタブ** パッケージが公開されていることがあります。\`mypy --install-types\` で足りないスタブをまとめて入れられます。

- [mypy の設定ファイル（英語）](https://mypy.readthedocs.io/en/stable/config_file.html)
- [mypy: エラーを黙らせる（英語）](https://mypy.readthedocs.io/en/stable/error_codes.html#silencing-errors-based-on-error-codes)
- [typing.Any（公式）](https://docs.python.org/ja/3/library/typing.html#typing.Any)
`,
          examples: [
            {
              caption: "注釈が無ければ、中身は見てもらえない",
              note: "同じコードを、既定の設定と `--strict` の両方にかけます。",
              code: `
def average(values):
    return sum(values) / len(values)


print(average([1, 2, 3]))

run_mypy()
run_mypy("--strict")
`,
              packages: ["mypy"],
            },
            {
              caption: "既定値が None のときの落とし穴",
              note: "`score: float = None` は、実行はできても型としては矛盾しています。",
              code: `
def label(name: str, score: float = None) -> str:
    if score is None:
        return name + ": 未評価"
    return name + ": " + str(score)


print(label("山田"))
print(label("佐藤", 82.5))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "type: ignore の効き方を見る",
              note: "2 行目だけ指摘が消えます。効いていない `# type: ignore` は `--strict` が教えてくれます。",
              code: `
total: int = "500"
count: int = "3"  # type: ignore[assignment]
name: str = "りんご"  # type: ignore[assignment]

print(total, count, name)

run_mypy("--strict")
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
下のコードを \`mypy --strict\` が何も言わない状態にしてください。

| 関数 | 仕様 |
|---|---|
| \`average(values)\` | 平均を返す。**空のリストなら \`None\`** |
| \`label(name, score=None)\` | \`score\` があれば \`"山田: 85.0"\`（小数第 1 位まで）、無ければ \`"山田: 未評価"\` |

- 処理の中身は変えなくてかまいません。**足りないのは型です**
- \`score\` の既定値は \`None\` のままにしてください
- \`# type: ignore\` と \`Any\` は使わずに通してください（採点で見ています）

> \`run_mypy("--strict")\` で手元でも確かめられます。
`,
            starter: `
def average(values):
    if not values:
        return None
    return sum(values) / len(values)


def label(name, score=None):
    if score is None:
        return name + ": 未評価"
    return name + ": " + str(round(score, 1))


print(average([80, 90]))
print(label("山田", average([80, 90])))
print(label("佐藤"))

run_mypy("--strict")
`,
            tests: `
g = globals()
avg = g.get("average")
label = g.get("label")

check(callable(avg), "average がある")
check(callable(label), "label がある")

if callable(avg):
    check(avg([80, 90]) == 85.0, "average([80, 90]) が 85.0（今は {!r}）".format(avg([80, 90])))
    check(avg([]) is None, "空のリストでは None（今は {!r}）".format(avg([])))

if callable(label):
    got = label("山田", 85.0)
    check(got == "山田: 85.0", "点数があるときの文言（今は {!r}）".format(got))
    got = label("鈴木", 84.44)
    check(got == "鈴木: 84.4", "小数第 1 位まで（今は {!r}）".format(got))
    got = label("佐藤")
    check(got == "佐藤: 未評価", "点数を省いたときの文言（今は {!r}）".format(got))

source = _source()
check("type: ignore" not in source, "# type: ignore で黙らせていない")
check("Any" not in source, "Any を使っていない")

report = run_mypy("--strict", quiet=True)
check(report.ok, "mypy --strict が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))
`,
            hint: [
              "--strict が言っているのは、たいてい「この関数には注釈が無い」です。まず 2 つの関数に引数と戻り値の型を書いてから、残った指摘を読みます。",
              "戻り値が枝によって変わる関数があります。片方の枝で None を返すなら、それも戻り値の型に含めます。",
              "既定値が None の引数は、型にも「None かもしれない」ことを書かないと矛盾します。書かないまま通そうとすると、別のエラー（引数の型が合わない）に化けます。",
            ],
            solution: `def average(values: list[int]) -> float | None:
    """平均を返す。空のリストなら None。"""
    if not values:
        return None
    return sum(values) / len(values)


def label(name: str, score: float | None = None) -> str:
    """点数を 1 行の文にする。点数が無ければ「未評価」。"""
    if score is None:
        return name + ": 未評価"
    return name + ": " + str(round(score, 1))


print(average([80, 90]))
print(label("山田", average([80, 90])))
print(label("佐藤"))

run_mypy("--strict")`,
            rejects: [
              {
                caption: "type: ignore で黙らせただけ",
                code: `def average(values):  # type: ignore[no-untyped-def]
    if not values:
        return None
    return sum(values) / len(values)


def label(name, score=None):  # type: ignore[no-untyped-def]
    if score is None:
        return name + ": 未評価"
    return name + ": " + str(round(score, 1))`,
              },
              {
                caption: "Any を使って検査を素通りさせている",
                code: `from typing import Any


def average(values: Any) -> Any:
    if not values:
        return None
    return sum(values) / len(values)


def label(name: str, score: Any = None) -> str:
    if score is None:
        return name + ": 未評価"
    return name + ": " + str(round(score, 1))`,
              },
            ],
            packages: ["mypy"],
          },
        },

        {
          id: "l11",
          title: "型の外側を見る道具（リンタ）",
          goal: "ruff が何を見ているのかを知り、その中身を自分で 1 つ作ってみる",
          packages: ["mypy"],
          body: `
mypy が見るのは**型の食い違い**だけです。使っていない import、未使用の変数、書き方の揺れは、型としては正しいので何も言われません。そこを見るのが**リンタ**で、いまの定番が **ruff** です。

~~~
pip install ruff

ruff check .      # 問題を指摘する
ruff check --fix .# 直せるものは直す
ruff format .     # 整形する（black 互換）
~~~

設定は \`pyproject.toml\` に書きます。

~~~
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I"]   # pycodestyle / pyflakes / import の並べ替え
~~~

| コード | 例 |
|---|---|
| \`F401\` | import したのに使っていない |
| \`F841\` | 代入したのに使っていない変数 |
| \`E501\` | 行が長すぎる |
| \`I001\` | import の並びが揃っていない |

> ruff は Rust で書かれた実行ファイルなので、**このブラウザの中では動きません**。上のコマンドは手元で試してください。

### 中身は、それほど魔法ではない

リンタは「コードを構文の木（AST）として読み、パターンを探す」道具です。標準ライブラリの \`ast\` で同じことができます。

~~~
import ast

tree = ast.parse("import os\\nprint(os.getcwd())")

for node in ast.walk(tree):
    print(type(node).__name__)
~~~

\`ast.walk()\` は木の中のすべての節点を順に返します。節点の種類で分ければ、欲しい情報が取れます。

| 節点 | 何を表すか | 使う属性 |
|---|---|---|
| \`ast.Import\` | \`import os\` | \`node.names\`（\`alias.name\` / \`alias.asname\`） |
| \`ast.ImportFrom\` | \`from x import y\` | 同上 |
| \`ast.Name\` | 名前を使っているところ | \`node.id\` |

\`os.getcwd()\` のような書き方でも、\`os\` の部分は \`ast.Name\` として現れます。つまり「**import で作られた名前**」と「**使われている名前**」を集めて引き算すれば、\`F401\`（未使用の import）と同じことができます。

~~~
import os        # → 名前 "os" ができる
import os as o   # → 名前 "o" ができる
from pathlib import Path        # → "Path"
from collections import Counter as C   # → "C"
~~~

別名（\`as\`）があるときは**別名のほう**が使う名前になります。

### もっと詳しく

ruff は pyflakes・pycodestyle・isort・flake8 の各種プラグインなど、**別々のツールだった検査を 1 つにまとめた**もので、速さのために Rust で書かれています。black（整形）と flake8（検査）を別々に入れていた時代の記事を読むときは、いまは ruff 1 つで置き換えられることが多い、と思って読んでください。

自動修正（\`--fix\`）は便利ですが、意味を変えうる修正は「安全でない」と分類されていて既定では実行されません。CI に入れるときは \`ruff check\`（修正しない）だけを走らせ、修正は手元でやるのが安全です。

- [ruff 公式ドキュメント（英語）](https://docs.astral.sh/ruff/)
- [ruff のルール一覧（英語）](https://docs.astral.sh/ruff/rules/)
- [ast --- 抽象構文木（公式）](https://docs.python.org/ja/3/library/ast.html)
`,
          examples: [
            {
              caption: "手元での ruff（このブラウザでは動きません）",
              runnable: false,
              code: `
$ pip install ruff
$ ruff check .
app/main.py:1:8: F401 [*] \`os\` imported but unused
app/main.py:12:5: F841 [*] Local variable \`total\` is assigned to but never used
Found 2 errors.
[*] 2 fixable with the \`--fix\` option.

$ ruff check --fix .
Found 2 errors (2 fixed, 0 remaining).
`,
            },
            {
              caption: "コードを木として読む",
              code: `
import ast

source = """import os
from pathlib import Path

print(os.getcwd())
"""

tree = ast.parse(source)

for node in ast.walk(tree):
    if isinstance(node, (ast.Import, ast.ImportFrom)):
        for alias in node.names:
            print("import:", alias.name, "as", alias.asname)
    elif isinstance(node, ast.Name):
        print("使っている名前:", node.id)
`,
            },
            {
              caption: "使っていない import を見つける",
              code: `
import ast

source = """import os
import sys
from pathlib import Path

print(os.getcwd())
print(Path("."))
"""

tree = ast.parse(source)
imported: list[str] = []
used: set[str] = set()

for node in ast.walk(tree):
    if isinstance(node, (ast.Import, ast.ImportFrom)):
        for alias in node.names:
            imported.append(alias.asname or alias.name.split(".")[0])
    elif isinstance(node, ast.Name):
        used.add(node.id)

print([name for name in imported if name not in used])
`,
            },
          ],
          exercise: {
            prompt: `
未使用の import を見つける関数 \`find_unused_imports(source)\` を書いてください。ruff の \`F401\` に当たるものです。

- 引数はソースコードの文字列、戻り値は**使われていない名前のリスト**（書かれた順）
- \`import os as o\` のように別名があるときは、**別名のほう**が名前になります
- \`import os.path\` のように点を含むときは、最初の部分（\`os\`）が名前になります

~~~
find_unused_imports('''import os
import sys
from pathlib import Path

print(os.getcwd())
''')
# → ["sys", "Path"]
~~~

> 採点では \`mypy --disallow-untyped-defs\` も通します。引数と戻り値の型を書いてください。
`,
            starter: `
import ast


def find_unused_imports(source):
    return []


print(find_unused_imports("import os\\nprint(os.getcwd())\\n"))
`,
            tests: `
g = globals()
f = g.get("find_unused_imports")

check(callable(f), "find_unused_imports という関数を定義できている")

if callable(f):
    got = f("import os\\nimport sys\\nfrom pathlib import Path\\n\\nprint(os.getcwd())\\n")
    check(got == ["sys", "Path"], "使っていない import を順番どおり返す（今は {!r}）".format(got))

    got = f("import os\\nprint(os.getcwd())\\n")
    check(got == [], "すべて使っていれば空のリスト（今は {!r}）".format(got))

    got = f("import os as o\\nprint(o.getcwd())\\n")
    check(got == [], "別名で使っていれば、使ったことになる（今は {!r}）".format(got))

    got = f("import os as o\\nprint(os)\\n")
    check(got == ["o"], "別名を付けたら、元の名前では使ったことにならない（今は {!r}）".format(got))

    got = f("from collections import Counter as C\\nprint(1)\\n")
    check(got == ["C"], "from ... import ... as ... も見る（今は {!r}）".format(got))

    got = f("import os.path\\nprint(os.path.join('a', 'b'))\\n")
    check(got == [], "点を含む import は最初の部分で判定する（今は {!r}）".format(got))

    got = f("print(1)\\n")
    check(got == [], "import が無ければ空のリスト（今は {!r}）".format(got))

report = run_mypy("--disallow-untyped-defs", quiet=True)
check(report.ok, "mypy が何も指摘しない（今は {} 件: {}）".format(len(report.errors), report.codes))
`,
            hint: [
              "やることは 2 つの集まりを作って引き算するだけです。「import で作られる名前」と「コード中で使われている名前」をそれぞれ集めます。",
              "本文の表にある 3 つの節点を `ast.walk()` で拾い分けます。import 側は `node.names` の 1 件ずつが 1 つの名前に対応します。",
              "名前の決め方が 2 段階あります。別名があればそちら、無ければ元の名前——ただし点を含む場合は最初の部分だけです。順番を保つには、集める側をリストにしておきます。",
            ],
            solution: `import ast


def find_unused_imports(source: str) -> list[str]:
    """import したのに使っていない名前を、書かれた順に返す。"""
    tree = ast.parse(source)
    imported: list[str] = []
    used: set[str] = set()

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            for alias in node.names:
                imported.append(alias.asname or alias.name.split(".")[0])
        elif isinstance(node, ast.Name):
            used.add(node.id)

    return [name for name in imported if name not in used]


print(find_unused_imports("import os\\nimport sys\\nprint(os.getcwd())\\n"))`,
            rejects: [
              {
                caption: "別名を無視して、元の名前だけで判定している",
                code: `import ast


def find_unused_imports(source: str) -> list[str]:
    tree = ast.parse(source)
    imported: list[str] = []
    used: set[str] = set()

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            for alias in node.names:
                imported.append(alias.name.split(".")[0])
        elif isinstance(node, ast.Name):
            used.add(node.id)

    return [name for name in imported if name not in used]`,
              },
            ],
            packages: ["mypy"],
          },
        },
      ],
    },

    /* ================= 第4章 ================= */
    {
      id: "ch4",
      title: "第4章　卒業制作：型のないコードに型を入れる",
      lessons: [
        {
          id: "l12",
          title: "既存のコードに型を入れる",
          goal: "型のないコードに注釈を足し、その過程で潜んでいたバグを見つけて直す",
          packages: ["mypy"],
          body: `
最後は、**すでに動いているコードに型を入れる**という現実の作業です。新規に書くときと違い、次の 2 つが同時に起こります。

1. 型を書くと、**今まで気づいていなかった食い違い**が出てくる
2. その食い違いは、たいてい**本物のバグ**である

### 進め方

| 順 | やること | なぜ |
|---|---|---|
| 1 | まず既定の設定で mypy を通す | 現状を把握する。ここは通って当然（注釈が無いので見られない） |
| 2 | 端の関数から注釈を足す | 呼ばれる側（ライブラリに近いほう）から埋めると、呼ぶ側の指摘が自然に出てくる |
| 3 | 出てきた指摘を **仕様の判断** として扱う | 「\`None\` のときどうするのが正しいか」を決める作業になる |
| 4 | モジュール単位で \`strict\` に上げる | 全体を一度に厳しくしない |
| 5 | CI に入れる | 戻らないようにする |

3 が本題です。型を入れる作業は、機械的な書き足しに見えて、実は**仕様の穴を埋める作業**になります。

### 出てくる指摘の典型

~~~
def find(name):
    return STOCK.get(name)     # 見つからなければ None


def restock(name, count):
    STOCK[name] = find(name) + count    # None + int で落ちる日が来る
~~~

注釈を書いた瞬間、\`find\` の戻り値が \`int | None\` だと分かり、\`restock\` の \`+\` が \`operator\` エラーになります。**このコードは、まだ落ちていないだけ**でした。

直し方は 1 つではありません。

| 直し方 | 意味 |
|---|---|
| 未登録なら 0 として扱う | 「初めての商品も入荷できる」という仕様にする |
| 未登録なら例外にする | 「登録済みの商品しか入荷できない」という仕様にする |

**どちらが正しいかはコードでは決まりません。** 型は、その判断を迫ってくれる道具です。

### CI に載せる

「テストと品質」コースで書いたテストと同じところに置きます。

~~~
- run: mypy .
- run: ruff check .
- run: pytest
~~~

型・リント・テストの 3 つが、壊れたことに気づくための仕組みです。**速い順に並べる**と、落ちるときに早く落ちます。

### もっと詳しく

大きなコードに一度に型を入れるのは現実的ではありません。mypy には既存のエラーを一旦受け入れる仕組み（\`--ignore-missing-imports\` や、モジュールごとの \`ignore_errors\`）があり、まず**新しく書くファイルだけを strict にする**運用がよく使われます。

型を書きながら「この関数、引数が多すぎる」「この戻り値、2 つの意味を持っている」と気づくことがあります。それは型の問題ではなく設計の合図です。型ヒントは**設計のレビューを機械にやらせる道具**でもある、というのがこのコースを通しての結論です。

- [mypy: 既存コードへの導入（英語）](https://mypy.readthedocs.io/en/stable/existing_code.html)
- [mypy: モジュールごとの設定（英語）](https://mypy.readthedocs.io/en/stable/config_file.html#per-module-and-global-options)
`,
          examples: [
            {
              caption: "型が無いと、mypy は通ってしまう",
              note: "在庫の無い商品を入荷すると落ちるコードです。それでも既定の mypy は何も言いません。",
              code: `
STOCK = {"りんご": 3}


def find(name):
    return STOCK.get(name)


def restock(name, count):
    STOCK[name] = find(name) + count
    return STOCK[name]


print(restock("りんご", 2))

run_mypy()
`,
              packages: ["mypy"],
            },
            {
              caption: "実際に落ちる",
              note: "mypy が黙っていただけで、バグはずっとありました。",
              raises: true,
              code: `
STOCK = {"りんご": 3}


def find(name):
    return STOCK.get(name)


def restock(name, count):
    STOCK[name] = find(name) + count
    return STOCK[name]


print(restock("ぶどう", 1))
`,
            },
            {
              caption: "注釈を足すと、動かす前に同じ場所を指せる",
              code: `
STOCK = {"りんご": 3}


def find(name: str) -> int | None:
    return STOCK.get(name)


def restock(name: str, count: int) -> int:
    STOCK[name] = find(name) + count
    return STOCK[name]


print("mypy の指摘を見ます")

run_mypy()
`,
              packages: ["mypy"],
            },
          ],
          exercise: {
            prompt: `
在庫管理のコードに型を入れ、\`mypy --strict\` を通してください。**そのとき見つかるバグも直します。**

| 関数 | 直したあとの仕様 |
|---|---|
| \`find(name)\` | 在庫数を返す。未登録なら \`None\` |
| \`restock(name, count)\` | 入荷して、入荷後の在庫数を返す。**未登録の商品は 0 から始める** |
| \`report(names)\` | 1 件 1 行の一覧を返す。在庫があれば \`"りんご: 5"\`、未登録なら \`"ぶどう: 取り扱いなし"\` |

~~~
restock("りんご", 2)   # 3 → 5
restock("ぶどう", 1)   # 未登録 → 1
report(["りんご", "ぶどう", "メロン"])
# → ["りんご: 5", "ぶどう: 1", "メロン: 取り扱いなし"]
~~~

- \`STOCK\` の初期値は変えないでください（\`{"りんご": 3, "みかん": 0}\`）
- \`# type: ignore\` と \`Any\` は使わずに通してください
- 在庫 \`0\` は「取り扱いなし」ではありません

> \`run_mypy("--strict")\` で確かめながら進めてください。型を足すと、\`restock\` と \`report\` の両方に指摘が出るはずです。それが直すべき場所です。
`,
            starter: `
STOCK = {"りんご": 3, "みかん": 0}


def find(name):
    return STOCK.get(name)


def restock(name, count):
    STOCK[name] = find(name) + count
    return STOCK[name]


def report(names):
    lines = []
    for name in names:
        lines.append(name + ": " + str(find(name)))
    return lines


print(restock("りんご", 2))
print(report(["りんご", "みかん", "メロン"]))

run_mypy("--strict")
`,
            tests: `
g = globals()
find = g.get("find")
restock = g.get("restock")
report = g.get("report")
stock = g.get("STOCK")

check(callable(find) and callable(restock) and callable(report), "3 つの関数がそろっている")
check(isinstance(stock, dict), "STOCK がある")

if callable(find) and callable(restock) and callable(report) and isinstance(stock, dict):
    # 採点は、このレッスンの実行で書き換わった STOCK に影響されないよう作り直す
    stock.clear()
    stock.update({"りんご": 3, "みかん": 0})

    check(find("りんご") == 3, "find('りんご') が 3（今は {!r}）".format(find("りんご")))
    check(find("メロン") is None, "未登録なら None（今は {!r}）".format(find("メロン")))

    got = restock("りんご", 2)
    check(got == 5, "在庫のある商品を入荷できる（今は {!r}）".format(got))
    got = restock("ぶどう", 1)
    check(got == 1, "未登録の商品は 0 から始まる（今は {!r}）".format(got))
    check(stock.get("ぶどう") == 1, "入荷した結果が STOCK に残る（今は {!r}）".format(stock.get("ぶどう")))

    got = report(["りんご", "みかん", "メロン"])
    check(
        got == ["りんご: 5", "みかん: 0", "メロン: 取り扱いなし"],
        "在庫 0 と未登録を区別して並べる（今は {!r}）".format(got),
    )
    check(report([]) == [], "空なら空のリスト")

source = _source()
check("type: ignore" not in source, "# type: ignore で黙らせていない")
check("Any" not in source, "Any を使っていない")

report_result = run_mypy("--strict", quiet=True)
check(
    report_result.ok,
    "mypy --strict が何も指摘しない（今は {} 件: {}）".format(len(report_result.errors), report_result.codes),
)
`,
            hint: [
              "まず 3 つの関数に注釈を足すだけ足して、mypy が何を言うかを見てください。指摘の場所が、そのまま直すべき場所です。",
              "指摘の中身は「None かもしれない値を、None でない前提で使っている」です。入荷のほうと一覧のほうで、None のときにすべきことが違います（片方は 0 として扱い、もう片方は別の文言にする）。",
              "在庫 0 と未登録の区別が肝です。`if not count:` のような書き方をすると、0 が未登録側に落ちます。None かどうかだけを見る比較を使ってください。",
              "STOCK 自体にも型を書けます（何をキーにして、値が何か）。書いておくと、辞書へ入れる値の型違いも拾えます。",
            ],
            solution: `STOCK: dict[str, int] = {"りんご": 3, "みかん": 0}


def find(name: str) -> int | None:
    """在庫数を返す。未登録なら None。"""
    return STOCK.get(name)


def restock(name: str, count: int) -> int:
    """入荷して、入荷後の在庫数を返す。未登録の商品は 0 から始める。"""
    current = find(name)
    if current is None:
        current = 0
    STOCK[name] = current + count
    return STOCK[name]


def report(names: list[str]) -> list[str]:
    """1 件 1 行の一覧を作る。"""
    lines: list[str] = []
    for name in names:
        count = find(name)
        if count is None:
            lines.append(name + ": 取り扱いなし")
        else:
            lines.append(name + ": " + str(count))
    return lines


print(restock("りんご", 2))
print(restock("ぶどう", 1))
print(report(["りんご", "みかん", "メロン"]))

run_mypy("--strict")`,
            rejects: [
              {
                caption: "型は書いたが、未登録の商品で落ちるままになっている",
                code: `STOCK: dict[str, int] = {"りんご": 3, "みかん": 0}


def find(name: str) -> int:
    return STOCK.get(name, 0)


def restock(name: str, count: int) -> int:
    STOCK[name] = find(name) + count
    return STOCK[name]


def report(names: list[str]) -> list[str]:
    lines: list[str] = []
    for name in names:
        lines.append(name + ": " + str(find(name)))
    return lines`,
              },
            ],
            packages: ["mypy"],
          },
        },
      ],
    },
  ],
};

export default content;
