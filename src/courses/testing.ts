/* ============================================================
   コース：テストと品質
   一覧に出す情報（タイトルやアイコン）は src/courses/registry.ts 側にある。

   このコースだけの事情：
   エディタが 1 枚しかないので、「テストファイルを pytest にかける」を
   run_pytest() というヘルパーで代用している（src/lib/python-helpers.ts）。
   いま書いているコードをそのままテストファイルとして書き出し、pytest に渡す。
   手元でどう動かすかは、各レッスンの本文で必ず示すこと。
   ============================================================ */

import type { CourseContent } from "../types";

/** 点数を扱う練習用モジュール（第1章）。 */
const SCORES_PY = `"""点数のリストを扱う小さなモジュール（練習用）。"""


def average(scores):
    """平均点を返す。空のリストなら 0 を返す。"""
    if not scores:
        return 0
    return sum(scores) / len(scores)


def highest(scores):
    """最高点を返す。空のリストなら None を返す。"""
    if not scores:
        return None
    return max(scores)
`;

/** 点数から評価を決める練習用モジュール（第2章の l4 と l6 で使う）。 */
const GRADING_PY = `"""点数から評価を決めるモジュール（練習用）。"""


def to_grade(score):
    """
    点数から評価を返す。

    80 点以上 → "A" / 60 点以上 → "B" / それ未満 → "C"
    0〜100 の範囲外なら ValueError。
    """
    if score < 0 or score > 100:
        raise ValueError("点数は 0〜100 で指定してください: {}".format(score))
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    return "C"
`;

/** 買い物かごの計算（例外と誤差のレッスン用）。 */
const CART_PY = `"""買い物かごの計算（練習用）。"""


def add_tax(price, rate=0.1):
    """税込価格を返す（小数のまま）。"""
    if price < 0:
        raise ValueError("価格に負の数は指定できません")
    return price * (1 + rate)


def split_bill(total, people):
    """割り勘の 1 人あたりの金額を返す。"""
    if people <= 0:
        raise ValueError("人数は 1 人以上にしてください")
    return total / people
`;

/** TODO リスト（フィクスチャのレッスン用）。 */
const TODO_PY = `"""小さな TODO リスト（練習用）。"""


class TodoList:
    def __init__(self):
        self._items = []

    def add(self, title):
        """項目を足して、足したあとの件数を返す。"""
        if not title.strip():
            raise ValueError("タイトルは空にできません")
        self._items.append({"title": title, "done": False})
        return len(self._items)

    def done(self, number):
        """number 番目（1 から数える）を完了にする。"""
        self._items[number - 1]["done"] = True

    def remaining(self):
        """まだ終わっていない項目のタイトル。"""
        return [item["title"] for item in self._items if not item["done"]]

    def __len__(self):
        return len(self._items)
`;

/** 期限切れの通知（モックのレッスン用）。 */
const REMINDER_PY = `"""期限切れのタスクを通知するモジュール（練習用）。"""

from datetime import datetime


def now():
    """現在時刻。テストではここを差し替える。"""
    return datetime.now()


def send(message):
    """本来はメールや Slack へ送るところ。ここでは印字だけ。"""
    print("送信:", message)
    return True


def is_overdue(deadline):
    """deadline（datetime）を過ぎているか。"""
    return deadline < now()


def notify_overdue(tasks):
    """期限切れのタスクを通知して、通知した件数を返す。"""
    count = 0
    for task in tasks:
        if is_overdue(task["deadline"]):
            send("期限切れ: {}".format(task["title"]))
            count += 1
    return count
`;

/** クーポン計算（カバレッジのレッスン用）。分岐が 4 つある。 */
const COUPON_PY = `"""クーポンの割引計算（練習用）。"""


def discount(price, coupon):
    """
    クーポンを適用したあとの価格を返す。

    None    → 割引なし
    "half"  → 半額（1 円未満は切り捨て）
    "500"   → 500 円引き（0 円より下にはしない）
    それ以外 → ValueError
    """
    if coupon is None:
        return price
    if coupon == "half":
        return price // 2
    if coupon == "500":
        return max(price - 500, 0)
    raise ValueError("知らないクーポンです: {}".format(coupon))
`;

/** 集計の題材（設計のレッスン用）。 */
const ORDERS_TXT = `牛乳,180
パン,240

卵,320
`;

const content: CourseContent = {
  chapters: [
    /* ================= 第1章 ================= */
    {
      id: "ch1",
      title: "第1章　テストは何をしているのか",
      lessons: [
        {
          id: "l1",
          title: "assert で確かめる",
          goal: "「print して目で見る」から「機械に確かめさせる」へ移る",
          body: `
関数を書いたあと、こうやって確かめていないでしょうか。

~~~
print(normalize("  Yamada  "))   # → yamada になっているはず
~~~

これは**確認ではなく観察**です。困るのは次の 3 点です。

- 実行するたびに、自分の目で読み直さないといけない
- 出力が増えると、間違いに気づかなくなる
- 半年後に別の場所を直したとき、ここが壊れても誰も気づかない

### assert は「そうでなければ止まれ」

\`assert 条件\` は、条件が偽のときだけ \`AssertionError\` を出して止まります。真のときは**何も起きません**。

~~~
assert normalize("  Yamada  ") == "yamada"
~~~

正しいときは静かで、間違ったときだけ騒ぐ。これが自動テストの最小単位です。

\`assert\` のうしろにカンマでメッセージを付けられます。

~~~
assert total == 700, f"合計が合っていない: {total}"
~~~

### テストとは何か

やっていることは、たった 2 つの並びです。

| | |
|---|---|
| 期待する結果 | 自分が決める（仕様） |
| 実際の結果 | コードを動かして得る |

この 2 つを比べて、違ったら知らせる。あとのレッスンで出てくる pytest も、豪華になっているだけで、していることはこれと同じです。

> \`assert\` は Python の文で、\`-O\` オプションを付けて実行すると**まるごと無効になります**。本番のコードで入力チェックの代わりに使ってはいけません。値の検証には \`if\` と \`raise\` を使い、\`assert\` はテストのために取っておきます。
`,
          examples: [
            {
              caption: "print で観察する（いつものやり方）",
              code: `
def normalize(name):
    """前後の空白を取り、小文字にそろえる。"""
    return name.strip().lower()


print(normalize("  Yamada  "))
print(normalize("SATO"))
print(normalize("Suzuki"))
`,
            },
            {
              caption: "assert に置き換える",
              note: "何も出力されないのが「全部通った」の合図です。最後の print だけが出ます。",
              code: `
def normalize(name):
    return name.strip().lower()


assert normalize("  Yamada  ") == "yamada"
assert normalize("SATO") == "sato"
assert normalize("Suzuki") == "suzuki"

print("ここまで来たら、上の 3 つはすべて通っている")
`,
            },
            {
              caption: "失敗させてみる",
              note: "`strip()` を忘れた実装です。**どこで・何が違ったのか**が出ることを確かめてください。",
              // assert で止まることを見せる例（検証は止まることを確かめる）
              raises: true,
              code: `
def normalize(name):
    return name.lower()   # strip() を忘れている


assert normalize("SATO") == "sato"
assert normalize("  Yamada  ") == "yamada", "前後の空白が取れていない"

print("ここには来ない")
`,
            },
          ],
          exercise: {
            prompt: `
記事のタイトルを URL に使える形へ整える関数 \`to_slug(title)\` を作ってください。

| 仕様 | 例 |
|---|---|
| 前後の空白を取る | \`"  Hello  "\` → \`"hello"\` |
| 小文字にそろえる | \`"HELLO"\` → \`"hello"\` |
| 単語の間を \`-\` でつなぐ | \`"Hello World"\` → \`"hello-world"\` |
| 空白が続いても \`-\` は 1 つ | \`"a  b"\` → \`"a-b"\` |
| 空文字なら空文字 | \`""\` → \`""\` |

**そのうえで、自分で \`assert\` を 3 つ以上書いて確かめてください。**

> 採点では、あなたの \`assert\` を「受け取った文字列をそのまま返すだけ」の実装にも当てます。そこで止まらなければ、確かめたことになっていないという意味です。
`,
            starter: `
def to_slug(title):
    pass


# ここに assert を 3 つ以上書く
`,
            tests: `
import ast

g = globals()
f = g.get("to_slug")

check(callable(f), "to_slug という関数を定義できている")

if callable(f):
    got = f("  Hello World  ")
    check(got == "hello-world", "前後の空白を取り、小文字にして - でつなげる（今は {!r}）".format(got))

    got = f("Python  Testing 101")
    check(got == "python-testing-101", "空白が続いても - は 1 つになる（今は {!r}）".format(got))

    check(f("A") == "a", "1 文字でも動く")
    check(f("") == "", "空文字なら空文字を返す")

try:
    asserts = [n for n in ast.walk(ast.parse(_source())) if isinstance(n, ast.Assert)]
except SyntaxError:
    asserts = []

check(len(asserts) >= 3, "assert を 3 つ以上書いて自分で確かめている（今は {} 個）".format(len(asserts)))

# 個数だけ見ると assert True を並べても通ってしまう。
# 実装を「受け取った文字列をそのまま返すだけ」に差し替えて走らせ、
# 書いた assert がちゃんと気づけるかを見る。
NAIVE = """
def to_slug(title):
    return title
"""

if callable(f) and len(asserts) >= 3:
    import contextlib
    import io as _io

    caught = False
    try:
        with contextlib.redirect_stdout(_io.StringIO()):
            exec(compile(_replace_def(_source(), "to_slug", NAIVE), "<probe>", "exec"), {})
    except AssertionError:
        caught = True
    except Exception:
        caught = False

    check(caught, "書いた assert が、手抜きな実装（受け取った文字列を返すだけ）を見つけられる")
`,
            hint: "文字列を空白で区切るメソッドと、リストを区切り文字でつなぐメソッドを組み合わせると、連続した空白の扱いまで一度に片付きます。小文字にするのは先でも後でも構いません。",
            solution: `def to_slug(title):
    """タイトルを URL に使える形へ整える。"""
    return "-".join(title.lower().split())


assert to_slug("  Hello World  ") == "hello-world"
assert to_slug("Python  Testing 101") == "python-testing-101"
assert to_slug("A") == "a"
assert to_slug("") == ""

print("すべて通った")`,
            rejects: [
              {
                caption: "実装は正しいが、assert が何も確かめていない",
                code: `def to_slug(title):
    return "-".join(title.lower().split())


assert True
assert 1 == 1
assert to_slug("A") == to_slug("A")

print("すべて通った")`,
              },
            ],
          },
        },

        {
          id: "l2",
          title: "テストを関数に分ける",
          goal: "テストを名前つきの関数にまとめ、まとめて走らせる仕組みを自分で作る",
          body: `
\`assert\` を一列に並べていくと、すぐに行き詰まります。

~~~
assert to_slug("HELLO") == "hello"
assert to_slug("a  b") == "a-b"        # ← 上が落ちると、ここは走らない
assert to_slug("") == ""
~~~

**最初の失敗で止まってしまう**ので、「ほかはどうなのか」が分かりません。3 か所壊れていても、直して走らせ直して、を 3 回繰り返すことになります。

### テスト 1 件を関数 1 つにする

~~~
def test_lowercase():
    assert to_slug("HELLO") == "hello"


def test_empty():
    assert to_slug("") == ""
~~~

こうしておくと、

- **名前が仕様の説明になる**（\`test_empty\` = 空文字のときの決まり）
- 1 件ずつ独立して呼べるので、落ちても次を試せる
- 失敗したときに「どのテストが」落ちたか分かる

という 3 つが手に入ります。名前を \`test_\` で始めるのは、あとで出てくる pytest の約束事に合わせるためです。

### 集めて回す部分を書いてみる

テスト関数を並べても、誰かが呼ばないと動きません。「\`test_\` で始まる関数を集めて、順番に呼び、失敗を数える」——これを書くと、テストの仕組みが一気に腑に落ちます。

\`globals()\` は、いまの名前空間にある名前と値の辞書です。ここから \`test_\` で始まる関数を拾えます。

~~~
for name, value in globals().items():
    if name.startswith("test_") and callable(value):
        ...
~~~

失敗を受け止めるには \`try\` / \`except AssertionError\` を使います。1 件落ちても \`except\` で拾えば、ループは次へ進みます。

次のレッスンで使う pytest は、この「集めて回す」を本気で作り込んだものです。中身が想像できていると、出てくるレポートの意味が分かります。
`,
          examples: [
            {
              caption: "テストを関数に分けて、手で呼ぶ",
              code: `
def to_slug(title):
    return "-".join(title.lower().split())


def test_lowercase():
    assert to_slug("HELLO") == "hello"


def test_spaces_become_hyphen():
    assert to_slug("hello world") == "hello-world"


def test_empty():
    assert to_slug("") == ""


test_lowercase()
test_spaces_become_hyphen()
test_empty()
print("3 件すべて通った")
`,
            },
            {
              caption: "集めて回す部分を作る",
              note: "わざと 1 件だけ落ちるようにしています。**落ちても最後まで走る**ことを確かめてください。",
              code: `
def to_slug(title):
    return "-".join(title.lower().split())


def test_lowercase():
    assert to_slug("HELLO") == "hello"


def test_broken():
    assert to_slug("hello world") == "hello world", "- でつながっていない"


def test_empty():
    assert to_slug("") == ""


def run_all(namespace):
    """名前が test_ で始まる関数を集めて、順番に呼ぶ。"""
    passed = 0
    failed = 0

    for name in sorted(namespace):
        value = namespace[name]
        if not name.startswith("test_") or not callable(value):
            continue

        try:
            value()
        except AssertionError as error:
            failed += 1
            print("FAIL {}: {}".format(name, error))
        else:
            passed += 1
            print("ok   {}".format(name))

    print("\\n{} passed, {} failed".format(passed, failed))
    return passed, failed


run_all(globals())
`,
            },
          ],
          exercise: {
            prompt: `
ミニテストランナー \`run_tests(namespace)\` を作ってください。

1. \`namespace\`（名前と値の辞書）から、**名前が \`test_\` で始まる呼び出し可能なもの**だけを集める
2. 1 件ずつ呼ぶ。\`AssertionError\` が出たら失敗として数え、**止まらずに次へ進む**
3. \`(通った数, 落ちた数)\` のタプルを返す

動作確認用に \`test_\` で始まる関数もいくつか書いて、最後に \`run_tests(globals())\` を呼んでください。

> 途中の表示は自由です。採点は戻り値と挙動だけを見ます。
`,
            starter: `
def run_tests(namespace):
    pass


def test_add():
    assert 1 + 1 == 2


def test_upper():
    assert "a".upper() == "A"


run_tests(globals())
`,
            tests: `
g = globals()
f = g.get("run_tests")

check(callable(f), "run_tests という関数を定義できている")

if callable(f):
    def _ok_one():
        assert 1 + 1 == 2

    def _ok_two():
        assert "a".upper() == "A"

    def _ng():
        assert 1 == 2, "わざと落としている"

    result = f({
        "test_ok_one": _ok_one,
        "test_ok_two": _ok_two,
        "test_ng": _ng,
        "helper": _ok_one,
        "value": 3,
    })

    shaped = isinstance(result, tuple) and len(result) == 2
    check(shaped, "(通った数, 落ちた数) のタプルを返す（今は {!r}）".format(result))

    if shaped:
        check(tuple(result) == (2, 1), "通った 2 件・落ちた 1 件を数えられている（今は {}）".format(tuple(result)))

    calls = []

    def _spy():
        calls.append(1)

    f({"helper_not_a_test": _spy, "value": 1})
    check(len(calls) == 0, "test_ で始まらない名前は呼ばない")

    order = []

    def _first():
        order.append("first")
        assert False, "わざと落としている"

    def _second():
        order.append("second")

    f({"test_a_first": _first, "test_b_second": _second})
    check(order == ["first", "second"], "途中で落ちても残りのテストを続ける")
`,
            hint: "辞書から取り出すときは `namespace.items()`、あるいは `sorted(namespace)` で名前を順に見ます。呼び出し可能かどうかは `callable()` で判定できます。失敗を数えるには `try` / `except AssertionError` / `else` の 3 つを使うと素直に書けます。",
            solution: `def run_tests(namespace):
    """test_ で始まる関数を集めて順に実行し、(通った数, 落ちた数) を返す。"""
    passed = 0
    failed = 0

    for name in sorted(namespace):
        value = namespace[name]
        if not name.startswith("test_") or not callable(value):
            continue

        try:
            value()
        except AssertionError as error:
            failed += 1
            print("FAIL {}: {}".format(name, error))
        else:
            passed += 1
            print("ok   {}".format(name))

    print("{} passed, {} failed".format(passed, failed))
    return passed, failed


def test_add():
    assert 1 + 1 == 2


def test_upper():
    assert "a".upper() == "A"


run_tests(globals())`,
          },
        },

        {
          id: "l3",
          title: "pytest に任せる",
          goal: "本物の pytest を動かし、失敗レポートを読めるようにする",
          packages: ["pytest"],
          files: { "scores.py": SCORES_PY },
          body: `
自作のランナーで分かったとおり、やることは「集めて回して数える」だけです。とはいえ、失敗した式の中身を見せたり、特定のテストだけ走らせたりまで自分で作るのは骨が折れます。そこは **pytest** に任せます。

### 3 つの約束事

| | 約束 |
|---|---|
| ファイル名 | \`test_*.py\` または \`*_test.py\` |
| 関数名 | \`test_\` で始める |
| 検証 | \`assert\` をそのまま書く（専用のメソッドは要らない） |

### 手元での動かし方

~~~
pip install pytest
~~~

テストをファイルに保存して、プロジェクトの根元で \`pytest\` と打つだけです。

~~~
pytest                       # 全部
pytest -q                    # 結果だけ短く
pytest -v                    # 1 件ずつ名前を出す
pytest test_scores.py        # ファイルを指定
pytest test_scores.py::test_average    # 1 件だけ
~~~

### このアプリでの動かし方

このアプリのエディタはファイルが 1 枚しかないので、\`run_pytest()\` というヘルパーを用意しています。**いま書いているコードをそのままテストファイルとして保存して、pytest にかける**ものです。最後の行に置いてください。

~~~
def test_average():
    assert average([10, 20, 30]) == 20


run_pytest()          # 手元では pytest コマンドを叩くのと同じこと
run_pytest("-v")      # pytest に渡す引数はそのまま書ける
~~~

このレッスンでは、テスト対象として \`scores.py\` を置いてあります。

~~~
from scores import average, highest
~~~

| 関数 | 仕様 |
|---|---|
| \`average(scores)\` | 平均点。空のリストなら \`0\` |
| \`highest(scores)\` | 最高点。空のリストなら \`None\` |

### レポートの読み方

~~~
.F                                                    [100%]
=================== FAILURES ===================
_________________ test_average _________________

    def test_average():
>       assert average([10, 20, 30]) == 21
E       assert 20.0 == 21
E        +  where 20.0 = average([10, 20, 30])
~~~

- 1 行目の \`.\` は成功、\`F\` は失敗。1 文字が 1 テストです
- \`>\` の行が、落ちた \`assert\` そのもの
- \`E\` の行が、pytest が**式をほどいて見せてくれた中身**。\`assert 20.0 == 21\` と、その 20.0 がどこから来たのかまで出ます

この「式をほどく」機能があるので、\`assertEqual\` のような専用メソッドを覚える必要がありません。書くのは素の \`assert\` だけです。

> pytest はテストファイルを **import** して関数を集めます。つまりファイルのトップレベルは読み込みのときに 1 回動きます。表示を伴う処理をトップレベルに書くと二重に出るので、実験用の \`print\` は \`if __name__ == "__main__":\` の中に入れるか、テスト関数の中に置いてください。
`,
          examples: [
            {
              caption: "はじめての pytest",
              code: `
from scores import average, highest


def test_average():
    assert average([10, 20, 30]) == 20


def test_highest():
    assert highest([10, 20, 30]) == 30


run_pytest()
`,
            },
            {
              caption: "わざと落として、レポートを読む",
              note: "`average([])` は `0` を返す仕様です。ここでは **わざと `1` を期待して**、失敗レポートの形を見ます。",
              code: `
from scores import average


def test_average_of_three():
    assert average([10, 20, 30]) == 20


def test_average_of_empty():
    assert average([]) == 1     # わざと間違えている


run_pytest()
`,
            },
            {
              caption: "-v で 1 件ずつ見る",
              note: "テストが増えてくると、`.F` の羅列より `-v` のほうが読みやすくなります。",
              code: `
from scores import average, highest


def test_average_of_two():
    assert average([4, 6]) == 5


def test_average_of_empty_is_zero():
    assert average([]) == 0


def test_highest_of_empty_is_none():
    assert highest([]) is None


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
\`scores.py\` の \`average\` と \`highest\` に対して、**テスト関数を 3 つ以上**書いてください。

| 関数 | 仕様 |
|---|---|
| \`average(scores)\` | 平均点。空のリストなら \`0\` |
| \`highest(scores)\` | 最高点。空のリストなら \`None\` |

- 関数名は \`test_\` で始めること
- 最後の行で \`run_pytest()\` を呼び、**すべて通る**状態にすること
- 「その関数が本当に仕事をしているか」を確かめるテストにしてください（\`assert True\` のような中身のないテストは通りません）

> \`None\` との比較は \`== None\` ではなく \`is None\` を使うのが Python の作法です。
`,
            starter: `
from scores import average, highest


def test_average():
    assert average([10, 20, 30]) == ...


run_pytest()
`,
            tests: `
import ast

BROKEN = """
def average(scores):
    return 0


def highest(scores):
    return 0
"""

try:
    body = ast.parse(_source()).body
except SyntaxError:
    body = []

names = [n.name for n in body if isinstance(n, ast.FunctionDef) and n.name.startswith("test_")]
check(len(names) >= 3, "test_ で始まる関数を 3 つ以上書けている（今は {} 個）".format(len(names)))

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 3, "pytest が 3 件以上のテストを見つけている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    bad = run_pytest(source=_source(), modules={"scores": BROKEN}, quiet=True)
    check(
        len(bad.failed) > 0,
        "average と highest を壊した版では落ちる（＝中身を確かめられている）",
    )
`,
            hint: "代表的な値のほかに、仕様表に書かれている「空のリストのとき」も確かめると、テストとして意味のあるものになります。`highest([])` の期待値は `None` です。",
            solution: `from scores import average, highest


def test_average_of_three():
    assert average([10, 20, 30]) == 20


def test_average_of_empty_is_zero():
    assert average([]) == 0


def test_highest():
    assert highest([1, 9, 5]) == 9


def test_highest_of_empty_is_none():
    assert highest([]) is None


run_pytest()`,
          },
        },
      ],
    },

    /* ================= 第2章 ================= */
    {
      id: "ch2",
      title: "第2章　pytest の書き方",
      lessons: [
        {
          id: "l4",
          title: "何をテストするか",
          goal: "1 テスト 1 主張で書き、確かめる値を意図して選べるようにする",
          packages: ["pytest"],
          files: { "grading.py": GRADING_PY },
          body: `
pytest の書き方を覚えるのは 10 分で済みます。難しいのは「**何を**テストするか」です。

### 1 つのテストに詰め込まない

~~~
def test_to_grade():
    assert to_grade(90) == "A"
    assert to_grade(70) == "B"      # ← 上が落ちると、ここは走らない
    assert to_grade(30) == "C"
~~~

これは第1章の \`assert\` の羅列と同じ問題を抱えています。落ちた瞬間に残りが確かめられません。**テスト 1 つにつき主張は 1 つ**にして、名前でその主張を説明します。

~~~
def test_a_for_80_or_more():
    assert to_grade(90) == "A"


def test_b_for_60_to_79():
    assert to_grade(70) == "B"
~~~

### 準備・実行・検証の 3 段

テストの中身は、この順に並べると読みやすくなります（**AAA** と呼ばれます）。

| 段 | すること |
|---|---|
| Arrange（準備） | 入力やオブジェクトを用意する |
| Act（実行） | テスト対象を 1 回呼ぶ |
| Assert（検証） | 結果を確かめる |

~~~
def test_b_at_the_boundary():
    score = 60                    # 準備
    grade = to_grade(score)       # 実行
    assert grade == "B"           # 検証
~~~

短いテストなら 1 行で書いても構いません。大事なのは「**実行は 1 回だけ**」で、その前後が準備と検証に分かれていることです。

### どの値を選ぶか

無限にある入力から選ぶ基準は、だいたい 3 つに落ち着きます。

| 種類 | 例（\`to_grade\`） |
|---|---|
| 代表値 | \`90\`（A の真ん中）、\`70\`（B の真ん中） |
| **境界値** | \`80\`, \`79\`, \`60\`, \`59\`（判定が切り替わる境目） |
| 端と異常系 | \`0\`, \`100\`, \`-1\`, \`101\` |

バグが出るのは、たいてい**境界**です。\`>\` と \`>=\` を書き間違える、\`-1\` を足し忘れる。90 点のテストだけ書いても、この種のバグは 1 つも見つかりません。

このレッスンの \`grading.py\` の仕様はこうです。

| 点数 | 評価 |
|---|---|
| 80〜100 | \`"A"\` |
| 60〜79 | \`"B"\` |
| 0〜59 | \`"C"\` |
| 範囲外 | \`ValueError\` |

境界は **80 と 79**、**60 と 59** の 4 つ。ここを押さえるのが、このレッスンの主題です（\`ValueError\` の確かめ方は次のレッスンで扱います）。
`,
          examples: [
            {
              caption: "詰め込んだテスト",
              note: "落ちたのは 1 か所なのに、**残りが確かめられていない**ことに注目してください。",
              code: `
from grading import to_grade


def test_to_grade():
    assert to_grade(90) == "A"
    assert to_grade(79) == "A"    # わざと間違えている（正しくは "B"）
    assert to_grade(30) == "C"


run_pytest()
`,
            },
            {
              caption: "分けて、境界を押さえる",
              code: `
from grading import to_grade


def test_a_at_the_boundary():
    assert to_grade(80) == "A"


def test_b_just_below_a():
    assert to_grade(79) == "B"


def test_b_at_the_boundary():
    assert to_grade(60) == "B"


def test_c_just_below_b():
    assert to_grade(59) == "C"


def test_a_for_full_marks():
    assert to_grade(100) == "A"


def test_c_for_zero():
    assert to_grade(0) == "C"


run_pytest("-v")
`,
            },
            {
              caption: "境界を外すと、何も見つからない",
              note: "`>=` を `>` に書き間違えた実装です。**90 点と 30 点のテストだけなら通ってしまう**ことを確かめてください。",
              code: `
def to_grade(score):
    """わざと境界を間違えた版（>= のかわりに >）。"""
    if score > 80:
        return "A"
    if score > 60:
        return "B"
    return "C"


def test_representative_values_only():
    assert to_grade(90) == "A"
    assert to_grade(70) == "B"
    assert to_grade(30) == "C"


def test_the_boundaries():
    assert to_grade(80) == "A"     # ここで初めて気づける
    assert to_grade(60) == "B"


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
\`grading.py\` の \`to_grade\` に、**境界値を押さえたテスト**を書いてください。

| 点数 | 評価 |
|---|---|
| 80〜100 | \`"A"\` |
| 60〜79 | \`"B"\` |
| 0〜59 | \`"C"\` |

- テスト関数は **1 つにつき主張 1 つ**、4 つ以上
- 判定が切り替わる **4 つの境界**（80 / 79 / 60 / 59）を必ず含めること
- 最後の行で \`run_pytest()\` を呼び、すべて通る状態にすること
`,
            starter: `
from grading import to_grade


def test_a_at_the_boundary():
    assert to_grade(80) == ...


run_pytest()
`,
            tests: `
import ast

OFF_BY_ONE = """
def to_grade(score):
    if score < 0 or score > 100:
        raise ValueError("out of range")
    if score > 80:
        return "A"
    if score > 60:
        return "B"
    return "C"
"""

WRONG_LOW_END = """
def to_grade(score):
    if score < 0 or score > 100:
        raise ValueError("out of range")
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    return "B"
"""

try:
    body = ast.parse(_source()).body
except SyntaxError:
    body = []

names = [n.name for n in body if isinstance(n, ast.FunctionDef) and n.name.startswith("test_")]
check(len(names) >= 4, "テスト関数を 4 つ以上書けている（今は {} 個）".format(len(names)))

good = run_pytest(source=_source(), quiet=True)
check(good.ok and len(good.results) >= 4, "書いたテストが 4 件以上あり、すべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    bad = run_pytest(source=_source(), modules={"grading": OFF_BY_ONE}, quiet=True)
    check(
        len(bad.failed) > 0,
        ">= を > に書き間違えた版では落ちる（＝80 点と 60 点そのものを確かめている）",
    )

    bad = run_pytest(source=_source(), modules={"grading": WRONG_LOW_END}, quiet=True)
    check(
        len(bad.failed) > 0,
        "C を返すべきところで B を返す版では落ちる（＝59 点以下も確かめている）",
    )
`,
            hint: "境界は「切り替わる点」と「その 1 つ手前」の対で考えます。80 と 79 で 1 組、60 と 59 で 1 組。手前側を忘れると、`>=` と `>` の書き間違いは見つかりません。",
            solution: `from grading import to_grade


def test_a_at_the_boundary():
    assert to_grade(80) == "A"


def test_b_just_below_a():
    assert to_grade(79) == "B"


def test_b_at_the_boundary():
    assert to_grade(60) == "B"


def test_c_just_below_b():
    assert to_grade(59) == "C"


def test_a_for_full_marks():
    assert to_grade(100) == "A"


def test_c_for_zero():
    assert to_grade(0) == "C"


run_pytest("-v")`,
          },
        },

        {
          id: "l5",
          title: "例外と小数を確かめる",
          goal: "「エラーになること」と「だいたい等しいこと」をテストできるようにする",
          packages: ["pytest"],
          files: { "cart.py": CART_PY },
          body: `
戻り値を比べるだけでは足りない場面が 2 つあります。**例外**と**小数**です。

### 例外が上がることを確かめる

「人数に 0 を渡したら \`ValueError\`」も立派な仕様です。仕様なら、テストで守ります。

~~~
import pytest


def test_zero_people_is_an_error():
    with pytest.raises(ValueError):
        split_bill(1000, 0)
~~~

\`with pytest.raises(...)\` のブロックは、

- 中で指定した例外が上がったら **成功**
- 何も上がらなかったら **失敗**（\`DID NOT RAISE\`）
- 別の種類の例外が上がったら **失敗**（その例外がそのまま報告される）

という約束で動きます。「例外が出ないこと」を確かめたいときは、単に普通に呼ぶだけでよく、\`raises\` は要りません。

メッセージまで確かめたいときは \`match\` を足します。**正規表現で検索**されます。

~~~
with pytest.raises(ValueError, match="1 人以上"):
    split_bill(1000, 0)
~~~

上がった例外そのものを見たいときは \`as\` で受け取ります。

~~~
with pytest.raises(ValueError) as info:
    split_bill(1000, 0)

assert "人数" in str(info.value)
~~~

### 小数を == で比べない

Python の \`float\` は 2 進数の近似なので、こうなります。

~~~
>>> 0.1 + 0.2
0.30000000000000004
>>> 0.1 + 0.2 == 0.3
False
~~~

バグではなく、有限桁で小数を表す以上どうしようもないことです。テストでは \`pytest.approx\` を使います。

~~~
assert add_tax(300) == pytest.approx(330)
~~~

\`approx\` は既定で**相対誤差 1e-6** まで許します。絶対値で指定したいときは \`abs=\` を渡します。

~~~
assert split_bill(1000, 3) == pytest.approx(333.3333, abs=0.001)
~~~

リストや辞書もまとめて比べられます。

~~~
assert [0.1 + 0.2, 1.0] == pytest.approx([0.3, 1.0])
~~~

> お金を扱うなら、そもそも \`float\` を避けるのが本筋です。円単位の整数で持つか、\`decimal.Decimal\` を使います。\`approx\` は「小数で計算した結果を確かめる」ための道具で、設計の問題を消してくれるわけではありません。

このレッスンの \`cart.py\` はこうなっています。

| 関数 | 仕様 |
|---|---|
| \`add_tax(price, rate=0.1)\` | 税込価格。\`price\` が負なら \`ValueError\` |
| \`split_bill(total, people)\` | 1 人あたりの金額。\`people\` が 0 以下なら \`ValueError\` |
`,
          examples: [
            {
              caption: "小数はぴったり一致しない",
              code: `
print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)

print(300 * 1.1)
print(300 * 1.1 == 330)
`,
            },
            {
              caption: "approx で比べる",
              code: `
import pytest
from cart import add_tax


def test_tax_on_100():
    assert add_tax(100) == pytest.approx(110)


def test_tax_on_300():
    # == 330 と書くと落ちる。approx なら通る
    assert add_tax(300) == pytest.approx(330)


def test_tax_with_another_rate():
    assert add_tax(1000, rate=0.08) == pytest.approx(1080)


run_pytest("-v")
`,
            },
            {
              caption: "例外を確かめる",
              code: `
import pytest
from cart import add_tax, split_bill


def test_zero_people_is_an_error():
    with pytest.raises(ValueError):
        split_bill(1000, 0)


def test_error_message_mentions_the_rule():
    with pytest.raises(ValueError, match="1 人以上"):
        split_bill(1000, 0)


def test_negative_price_is_an_error():
    with pytest.raises(ValueError) as info:
        add_tax(-1)

    assert "負の数" in str(info.value)


run_pytest("-v")
`,
            },
            {
              caption: "例外が上がらないと失敗する",
              note: "正常に動く呼び出しを `raises` で囲んだ例です。`DID NOT RAISE` が出ることを確かめてください。",
              code: `
import pytest
from cart import split_bill


def test_this_one_fails():
    with pytest.raises(ValueError):
        split_bill(1000, 2)     # 正常に動くので、例外は上がらない


run_pytest()
`,
            },
          ],
          exercise: {
            prompt: `
\`cart.py\` に対して、次を含むテストを書いてください。

| 関数 | 仕様 |
|---|---|
| \`add_tax(price, rate=0.1)\` | 税込価格。\`price\` が負なら \`ValueError\` |
| \`split_bill(total, people)\` | 1 人あたりの金額。\`people\` が 0 以下なら \`ValueError\` |

1. \`pytest.approx\` を使って、\`add_tax\` の結果を確かめるテスト（**2 つ以上**）
2. \`pytest.raises\` を使って、\`add_tax\` と \`split_bill\` がそれぞれ \`ValueError\` を上げることを確かめるテスト
3. \`split_bill\` が正しく割れていることを確かめるテスト

最後の行で \`run_pytest()\` を呼び、すべて通る状態にしてください。
`,
            starter: `
import pytest
from cart import add_tax, split_bill


def test_tax_on_100():
    assert add_tax(100) == pytest.approx(...)


run_pytest()
`,
            tests: `
import ast

NO_GUARD = """
def add_tax(price, rate=0.1):
    return price * (1 + rate)


def split_bill(total, people):
    return total / people
"""

WRONG_TAX = """
def add_tax(price, rate=0.1):
    if price < 0:
        raise ValueError("価格に負の数は指定できません")
    return price * rate


def split_bill(total, people):
    if people <= 0:
        raise ValueError("人数は 1 人以上にしてください")
    return total / people
"""

try:
    tree = ast.parse(_source())
except SyntaxError:
    tree = None

used = set()
if tree is not None:
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute) and node.attr in ("approx", "raises"):
            used.add(node.attr)

check("approx" in used, "pytest.approx を使っている")
check("raises" in used, "pytest.raises を使っている")

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 4, "テストを 4 件以上書けている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    bad = run_pytest(source=_source(), modules={"cart": NO_GUARD}, quiet=True)
    check(
        len(bad.failed) >= 2,
        "ValueError のチェックを外した版では 2 件以上落ちる（今は {} 件）".format(len(bad.failed)),
    )

    bad = run_pytest(source=_source(), modules={"cart": WRONG_TAX}, quiet=True)
    check(
        len(bad.failed) > 0,
        "税込計算を壊した版では落ちる（＝金額そのものを確かめている）",
    )
`,
            hint: "`add_tax(100)` の期待値は 110、`add_tax(300)` なら 330 です。どちらも `==` では落ちるので、期待値のほうを `pytest.approx` で包みます。例外のテストは、本文の `raises` のブロックの中でわざと不正な引数（負の価格、0 人）を渡す形になります。",
            solution: `import pytest
from cart import add_tax, split_bill


def test_tax_on_100():
    assert add_tax(100) == pytest.approx(110)


def test_tax_on_300():
    assert add_tax(300) == pytest.approx(330)


def test_tax_with_another_rate():
    assert add_tax(1000, rate=0.08) == pytest.approx(1080)


def test_negative_price_is_an_error():
    with pytest.raises(ValueError):
        add_tax(-1)


def test_zero_people_is_an_error():
    with pytest.raises(ValueError, match="1 人以上"):
        split_bill(1000, 0)


def test_split_bill_divides_evenly():
    assert split_bill(1000, 4) == pytest.approx(250)


def test_split_bill_with_a_remainder():
    assert split_bill(1000, 3) == pytest.approx(333.3333, abs=0.001)


run_pytest("-v")`,
          },
        },

        {
          id: "l6",
          title: "同じテストを値だけ変えて回す",
          goal: "parametrize で表をそのままテストにする",
          packages: ["pytest"],
          files: { "grading.py": GRADING_PY },
          body: `
前のレッスンで書いた \`to_grade\` のテストを思い出してください。

~~~
def test_a_at_the_boundary():
    assert to_grade(80) == "A"


def test_b_just_below_a():
    assert to_grade(79) == "B"


def test_b_at_the_boundary():
    assert to_grade(60) == "B"
~~~

**形はまったく同じで、値だけが違います**。境界を 1 つ足すたびに 4 行のコピペが増え、\`to_grade\` の呼び出し方が変わったら全部直すことになります。

### @pytest.mark.parametrize

~~~
import pytest


@pytest.mark.parametrize(
    "score, expected",
    [
        (100, "A"),
        (80, "A"),
        (79, "B"),
        (60, "B"),
        (59, "C"),
        (0, "C"),
    ],
)
def test_to_grade(score, expected):
    assert to_grade(score) == expected
~~~

第 1 引数が**引数名の並び**（カンマ区切りの文字列）、第 2 引数が**値の組のリスト**です。テスト関数は同じ名前の引数で値を受け取ります。

これは「6 回ループする 1 つのテスト」ではなく、**6 つの独立したテスト**になります。だから

- 1 つ落ちても残りは走る
- レポートに \`test_to_grade[79-B]\` のように**落ちた値が出る**

という、コピペ版と同じ利点を保ったまま短く書けます。ループで書くとこの 2 つを失うので、\`for\` で回すのではなく \`parametrize\` を使ってください。

### 名前を付ける

値がそのまま名前になると読みにくいときは \`ids\` を渡します。

~~~
@pytest.mark.parametrize(
    "score, expected",
    [(100, "A"), (80, "A"), (79, "B")],
    ids=["full-marks", "a-boundary", "just-below-a"],
)
~~~

\`pytest -v\` の出力が \`test_to_grade[a-boundary]\` になり、落ちたときに何のケースか一目で分かります。

### 使いどころ

| 向いている | 向いていない |
|---|---|
| 入力と期待値の対応が**表で書ける** | ケースごとに準備の手順が違う |
| 境界値をまとめて並べたい | ケースごとに確かめたいことが別 |

「表にできるか」が判断の目安です。表にならないものを無理に \`parametrize\` へ押し込むと、\`if\` の入ったテストになって読めなくなります。そのときは素直に別のテストとして書きます。
`,
          examples: [
            {
              caption: "コピペを 1 つにまとめる",
              code: `
import pytest
from grading import to_grade


@pytest.mark.parametrize(
    "score, expected",
    [
        (100, "A"),
        (80, "A"),
        (79, "B"),
        (60, "B"),
        (59, "C"),
        (0, "C"),
    ],
)
def test_to_grade(score, expected):
    assert to_grade(score) == expected


run_pytest("-v")
`,
            },
            {
              caption: "落ちた値がレポートに出る",
              note: "2 つ目をわざと間違えています。`test_to_grade[60-A]` のように、**どの値で落ちたか**が出ます。",
              code: `
import pytest
from grading import to_grade


@pytest.mark.parametrize(
    "score, expected",
    [
        (80, "A"),
        (60, "A"),    # わざと間違えている（正しくは "B"）
        (0, "C"),
    ],
)
def test_to_grade(score, expected):
    assert to_grade(score) == expected


run_pytest()
`,
            },
            {
              caption: "ids で名前を付ける",
              code: `
import pytest
from grading import to_grade


@pytest.mark.parametrize(
    "score, expected",
    [
        (100, "A"),
        (80, "A"),
        (79, "B"),
        (59, "C"),
    ],
    ids=["full-marks", "a-boundary", "just-below-a", "just-below-b"],
)
def test_to_grade(score, expected):
    assert to_grade(score) == expected


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
\`grading.py\` の \`to_grade\` のテストを、**\`@pytest.mark.parametrize\` を使って 1 つのテスト関数**にまとめてください。

| 点数 | 評価 |
|---|---|
| 80〜100 | \`"A"\` |
| 60〜79 | \`"B"\` |
| 0〜59 | \`"C"\` |

- 値の組は **6 つ以上**。4 つの境界（80 / 79 / 60 / 59）を必ず含めること
- 最後の行で \`run_pytest()\` を呼び、すべて通る状態にすること
`,
            starter: `
import pytest
from grading import to_grade


@pytest.mark.parametrize(
    "score, expected",
    [
        (80, "A"),
    ],
)
def test_to_grade(score, expected):
    assert to_grade(score) == expected


run_pytest("-v")
`,
            tests: `
import ast

OFF_BY_ONE = """
def to_grade(score):
    if score < 0 or score > 100:
        raise ValueError("out of range")
    if score > 80:
        return "A"
    if score > 60:
        return "B"
    return "C"
"""

WRONG_LOW_END = """
def to_grade(score):
    if score < 0 or score > 100:
        raise ValueError("out of range")
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    return "B"
"""

try:
    tree = ast.parse(_source())
except SyntaxError:
    tree = None

parametrized = False
if tree is not None:
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute) and node.attr == "parametrize":
            parametrized = True

check(parametrized, "@pytest.mark.parametrize を使っている")

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 6, "値の組が 6 つ以上ある（pytest が数えたテストは {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    bad = run_pytest(source=_source(), modules={"grading": OFF_BY_ONE}, quiet=True)
    check(
        len(bad.failed) > 0,
        ">= を > に書き間違えた版では落ちる（＝80 点と 60 点そのものが表に入っている）",
    )

    bad = run_pytest(source=_source(), modules={"grading": WRONG_LOW_END}, quiet=True)
    check(
        len(bad.failed) > 0,
        "C を返すべきところで B を返す版では落ちる（＝59 点以下も表に入っている）",
    )
`,
            hint: "本文の表をそのまま `(点数, 期待する評価)` のタプルの並びに写すのが近道です。境界は「切り替わる点」と「その 1 つ手前」を対で入れてください。",
            solution: `import pytest
from grading import to_grade


@pytest.mark.parametrize(
    "score, expected",
    [
        (100, "A"),
        (80, "A"),
        (79, "B"),
        (60, "B"),
        (59, "C"),
        (0, "C"),
    ],
    ids=[
        "full-marks",
        "a-boundary",
        "just-below-a",
        "b-boundary",
        "just-below-b",
        "zero",
    ],
)
def test_to_grade(score, expected):
    assert to_grade(score) == expected


run_pytest("-v")`,
          },
        },

        {
          id: "l7",
          title: "前準備をフィクスチャにまとめる",
          goal: "準備と後片付けを共有しつつ、テストどうしを独立させる",
          packages: ["pytest"],
          files: { "todo.py": TODO_PY },
          body: `
テスト対象がオブジェクトだと、毎回同じ準備から始まります。

~~~
def test_two_items():
    todos = TodoList()
    todos.add("牛乳を買う")
    todos.add("郵便を出す")
    assert len(todos) == 2


def test_done():
    todos = TodoList()          # ← 同じ 3 行
    todos.add("牛乳を買う")
    todos.add("郵便を出す")
    todos.done(1)
    assert todos.remaining() == ["郵便を出す"]
~~~

この重複を、**モジュール変数に切り出して共有してはいけません**。前のテストが変更した状態が次のテストに漏れ、実行順で結果が変わるテストができあがります。欲しいのは「共有」ではなく「**毎回作り直す**」です。

### @pytest.fixture

~~~
import pytest


@pytest.fixture
def todos():
    """2 件入った TodoList を返す。"""
    todo_list = TodoList()
    todo_list.add("牛乳を買う")
    todo_list.add("郵便を出す")
    return todo_list


def test_two_items(todos):          # ← 引数名がフィクスチャ名
    assert len(todos) == 2


def test_done(todos):               # ← こちらには別の TodoList が渡る
    todos.done(1)
    assert todos.remaining() == ["郵便を出す"]
~~~

**テスト関数の引数名を見て、pytest が同じ名前のフィクスチャを呼び、戻り値を渡します**。しかも既定では**テストごとに 1 回ずつ呼ばれる**ので、テストは互いに影響しません。

### 後片付けは yield のあとに書く

\`return\` のかわりに \`yield\` を使うと、テストが終わったあとに続きが実行されます。

~~~
@pytest.fixture
def connection():
    conn = connect()
    yield conn          # ← ここでテストが走る
    conn.close()        # ← テストが落ちても実行される
~~~

### 組み込みのフィクスチャ

自分で定義しなくても使えるものがあります。よく使うのはこの 3 つです。

| 名前 | 何をくれるか |
|---|---|
| \`tmp_path\` | テストごとに空の一時ディレクトリ（\`pathlib.Path\`） |
| \`monkeypatch\` | 値や関数を一時的に差し替える道具（次のレッスンで扱います） |
| \`capsys\` | \`print\` された内容を取り出す |

\`tmp_path\` は「ファイルを扱うコードのテスト」で効きます。実在するファイルを触らずに済み、後片付けも pytest がやってくれます。

~~~
def test_write(tmp_path):
    path = tmp_path / "out.txt"
    save(path, "hello")
    assert path.read_text(encoding="utf-8") == "hello"
~~~

### 使い回す範囲

| 置き場所 | 使える範囲 |
|---|---|
| テストファイルの中 | そのファイルだけ |
| \`conftest.py\` | 同じディレクトリ以下のすべてのテストファイル |

複数のテストファイルで共有したくなったら、\`conftest.py\` に移します。import は要りません（pytest が自動で読み込みます）。

\`scope\` を渡すと呼ばれる回数を変えられますが（\`"module"\`, \`"session"\` など）、共有する範囲を広げるほど「テストが互いに影響しない」性質が壊れます。**まずは既定のまま**にして、重い準備で困ってから考えるのが安全です。

このレッスンの \`todo.py\` はこうなっています。

| メソッド | 仕様 |
|---|---|
| \`add(title)\` | 項目を足して件数を返す。空文字なら \`ValueError\` |
| \`done(number)\` | \`number\` 番目（1 から数える）を完了にする |
| \`remaining()\` | まだ終わっていない項目のタイトルのリスト |
| \`len(todos)\` | 項目の総数 |
`,
          examples: [
            {
              caption: "準備が重複している",
              code: `
from todo import TodoList


def test_two_items():
    todos = TodoList()
    todos.add("牛乳を買う")
    todos.add("郵便を出す")
    assert len(todos) == 2


def test_done_removes_from_remaining():
    todos = TodoList()
    todos.add("牛乳を買う")
    todos.add("郵便を出す")
    todos.done(1)
    assert todos.remaining() == ["郵便を出す"]


run_pytest()
`,
            },
            {
              caption: "フィクスチャに切り出す",
              note: "2 つ目のテストが 1 番目を完了にしても、**3 つ目には影響しません**。毎回作り直されているからです。",
              code: `
import pytest
from todo import TodoList


@pytest.fixture
def todos():
    """2 件入った TodoList を返す。"""
    todo_list = TodoList()
    todo_list.add("牛乳を買う")
    todo_list.add("郵便を出す")
    return todo_list


def test_two_items(todos):
    assert len(todos) == 2


def test_done_removes_from_remaining(todos):
    todos.done(1)
    assert todos.remaining() == ["郵便を出す"]


def test_nothing_is_done_at_first(todos):
    assert todos.remaining() == ["牛乳を買う", "郵便を出す"]


run_pytest("-v")
`,
            },
            {
              caption: "tmp_path と、yield での後片付け",
              note: "`-s` を付けると、後片付けの `print` まで見えます。",
              code: `
import pytest


@pytest.fixture
def logfile(tmp_path):
    path = tmp_path / "app.log"
    path.write_text("start\\n", encoding="utf-8")
    print("用意した:", path.name)
    yield path
    print("後片付け:", path.name)


def test_append(logfile):
    with open(logfile, "a", encoding="utf-8") as f:
        f.write("done\\n")

    assert logfile.read_text(encoding="utf-8").splitlines() == ["start", "done"]


def test_starts_with_one_line(logfile):
    assert logfile.read_text(encoding="utf-8") == "start\\n"


run_pytest("-v", "-s")
`,
            },
          ],
          exercise: {
            prompt: `
\`todo.py\` の \`TodoList\` のテストを、**フィクスチャを使って**書いてください。

1. \`@pytest.fixture\` で「項目が 2 件入った \`TodoList\`」を返すフィクスチャを定義する
2. そのフィクスチャを使うテストを **3 つ以上**書く
3. そのうち 1 つは、\`done()\` を呼んだあとに \`remaining()\` がどうなるかを確かめること
4. 空文字を \`add()\` したら \`ValueError\` になることも確かめること

最後の行で \`run_pytest()\` を呼び、すべて通る状態にしてください。

| メソッド | 仕様 |
|---|---|
| \`add(title)\` | 項目を足して件数を返す。空文字なら \`ValueError\` |
| \`done(number)\` | \`number\` 番目（1 から数える）を完了にする |
| \`remaining()\` | まだ終わっていない項目のタイトルのリスト |
| \`len(todos)\` | 項目の総数 |
`,
            starter: `
import pytest
from todo import TodoList


@pytest.fixture
def todos():
    todo_list = TodoList()
    ...
    return todo_list


def test_two_items(todos):
    assert len(todos) == ...


run_pytest("-v")
`,
            tests: `
import ast

BROKEN_TODO = """
class TodoList:
    def __init__(self):
        self._items = []

    def add(self, title):
        if not title.strip():
            raise ValueError("タイトルは空にできません")
        self._items.append({"title": title, "done": False})
        return len(self._items)

    def done(self, number):
        pass

    def remaining(self):
        return [item["title"] for item in self._items]

    def __len__(self):
        return len(self._items)
"""

NO_VALIDATION = """
class TodoList:
    def __init__(self):
        self._items = []

    def add(self, title):
        self._items.append({"title": title, "done": False})
        return len(self._items)

    def done(self, number):
        self._items[number - 1]["done"] = True

    def remaining(self):
        return [item["title"] for item in self._items if not item["done"]]

    def __len__(self):
        return len(self._items)
"""

try:
    tree = ast.parse(_source())
    body = tree.body
except SyntaxError:
    tree = None
    body = []

fixtures = []
for node in body:
    if not isinstance(node, ast.FunctionDef):
        continue
    for decorator in node.decorator_list:
        target = decorator.func if isinstance(decorator, ast.Call) else decorator
        if isinstance(target, ast.Attribute) and target.attr == "fixture":
            fixtures.append(node.name)

check(len(fixtures) >= 1, "@pytest.fixture でフィクスチャを定義できている")

users = 0
for node in body:
    if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
        params = [a.arg for a in node.args.args]
        if any(name in params for name in fixtures):
            users += 1

check(users >= 3, "フィクスチャを引数で受け取るテストが 3 つ以上ある（今は {} 個）".format(users))

good = run_pytest(source=_source(), quiet=True)
check(good.ok and len(good.results) >= 3, "書いたテストが 3 件以上あり、すべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    bad = run_pytest(source=_source(), modules={"todo": BROKEN_TODO}, quiet=True)
    check(
        len(bad.failed) > 0,
        "done() が効かない版では落ちる（＝完了にしたあとの remaining() を確かめている）",
    )

    bad = run_pytest(source=_source(), modules={"todo": NO_VALIDATION}, quiet=True)
    check(
        len(bad.failed) > 0,
        "空のタイトルを弾かない版では落ちる（＝ValueError も確かめている）",
    )
`,
            hint: "フィクスチャの名前と、テスト関数の引数名をそろえるのがポイントです。例外のテストは、前のレッスンで使った `raises` のブロックの中で、空白だけのタイトルを `add()` に渡す形になります。フィクスチャは例外のテストからも受け取れます。",
            solution: `import pytest
from todo import TodoList


@pytest.fixture
def todos():
    """2 件入った TodoList を返す。"""
    todo_list = TodoList()
    todo_list.add("牛乳を買う")
    todo_list.add("郵便を出す")
    return todo_list


def test_two_items(todos):
    assert len(todos) == 2


def test_nothing_is_done_at_first(todos):
    assert todos.remaining() == ["牛乳を買う", "郵便を出す"]


def test_done_removes_from_remaining(todos):
    todos.done(1)
    assert todos.remaining() == ["郵便を出す"]


def test_adding_returns_the_count(todos):
    assert todos.add("ゴミを出す") == 3


def test_empty_title_is_an_error(todos):
    with pytest.raises(ValueError):
        todos.add("   ")


run_pytest("-v")`,
          },
        },
      ],
    },

    /* ================= 第3章 ================= */
    {
      id: "ch3",
      title: "第3章　外部依存とカバレッジ",
      lessons: [
        {
          id: "l8",
          title: "外部依存を切り離す",
          goal: "時刻や通信に依存するコードを、確実に動くテストで囲む",
          packages: ["pytest"],
          files: { "reminder.py": REMINDER_PY },
          body: `
次の関数は、テストが書けません。

~~~
def is_overdue(deadline):
    return deadline < datetime.now()
~~~

書けないのは、\`datetime.now()\` が**呼ぶたびに違う値を返す**からです。「2026年5月1日を過ぎているか」のテストは、明日には意味が変わってしまいます。同じ困り方をするものを並べると、こうなります。

| 依存先 | 何が困るか |
|---|---|
| 現在時刻・日付 | 毎回違う。日付が変わると結果が変わる |
| ネットワーク | 遅い。相手が落ちていると自分のテストが赤くなる |
| 乱数 | 毎回違う |
| ファイル・DB | 前のテストの結果が残る |
| メール送信など | テストのたびに本当に送ってしまう |

対策は「**テストのあいだだけ、別のものに差し替える**」です。

### monkeypatch で差し替える

\`monkeypatch\` は pytest の組み込みフィクスチャで、**テストが終わると自動で元に戻します**。

~~~
def test_is_overdue(monkeypatch):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 5, 1))

    assert reminder.is_overdue(datetime(2026, 4, 30)) is True
    assert reminder.is_overdue(datetime(2026, 5, 2)) is False
~~~

ここで大事なのは、\`reminder.py\` が \`datetime.now()\` を直接呼ばず、**\`now()\` という自前の関数を経由している**ことです。

~~~
def now():
    return datetime.now()


def is_overdue(deadline):
    return deadline < now()      # ← ここが差し替えの継ぎ目になる
~~~

差し替えたい境界に、自分の名前を付けておく。これだけでテストしやすさが変わります。

> 差し替えるのは「**使う側のモジュールが持っている名前**」です。\`reminder.py\` が \`from datetime import datetime\` していると、その名前は \`reminder.datetime\` として存在します。\`monkeypatch.setattr("datetime.datetime", ...)\` のように大元を書き換えようとすると、思ったところに効きません。

### Mock で「呼ばれ方」を見る

戻り値ではなく、**どう呼ばれたか**を確かめたいことがあります。「期限切れのタスクだけ通知したか」は、送信関数の呼ばれ方に現れます。

~~~
from unittest.mock import Mock

sender = Mock(return_value=True)
monkeypatch.setattr(reminder, "send", sender)

reminder.notify_overdue(tasks)

sender.assert_called_once_with("期限切れ: 請求書")
~~~

\`Mock\` は「呼ばれたことを記録するだけの、何にでもなれる代役」です。よく使う確かめ方はこの 4 つです。

| | 意味 |
|---|---|
| \`mock.assert_called_once_with(...)\` | ちょうど 1 回、その引数で呼ばれた |
| \`mock.assert_not_called()\` | 一度も呼ばれていない |
| \`mock.call_count\` | 呼ばれた回数 |
| \`mock.call_args_list\` | 呼ばれたときの引数を順に並べたリスト |

### やりすぎない

モックは強力なので、使いすぎると**実装の書き方をテストに焼き付けてしまいます**。内部の関数名を変えただけでテストが赤くなるなら、モックしすぎのサインです。

目安はこうです。

- **外の世界との境界**（通信・時刻・送信）は差し替える
- **自分の計算ロジック**は差し替えない。本物を通す

このレッスンの \`reminder.py\` はこうなっています。

| 関数 | 仕様 |
|---|---|
| \`now()\` | 現在時刻。テストで差し替える継ぎ目 |
| \`send(message)\` | 通知を送る。テストで差し替える継ぎ目 |
| \`is_overdue(deadline)\` | \`deadline\` が \`now()\` より前なら \`True\` |
| \`notify_overdue(tasks)\` | 期限切れのタスクを \`send\` して、その件数を返す |

\`tasks\` は \`{"title": ..., "deadline": datetime}\` の辞書のリストです。
`,
          examples: [
            {
              caption: "差し替えないと、結果が日によって変わる",
              code: `
from datetime import datetime
import reminder


print("いまの時刻:", reminder.now())
print("2026-05-01 は過ぎている？", reminder.is_overdue(datetime(2026, 5, 1)))
print("2099-01-01 は過ぎている？", reminder.is_overdue(datetime(2099, 1, 1)))
`,
            },
            {
              caption: "monkeypatch で時刻を固定する",
              code: `
from datetime import datetime
import reminder


def test_overdue_when_deadline_has_passed(monkeypatch):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 5, 1, 12, 0))

    assert reminder.is_overdue(datetime(2026, 4, 30, 12, 0)) is True


def test_not_overdue_when_deadline_is_ahead(monkeypatch):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 5, 1, 12, 0))

    assert reminder.is_overdue(datetime(2026, 5, 2, 12, 0)) is False


def test_the_original_is_restored():
    # 前のテストの差し替えは、もう元に戻っている
    assert reminder.now().year >= 2024


run_pytest("-v")
`,
            },
            {
              caption: "Mock で呼ばれ方を確かめる",
              code: `
from datetime import datetime
from unittest.mock import Mock
import pytest
import reminder


@pytest.fixture
def tasks():
    return [
        {"title": "請求書を出す", "deadline": datetime(2026, 4, 1)},
        {"title": "掃除する", "deadline": datetime(2026, 6, 1)},
    ]


def test_only_overdue_tasks_are_sent(monkeypatch, tasks):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 5, 1))
    sender = Mock(return_value=True)
    monkeypatch.setattr(reminder, "send", sender)

    count = reminder.notify_overdue(tasks)

    assert count == 1
    sender.assert_called_once_with("期限切れ: 請求書を出す")


def test_nothing_is_sent_when_all_deadlines_are_ahead(monkeypatch, tasks):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 1, 1))
    sender = Mock(return_value=True)
    monkeypatch.setattr(reminder, "send", sender)

    count = reminder.notify_overdue(tasks)

    assert count == 0
    sender.assert_not_called()


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
\`reminder.py\` の \`notify_overdue\` のテストを書いてください。

1. \`monkeypatch\` で \`reminder.now\` を**固定した時刻**に差し替える
2. \`monkeypatch\` で \`reminder.send\` を \`Mock\` に差し替える
3. 期限切れが混ざったタスクのリストを渡して、**戻り値の件数**と**送信の呼ばれ方**を確かめる
4. 「1 件も期限切れがない」ケースも確かめる（\`assert_not_called()\` が使えます）

テストは **3 つ以上**、最後の行で \`run_pytest()\` を呼び、すべて通る状態にしてください。

| 関数 | 仕様 |
|---|---|
| \`notify_overdue(tasks)\` | 期限切れのタスクを \`send("期限切れ: タイトル")\` して、件数を返す |

\`tasks\` は \`{"title": ..., "deadline": datetime}\` の辞書のリストです。
`,
            starter: `
from datetime import datetime
from unittest.mock import Mock
import reminder


def test_only_overdue_tasks_are_sent(monkeypatch):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 5, 1))
    sender = Mock(return_value=True)
    monkeypatch.setattr(reminder, "send", sender)

    tasks = [
        {"title": "請求書を出す", "deadline": datetime(2026, 4, 1)},
        {"title": "掃除する", "deadline": datetime(2026, 6, 1)},
    ]

    count = reminder.notify_overdue(tasks)

    assert count == ...


run_pytest("-v")
`,
            tests: `
import ast

NOTIFY_EVERYTHING = """
from datetime import datetime


def now():
    return datetime.now()


def send(message):
    print("送信:", message)
    return True


def is_overdue(deadline):
    return deadline < now()


def notify_overdue(tasks):
    count = 0
    for task in tasks:
        send("期限切れ: {}".format(task["title"]))
        count += 1
    return count
"""

NOTIFY_NOTHING = """
from datetime import datetime


def now():
    return datetime.now()


def send(message):
    print("送信:", message)
    return True


def is_overdue(deadline):
    return deadline < now()


def notify_overdue(tasks):
    return 0
"""

try:
    body = ast.parse(_source()).body
except SyntaxError:
    body = []

patched = 0
for node in body:
    if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
        if "monkeypatch" in [a.arg for a in node.args.args]:
            patched += 1

check(patched >= 2, "monkeypatch を受け取るテストが 2 つ以上ある（今は {} 個）".format(patched))

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 3, "テストを 3 件以上書けている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    bad = run_pytest(source=_source(), modules={"reminder": NOTIFY_EVERYTHING}, quiet=True)
    check(
        len(bad.failed) > 0,
        "期限を見ずに全件通知する版では落ちる（＝通知しすぎを検出できている）",
    )

    bad = run_pytest(source=_source(), modules={"reminder": NOTIFY_NOTHING}, quiet=True)
    check(
        len(bad.failed) > 0,
        "1 件も通知しない版では落ちる（＝通知漏れを検出できている）",
    )
`,
            hint: "差し替えるのは `reminder` モジュールが持っている名前（`reminder.now` と `reminder.send`）です。固定する時刻は、タスクの期限の「あいだ」に置くと、期限切れとそうでないものが混ざって都合がよくなります。",
            solution: `from datetime import datetime
from unittest.mock import Mock
import pytest
import reminder


@pytest.fixture
def tasks():
    return [
        {"title": "請求書を出す", "deadline": datetime(2026, 4, 1)},
        {"title": "掃除する", "deadline": datetime(2026, 6, 1)},
    ]


def test_only_overdue_tasks_are_sent(monkeypatch, tasks):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 5, 1))
    sender = Mock(return_value=True)
    monkeypatch.setattr(reminder, "send", sender)

    count = reminder.notify_overdue(tasks)

    assert count == 1
    sender.assert_called_once_with("期限切れ: 請求書を出す")


def test_nothing_is_sent_when_all_deadlines_are_ahead(monkeypatch, tasks):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 1, 1))
    sender = Mock(return_value=True)
    monkeypatch.setattr(reminder, "send", sender)

    count = reminder.notify_overdue(tasks)

    assert count == 0
    sender.assert_not_called()


def test_all_tasks_are_sent_when_every_deadline_has_passed(monkeypatch, tasks):
    monkeypatch.setattr(reminder, "now", lambda: datetime(2026, 12, 1))
    sender = Mock(return_value=True)
    monkeypatch.setattr(reminder, "send", sender)

    count = reminder.notify_overdue(tasks)

    assert count == 2
    assert sender.call_count == 2


run_pytest("-v")`,
          },
        },

        {
          id: "l9",
          title: "テストしやすい設計",
          goal: "テストの書きにくさを、設計を直す合図として読む",
          packages: ["pytest"],
          files: { "orders.txt": ORDERS_TXT },
          body: `
前のレッスンで、\`now()\` という継ぎ目があるだけでテストが書けるようになりました。逆に言えば、**テストが書きにくいコードには理由がある**ということです。書きにくさは腕の問題ではなく、設計からの合図です。

### 書きにくさのサイン

| サイン | 何が起きているか |
|---|---|
| 引数が同じなのに結果が変わる | 外の状態（時刻・グローバル変数）に依存している |
| 準備が 10 行必要 | 依存が多すぎる。責務が混ざっている |
| 戻り値がなく \`print\` するだけ | 結果を受け取る手段がない |
| ファイルや DB を用意しないと呼べない | 計算と入出力が同じ関数に同居している |
| テストのために内部を覗きたくなる | 外から見える形になっていない |

### 混ざっているものを分ける

~~~
def report(path):
    total = 0
    with open(path, encoding="utf-8") as f:      # 入力
        for line in f:
            name, price = line.split(",")        # 解釈
            total += int(price)                  # 計算
    print("合計:", total)                        # 出力
~~~

1 つの関数が、入力・解釈・計算・出力の 4 役をやっています。合計の計算を確かめたいだけなのに、**毎回ファイルを用意して、print を読み取る**必要があります。

分けるとこうなります。

~~~
def parse_lines(lines):
    """行の並びを [(名前, 金額), ...] にする。"""
    ...


def total_price(items):
    """金額を合計する。"""
    ...


def report(path):
    """入出力はここだけ。計算は上の 2 つに任せる。"""
    with open(path, encoding="utf-8") as f:
        items = parse_lines(f)
    print("合計:", total_price(items))
~~~

\`parse_lines\` と \`total_price\` は、**引数だけで結果が決まり、外に影響を与えません**（純粋関数）。ファイルも時刻もモックも要らず、値を渡して戻り値を見るだけでテストできます。

### 入出力は薄く、外側に

理想の形はこうです。

~~~
入力を読む  →  値を計算する（ここが厚い・テストしやすい）  →  結果を書く
~~~

外の世界に触る部分（ファイル、通信、print）は薄く、**端に寄せる**。真ん中の計算を分厚くする。こうすると、テストの量とバグの量が釣り合ってくれます。端の薄い部分は、前のレッスンのモックで押さえます。

### 依存は引数で受け取る

関数の中で直接呼ぶのではなく、外から渡せるようにしておくのも同じ考え方です。

~~~
def notify(tasks, sender=send, clock=now):
    """sender と clock を差し替えられるようにしておく。"""
    ...
~~~

こうしておくと、テストは \`monkeypatch\` を使わずに \`notify(tasks, sender=fake)\` と書けます。差し替えの継ぎ目を**引数として設計に出す**やり方です。

> どちらが良いかは場合によります。引数に出すと呼び出し側が増えて煩雑になることもあるので、まずは \`monkeypatch\` で十分です。大事なのは「継ぎ目がどこにあるか」を意識して書くことです。
`,
          examples: [
            {
              caption: "全部やっている関数",
              note: "合計だけ確かめたいのに、ファイルが必要で、結果は `print` にしか出てきません。",
              code: `
def report(path):
    total = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            name, price = line.split(",")
            total += int(price)
    print("合計:", total)


report("orders.txt")
`,
            },
            {
              caption: "分けてからテストする",
              code: `
def parse_lines(lines):
    """行の並びを [(名前, 金額), ...] にする。空行は飛ばす。"""
    items = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        name, price = line.split(",")
        items.append((name, int(price)))
    return items


def total_price(items):
    """金額を合計する。"""
    return sum(price for _, price in items)


def report(path):
    """入出力はここだけ。"""
    with open(path, encoding="utf-8") as f:
        items = parse_lines(f)
    print("合計:", total_price(items))


def test_parse_lines_skips_blank_lines():
    assert parse_lines(["牛乳,180", "", "パン,240"]) == [("牛乳", 180), ("パン", 240)]


def test_total_price():
    assert total_price([("牛乳", 180), ("パン", 240)]) == 420


def test_total_price_of_nothing_is_zero():
    assert total_price([]) == 0


run_pytest("-v")
`,
            },
            {
              caption: "依存を引数で受け取る",
              note: "`monkeypatch` を使わなくても、渡すだけで差し替えられます。",
              code: `
def make_message(name, amount):
    """純粋関数。文字を組み立てるだけ。"""
    return "{} さん: {} 円のお支払いです".format(name, amount)


def notify(name, amount, sender=print):
    """送信手段を引数で受け取る。既定は print。"""
    sender(make_message(name, amount))


def test_make_message():
    assert make_message("佐藤", 1200) == "佐藤 さん: 1200 円のお支払いです"


def test_notify_uses_the_sender():
    sent = []
    notify("鈴木", 800, sender=sent.append)
    assert sent == ["鈴木 さん: 800 円のお支払いです"]


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
次の関数は、ファイルを読んで集計して表示するところまでを 1 つでやっています。

~~~
def print_summary(path):
    count = 0
    total = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            name, price = line.split(",")
            count += 1
            total += int(price)
    print("{} 件 / 合計 {} 円".format(count, total))
~~~

これを 2 つに分けてください。

| 関数 | 役割 |
|---|---|
| \`summarize(lines)\` | 行の並びを受け取り \`{"count": 件数, "total": 合計}\` を返す。**print はしない** |
| \`print_summary(path)\` | ファイルを読んで \`summarize\` に渡し、結果を \`print\` する |

- 空行は数えないこと。空のリストなら \`{"count": 0, "total": 0}\`
- \`summarize\` のテストを **2 つ以上**書くこと（ファイルは使わない）
- 最後の行で \`run_pytest()\` を呼び、すべて通る状態にすること

練習用のファイル \`orders.txt\` を置いてあります（3 件・合計 740 円）。

> 採点では、あなたのテストを「空行も数えてしまう \`summarize\`」に対しても走らせます。そこで落ちなければ、空行の仕様を確かめられていないという意味です。
`,
            starter: `
def summarize(lines):
    pass


def print_summary(path):
    with open(path, encoding="utf-8") as f:
        result = summarize(f)
    print("{} 件 / 合計 {} 円".format(result["count"], result["total"]))


def test_summarize():
    assert summarize(["牛乳,180", "パン,240"]) == ...


run_pytest("-v")
`,
            tests: `
g = globals()
summarize = g.get("summarize")
print_summary = g.get("print_summary")

check(callable(summarize), "summarize という関数を定義できている")
check(callable(print_summary), "print_summary も残している")

if callable(summarize):
    got = summarize(["牛乳,180", "パン,240"])
    check(got == {"count": 2, "total": 420}, "2 件・合計 420 円を返す（今は {!r}）".format(got))

    got = summarize(["牛乳,180", "", "卵,320"])
    check(got == {"count": 2, "total": 500}, "空行は数えない（今は {!r}）".format(got))

    got = summarize([])
    check(got == {"count": 0, "total": 0}, "空のリストなら 0 件・合計 0（今は {!r}）".format(got))

    # 純粋関数になっているか：呼んでも何も表示しない
    before = len(_stdout())
    summarize(["牛乳,180"])
    check(len(_stdout()) == before, "summarize は print せず、値を返すだけになっている")

if callable(print_summary):
    before = len(_stdout())
    print_summary("orders.txt")
    printed = _stdout()[before:]
    check("3" in printed and "740" in printed, "print_summary が 3 件・合計 740 円を表示する（今は {!r}）".format(printed.strip()))

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 2, "テストを 2 件以上書けている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

# 件数だけ見ると、中身のないテストでも通ってしまう。
# summarize を「空行も数える版」に差し替えて、書いたテストが気づけるかを見る。
COUNTS_BLANKS = """
def summarize(lines):
    count = 0
    total = 0
    for line in lines:
        if "," not in line:
            count += 1
            continue
        name, price = line.split(",")
        count += 1
        total += int(price)
    return {"count": count, "total": total}
"""

if good.ok:
    bad = run_pytest(
        source=_replace_def(_source(), "summarize", COUNTS_BLANKS),
        name="test_probe",
        quiet=True,
    )
    check(
        len(bad.failed) > 0,
        "書いたテストが、空行を数えてしまう版を落とせる（＝中身を確かめられている）",
    )
`,
            hint: "`summarize` は「行の並び」を受け取ります。ファイルオブジェクトも 1 行ずつ取り出せるので、`print_summary` からはそのまま渡せます。件数と合計を数え上げて、最後に辞書にして返してください。",
            solution: `def summarize(lines):
    """行の並びを受け取り、件数と合計を返す。空行は数えない。"""
    count = 0
    total = 0

    for line in lines:
        line = line.strip()
        if not line:
            continue
        name, price = line.split(",")
        count += 1
        total += int(price)

    return {"count": count, "total": total}


def print_summary(path):
    """入出力はここだけ。集計は summarize に任せる。"""
    with open(path, encoding="utf-8") as f:
        result = summarize(f)
    print("{} 件 / 合計 {} 円".format(result["count"], result["total"]))


def test_summarize_counts_and_totals():
    assert summarize(["牛乳,180", "パン,240"]) == {"count": 2, "total": 420}


def test_summarize_skips_blank_lines():
    assert summarize(["牛乳,180", "", "卵,320"]) == {"count": 2, "total": 500}


def test_summarize_of_nothing():
    assert summarize([]) == {"count": 0, "total": 0}


run_pytest("-v")`,
            rejects: [
              {
                caption: "分けてはいるが、テストが中身を見ていない",
                code: `def summarize(lines):
    count = 0
    total = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        name, price = line.split(",")
        count += 1
        total += int(price)
    return {"count": count, "total": total}


def print_summary(path):
    with open(path, encoding="utf-8") as f:
        result = summarize(f)
    print("{} 件 / 合計 {} 円".format(result["count"], result["total"]))


def test_returns_a_dict():
    assert isinstance(summarize([]), dict)


def test_is_callable():
    assert callable(summarize)


run_pytest("-v")`,
              },
            ],
          },
        },

        {
          id: "l10",
          title: "カバレッジの読み方",
          goal: "どこが動いていないかを測り、それでも足りないことを知る",
          packages: ["pytest", "coverage"],
          files: { "coupon.py": COUPON_PY },
          body: `
テストを書いていると「**どこまで確かめたのか**」が分からなくなります。カバレッジは、それを測る道具です。

**テストを走らせたときに、実際に実行された行の割合**——それがカバレッジ（行カバレッジ）です。

### 手元での測り方

~~~
pip install pytest pytest-cov
~~~

~~~
pytest --cov=coupon --cov-report=term-missing
~~~

\`--cov-report=term-missing\` を付けると、**通っていない行番号**まで出ます。この \`Missing\` の列が本体です。パーセントだけ見ていると意味がありません。

~~~
Name        Stmts   Miss  Cover   Missing
-----------------------------------------
coupon.py       8      4    50%   14, 17-19
~~~

| 列 | 意味 |
|---|---|
| Stmts | 数えた文の数 |
| Miss | 実行されなかった文の数 |
| Cover | 実行された割合 |
| **Missing** | **実行されなかった行番号** |

読み方は「50% しかない」ではなく、「**14 行目と 17〜19 行目を誰も通していない**」です。そこにバグがあっても、テストは永遠に緑のままです。

### 100% でも足りない

ここが肝心なところです。カバレッジは「その行を**通った**か」しか見ません。「その行が**正しいか**」は見ません。

~~~
def to_grade(score):
    if score > 80:      # ← >= のはずが > になっている
        return "A"
    return "C"


def test_to_grade():
    assert to_grade(90) == "A"
    assert to_grade(30) == "C"
~~~

このテストは**全行を通ります**（カバレッジ 100%）。それでも \`to_grade(80)\` のバグは見つかりません。第2章でやった境界値の話がそのまま当てはまります。

カバレッジが教えてくれるのは「**確かめていない場所**」だけです。「確かめた場所が正しい」ことは教えてくれません。

| 分かること | 分からないこと |
|---|---|
| テストが 1 度も通っていない行 | その行の結果が正しいか |
| 消し忘れた分岐、届かないコード | 境界値を押さえているか |

### 目安

- **100% を目標にしない。** 最後の数 % を埋める労力は、たいてい別の場所に使ったほうが得です
- **数字より Missing を見る。** 「\`if\` の else 側を一度も通していない」に気づくのが本来の使い方
- **新しく書くコードは厚く、既存のコードは変更した部分から。** 全体を一気に上げるのは続きません
- \`--cov-branch\` を付けると、行ではなく**分岐**で数えます。\`if\` の両側を通ったかまで見たいときに使います

### このアプリでの測り方

\`pytest-cov\` はブラウザ内には入っていませんが、\`coverage\` 本体は使えます。API を直接呼べば、同じことが確かめられます。

~~~
cov = coverage.Coverage(source=["coupon"])
cov.start()
from coupon import discount     # 計測を始めてから import する
...
cov.stop()
cov.report(file=..., show_missing=True)
~~~

このレッスンの \`coupon.py\` には分岐が 4 つあります。

| \`coupon\` | 戻り値 |
|---|---|
| \`None\` | \`price\` のまま |
| \`"half"\` | \`price // 2\` |
| \`"500"\` | \`max(price - 500, 0)\` |
| それ以外 | \`ValueError\` |
`,
          examples: [
            {
              caption: "1 つだけ確かめて、カバレッジを見る",
              note: "`Missing` に出ている行番号を、`coupon.py` の仕様表と見比べてください。",
              code: `
import io
import sys

import coverage

sys.modules.pop("coupon", None)   # 何度でも測り直せるようにする（このアプリ用）

cov = coverage.Coverage(source=["coupon"])
cov.start()

from coupon import discount       # 計測を始めてから import する

assert discount(1000, "half") == 500

cov.stop()

report = io.StringIO()
cov.report(file=report, show_missing=True)
print(report.getvalue())
`,
            },
            {
              caption: "4 つの分岐を全部通す",
              note: "同じコードで、確かめる件数だけ増やしました。100% になります。",
              code: `
import io
import sys

import coverage
import pytest

sys.modules.pop("coupon", None)

cov = coverage.Coverage(source=["coupon"])
cov.start()

from coupon import discount

assert discount(1000, None) == 1000
assert discount(1001, "half") == 500
assert discount(1000, "500") == 500
assert discount(300, "500") == 0

try:
    discount(1000, "free")
except ValueError:
    pass

cov.stop()

report = io.StringIO()
cov.report(file=report, show_missing=True)
print(report.getvalue())
`,
            },
            {
              caption: "100% でもバグは残る",
              note: "この 2 つのテストで**全行が実行されます**。それでも `to_grade(80)` は間違ったままです。",
              code: `
def to_grade(score):
    """>= のはずが > になっているバグ入り。"""
    if score > 80:
        return "A"
    if score > 60:
        return "B"
    return "C"


def test_all_lines_are_executed():
    assert to_grade(90) == "A"
    assert to_grade(70) == "B"
    assert to_grade(30) == "C"


def test_but_the_boundary_is_wrong():
    assert to_grade(80) == "A"     # カバレッジでは見つからないバグ


run_pytest("-v")
`,
            },
            {
              caption: "手元で pytest-cov を使うとこう出る",
              note: "ブラウザ内には `pytest-cov` が入っていないので、これは**読むだけ**のブロックです。上の 1 つ目の例（`\"half\"` だけを確かめた状態）と同じ数字が出ます。",
              runnable: false,
              code: `
$ pip install pytest pytest-cov
$ pytest --cov=coupon --cov-report=term-missing

========================= test session starts =========================
collected 1 item

test_coupon.py .                                                [100%]

---------- coverage: platform linux, python 3.14.2-final-0 -----------
Name        Stmts   Miss  Cover   Missing
-----------------------------------------
coupon.py       8      4    50%   14, 17-19
-----------------------------------------
TOTAL           8      4    50%

========================== 1 passed in 0.05s ==========================
`,
            },
          ],
          exercise: {
            prompt: `
\`coupon.py\` の \`discount\` に対して、**4 つの分岐すべてを確かめる**テストを書いてください。

| \`coupon\` | 戻り値 |
|---|---|
| \`None\` | \`price\` のまま |
| \`"half"\` | \`price // 2\`（1 円未満は切り捨て） |
| \`"500"\` | \`max(price - 500, 0)\`（0 円より下にはしない） |
| それ以外 | \`ValueError\` |

- テストは **5 つ以上**
- \`"500"\` は「普通に引ける場合」と「**引きすぎて 0 円で止まる場合**」の両方を確かめること
- \`"half"\` は切り捨てが起きる金額（奇数）で確かめること
- \`ValueError\` は \`pytest.raises\` で確かめること
- 最後の行で \`run_pytest()\` を呼び、すべて通る状態にすること

> 行を通すだけでは足りません。**戻り値が正しいか**を確かめてください。
`,
            starter: `
import pytest
from coupon import discount


def test_no_coupon():
    assert discount(1000, None) == ...


run_pytest("-v")
`,
            tests: `
NO_DISCOUNT_BROKEN = """
def discount(price, coupon):
    if coupon is None:
        return 0
    if coupon == "half":
        return price // 2
    if coupon == "500":
        return max(price - 500, 0)
    raise ValueError("知らないクーポンです")
"""

HALF_BROKEN = """
def discount(price, coupon):
    if coupon is None:
        return price
    if coupon == "half":
        return price
    if coupon == "500":
        return max(price - 500, 0)
    raise ValueError("知らないクーポンです")
"""

NO_CLAMP = """
def discount(price, coupon):
    if coupon is None:
        return price
    if coupon == "half":
        return price // 2
    if coupon == "500":
        return price - 500
    raise ValueError("知らないクーポンです")
"""

NO_ERROR = """
def discount(price, coupon):
    if coupon is None:
        return price
    if coupon == "half":
        return price // 2
    if coupon == "500":
        return max(price - 500, 0)
    return price
"""

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 5, "テストを 5 件以上書けている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

if good.ok:
    for broken, message in [
        (NO_DISCOUNT_BROKEN, "クーポンなしの分岐を壊した版では落ちる"),
        (HALF_BROKEN, "半額の分岐を壊した版では落ちる（＝切り捨てまで確かめている）"),
        (NO_CLAMP, "0 円で止める処理を外した版では落ちる（＝引きすぎのケースを確かめている）"),
        (NO_ERROR, "ValueError を上げない版では落ちる"),
    ]:
        bad = run_pytest(source=_source(), modules={"coupon": broken}, quiet=True)
        check(len(bad.failed) > 0, message)
`,
            hint: "「0 円で止まる」を確かめるには、500 円より安い商品に `\"500\"` を使ってみます。切り捨ては、2 で割り切れない金額を `\"half\"` にすると現れます。",
            solution: `import pytest
from coupon import discount


def test_no_coupon_keeps_the_price():
    assert discount(1000, None) == 1000


def test_half_rounds_down():
    assert discount(1001, "half") == 500


def test_500_off():
    assert discount(1000, "500") == 500


def test_500_off_does_not_go_below_zero():
    assert discount(300, "500") == 0


def test_unknown_coupon_is_an_error():
    with pytest.raises(ValueError):
        discount(1000, "free")


run_pytest("-v")`,
          },
        },
      ],
    },

    /* ================= 第4章 ================= */
    {
      id: "ch4",
      title: "第4章　テストを開発に組み込む",
      lessons: [
        {
          id: "l11",
          title: "先にテストを書く",
          goal: "仕様 → テスト → 実装の順で、小さく回す",
          packages: ["pytest"],
          body: `
ここまでは「実装があって、あとからテストを書く」順でした。逆にしてみます。

### red → green → refactor

| 段 | すること |
|---|---|
| **red** | まだ通らないテストを 1 つ書く。走らせて**落ちることを確かめる** |
| **green** | そのテストが通る最小の実装を書く |
| **refactor** | テストを緑に保ったまま、コードを整える |

これを 1 サイクル数分で回します。テストを先に書く方法（テスト駆動開発 / TDD）の効き目は、テストが増えることではありません。

- **仕様が先に固まる。** 「\`split_evenly(1000, 3)\` は何を返すべきか」を、実装を書く前に決めることになります
- **必ず 1 度は赤を見る。** 「テストを書いたのに、実は何も確かめていなかった」を防げます
- **やりすぎを防げる。** 通す最小限だけ書くので、使われない一般化をしなくなります
- **デバッグが短い。** 直前に書いた数行しか疑うところがありません

### 赤を見ることの意味

いちばん危ないテストは「**何があっても通るテスト**」です。実装のあとに書くと、これに気づけません。先に書けば、実装前に必ず赤を通るので、そのテストが本当に何かを確かめている証拠が手に入ります。

### 最小の実装から始める

~~~
def test_splits_evenly():
    assert split_evenly(1000, 4) == [250, 250, 250, 250]
~~~

まず \`NameError\` で赤。次に通す最小限。

~~~
def split_evenly(total, people):
    base = total // people
    return [base] * people
~~~

これで緑。ここで**次のテストを足して、また赤にします**。

~~~
def test_remainder_goes_to_the_front():
    assert split_evenly(1000, 3) == [334, 333, 333]
~~~

\`[333, 333, 333]\` が返るので赤。余りを配る処理を足して緑にします。

~~~
def split_evenly(total, people):
    base, remainder = divmod(total, people)
    return [base + (1 if i < remainder else 0) for i in range(people)]
~~~

「動く最小」から「仕様を満たす」へ、**テストに引っ張られて**進んでいく感覚が掴めれば十分です。

> \`divmod(a, b)\` は \`(a // b, a % b)\` を一度に返します。

### どこまで先に書くか

全部を先に書く必要はありません。実務では

- 仕様がはっきりしている（計算、変換、判定）→ 先に書くと速い
- 何を作るか探りながら書いている → 手で動かしてから、固まった時点でテストを足す

と使い分けます。「テストを先に書く」を宗教にせず、**赤を 1 度は見る**ところだけ持ち帰ってください。
`,
          examples: [
            {
              caption: "まず赤を見る",
              note: "実装がないので `NameError` で落ちます。**これが出発点**です。",
              code: `
def test_splits_evenly():
    assert split_evenly(1000, 4) == [250, 250, 250, 250]


run_pytest()
`,
            },
            {
              caption: "通す最小の実装",
              code: `
def split_evenly(total, people):
    base = total // people
    return [base] * people


def test_splits_evenly():
    assert split_evenly(1000, 4) == [250, 250, 250, 250]


run_pytest("-v")
`,
            },
            {
              caption: "テストを足して、また赤にする",
              note: "1000 を 3 人で割ると、合計が 999 円になってしまいます。",
              code: `
def split_evenly(total, people):
    base = total // people
    return [base] * people


def test_splits_evenly():
    assert split_evenly(1000, 4) == [250, 250, 250, 250]


def test_remainder_goes_to_the_front():
    assert split_evenly(1000, 3) == [334, 333, 333]


run_pytest("-v")
`,
            },
            {
              caption: "緑に戻す",
              code: `
def split_evenly(total, people):
    """total を people 人で分ける。余りは先頭の人から 1 円ずつ足す。"""
    base, remainder = divmod(total, people)
    return [base + (1 if i < remainder else 0) for i in range(people)]


def test_splits_evenly():
    assert split_evenly(1000, 4) == [250, 250, 250, 250]


def test_remainder_goes_to_the_front():
    assert split_evenly(1000, 3) == [334, 333, 333]


def test_sum_matches_the_total():
    assert sum(split_evenly(9997, 7)) == 9997


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
仕様だけを渡します。**テストを先に書いてから**実装してください。

関数 \`fair_share(total, people)\` — 金額を人数で分けます。

| 仕様 | 例 |
|---|---|
| 1 円単位で、なるべく均等に分ける | \`fair_share(1000, 4)\` → \`[250, 250, 250, 250]\` |
| 余りは**先頭の人から** 1 円ずつ足す | \`fair_share(1000, 3)\` → \`[334, 333, 333]\` |
| 合計は必ず元の金額と一致する | \`sum(fair_share(9997, 7)) == 9997\` |
| 人数より金額が少なくてもよい | \`fair_share(2, 3)\` → \`[1, 1, 0]\` |
| 人数が 0 以下なら \`ValueError\` | \`fair_share(1000, 0)\` → 例外 |

- テストは **4 つ以上**。例外のケースも含めること
- 最後の行で \`run_pytest()\` を呼び、すべて通る状態にすること

> 手順としては、テストを 1 つ書いて \`run_pytest()\` で赤を見る → 実装を足して緑にする、を繰り返すのがおすすめです。

> 採点では、あなたのテストを「余りを切り捨てる \`fair_share\`」に対しても走らせます。そこで落ちなければ、仕様を確かめられていないという意味です。
`,
            starter: `
import pytest


def fair_share(total, people):
    pass


def test_splits_evenly():
    assert fair_share(1000, 4) == ...


run_pytest("-v")
`,
            tests: `
g = globals()
f = g.get("fair_share")

check(callable(f), "fair_share という関数を定義できている")

if callable(f):
    got = f(1000, 4)
    check(got == [250, 250, 250, 250], "均等に割れるときはそのまま分ける（今は {!r}）".format(got))

    got = f(1000, 3)
    check(got == [334, 333, 333], "余りは先頭の人から 1 円ずつ足す（今は {!r}）".format(got))

    got = f(2, 3)
    check(got == [1, 1, 0], "人数より金額が少なくても分けられる（今は {!r}）".format(got))

    got = f(9997, 7)
    check(sum(got) == 9997, "合計が元の金額と一致する（今は {}）".format(sum(got)))
    check(len(got) == 7, "人数ぶんの要素を返す（今は {} 個）".format(len(got)))

    try:
        f(1000, 0)
        raised = "なし"
    except ValueError:
        raised = None
    except Exception as error:
        raised = type(error).__name__
    check(raised is None, "人数が 0 なら ValueError を上げる（今は {}）".format(raised))

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 4, "テストを 4 件以上書けている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))

# 先にテストを書いた意味があるかは、件数ではなく「壊れた実装を落とせるか」で見る。
# 余りを切り捨てる版（合計が元の金額に足りない）に差し替えて、赤くなるかを確かめる。
DROPS_REMAINDER = """
def fair_share(total, people):
    if people <= 0:
        raise ValueError("人数は 1 人以上にしてください")
    return [total // people] * people
"""

if good.ok:
    bad = run_pytest(
        source=_replace_def(_source(), "fair_share", DROPS_REMAINDER),
        name="test_probe",
        quiet=True,
    )
    check(
        len(bad.failed) > 0,
        "書いたテストが、余りを切り捨てる版を落とせる（＝仕様を確かめられている）",
    )
`,
            hint: "`divmod(total, people)` で「1 人あたり」と「余り」が同時に取れます。余りを先頭から配るには、何番目かを見て 1 円足すかどうかを決めます。人数のチェックは、割り算より先に書いてください。",
            solution: `import pytest


def fair_share(total, people):
    """total を people 人で分ける。余りは先頭の人から 1 円ずつ足す。"""
    if people <= 0:
        raise ValueError("人数は 1 人以上にしてください")

    base, remainder = divmod(total, people)
    return [base + (1 if i < remainder else 0) for i in range(people)]


def test_splits_evenly():
    assert fair_share(1000, 4) == [250, 250, 250, 250]


def test_remainder_goes_to_the_front():
    assert fair_share(1000, 3) == [334, 333, 333]


def test_works_when_total_is_smaller_than_people():
    assert fair_share(2, 3) == [1, 1, 0]


def test_sum_matches_the_total():
    assert sum(fair_share(9997, 7)) == 9997


def test_returns_one_entry_per_person():
    assert len(fair_share(1000, 7)) == 7


def test_zero_people_is_an_error():
    with pytest.raises(ValueError):
        fair_share(1000, 0)


run_pytest("-v")`,
            rejects: [
              {
                caption: "実装は正しいが、テストが仕様を確かめていない",
                code: `import pytest


def fair_share(total, people):
    if people <= 0:
        raise ValueError("人数は 1 人以上にしてください")
    base, remainder = divmod(total, people)
    return [base + (1 if i < remainder else 0) for i in range(people)]


def test_returns_a_list():
    assert isinstance(fair_share(1000, 4), list)


def test_returns_one_entry_per_person():
    assert len(fair_share(1000, 4)) == 4


def test_is_callable():
    assert callable(fair_share)


def test_zero_people_is_an_error():
    with pytest.raises(ValueError):
        fair_share(1000, 0)


run_pytest("-v")`,
              },
            ],
          },
        },

        {
          id: "l12",
          title: "バグを再現するテストを書く",
          goal: "報告されたバグを赤で捕まえてから直し、二度と戻らないようにする",
          packages: ["pytest"],
          body: `
バグ報告が来たとき、いきなり直しに行くと 2 つ損をします。

- **本当に直ったのか**が分からない（手で 1 回試して終わり）
- **半年後に誰かが同じ場所を壊す**。同じ報告がもう一度来る

順番を変えるだけで両方が解決します。

### 直す前に赤にする

| 手順 | すること |
|---|---|
| 1 | 報告を**再現するテスト**を書く |
| 2 | 走らせて、**落ちることを確かめる**（ここが肝） |
| 3 | 直す |
| 4 | 緑になったことを確かめる |
| 5 | そのテストをそのまま残す（＝**回帰テスト**） |

2 を飛ばしてはいけません。落ちるところを見ないと、そのテストが本当にバグを捕まえているのか分かりません。「直したあとに書いたテスト」は、たまたま通っているだけかもしれません。

### 再現は小さくする

報告は「請求書の画面で合計がマイナスになる」のように、状況込みで来ます。テストにするときは、**バグに関係のないものを全部そぎ落とします**。

~~~
def test_coupon_does_not_make_the_total_negative():
    assert total([{"price": 300, "qty": 1}], coupon=500) == 0
~~~

画面もログインもデータベースも要りません。1 行で再現できるなら、それがいちばん良い再現テストです。

### 名前で報告を残す

~~~
def test_coupon_larger_than_subtotal_results_in_zero():
~~~

「なぜこのテストがあるのか」がテスト名から読めるようにします。バグ番号があるなら \`test_issue_412_...\` のように入れておくのも有効です。半年後にこのテストを消そうとした人が、理由を辿れます。

### 直し方は「仕様を決める」こと

\`total\` がマイナスを返すのは、そもそも「クーポンが小計より大きいときどうするか」を決めていなかったからです。バグ修正は、たいてい**抜けていた仕様を決める**作業です。決めたら、それがテスト名と \`assert\` に残ります。

~~~
def total(items, coupon=0):
    subtotal = sum(item["price"] * item["qty"] for item in items)
    return max(subtotal - coupon, 0)     # 0 より下にはしない、と決めた
~~~

### 直したついでに周りも守る

同じ関数の「普通のケース」のテストも一緒に足しておきます。修正で別のところを壊していないか、その場で分かります。
`,
          examples: [
            {
              caption: "報告されたバグを再現する",
              note: "「300 円の商品に 500 円のクーポンを使うと合計が -200 円になる」という報告です。",
              code: `
def total(items, coupon=0):
    """いまの実装（バグあり）。"""
    return sum(item["price"] * item["qty"] for item in items) - coupon


items = [{"price": 300, "qty": 1}]
print("合計:", total(items, coupon=500))
`,
            },
            {
              caption: "テストにして、赤を見る",
              note: "**まず落ちること**を確かめます。ここを飛ばしてはいけません。",
              code: `
def total(items, coupon=0):
    return sum(item["price"] * item["qty"] for item in items) - coupon


def test_coupon_larger_than_subtotal_results_in_zero():
    assert total([{"price": 300, "qty": 1}], coupon=500) == 0


run_pytest()
`,
            },
            {
              caption: "直して緑にする",
              note: "普通のケースのテストも足して、修正で壊していないことを確かめます。",
              code: `
def total(items, coupon=0):
    """クーポンを引いた合計。0 円より下にはしない。"""
    subtotal = sum(item["price"] * item["qty"] for item in items)
    return max(subtotal - coupon, 0)


def test_coupon_larger_than_subtotal_results_in_zero():
    assert total([{"price": 300, "qty": 1}], coupon=500) == 0


def test_subtotal_counts_quantity():
    assert total([{"price": 300, "qty": 2}]) == 600


def test_coupon_is_subtracted():
    assert total([{"price": 300, "qty": 2}], coupon=100) == 500


run_pytest("-v")
`,
            },
          ],
          exercise: {
            prompt: `
支払額を計算する関数に、バグ報告が 2 件届きました。

~~~
def apply_points(price, points):
    """所持ポイントを使って支払額を計算する。"""
    return price - points
~~~

| # | 報告 | あるべき動き |
|---|---|---|
| 1 | 1000 円の商品に 1500 ポイント使うと、支払額が \`-500\` 円になる | \`0\` 円で止まる |
| 2 | ポイントに負の数を渡すと、支払額が増えてしまう | \`ValueError\` |

やること:

1. \`apply_points(price, points)\` を**直した実装**をエディタに書く
2. 上の 2 件を**再現するテスト**を書く（＝直す前の実装なら落ちるもの）
3. 普通のケースのテストも足して、**全部通す**状態にする

テストは 3 つ以上、最後の行で \`run_pytest()\` を呼んでください。

> 採点では、あなたのテストを**直す前の実装**に対しても走らせます。そこで落ちなければ、バグを再現できていないということです。
`,
            starter: `
import pytest


def apply_points(price, points):
    return price - points


def test_points_do_not_make_the_payment_negative():
    assert apply_points(1000, 1500) == ...


run_pytest("-v")
`,
            tests: `
import ast

BUGGY = """
def apply_points(price, points):
    return price - points
"""

g = globals()
f = g.get("apply_points")

check(callable(f), "apply_points を定義できている")

if callable(f):
    got = f(1000, 300)
    check(got == 700, "普通に使えたぶんは引かれる（今は {!r}）".format(got))

    got = f(1000, 1500)
    check(got == 0, "ポイントが価格より多くても 0 円で止まる（今は {!r}）".format(got))

    got = f(1000, 0)
    check(got == 1000, "0 ポイントなら定価のまま（今は {!r}）".format(got))

    try:
        f(1000, -100)
        raised = "なし"
    except ValueError:
        raised = None
    except Exception as error:
        raised = type(error).__name__
    check(raised is None, "ポイントが負なら ValueError を上げる（今は {}）".format(raised))

good = run_pytest(source=_source(), quiet=True)
check(len(good.results) >= 3, "テストを 3 件以上書けている（今は {} 件）".format(len(good.results)))
check(good.ok, "書いたテストがすべて通る（落ちたもの: {}）".format(", ".join(good.failed) or "なし"))


if good.ok:
    probe = _replace_def(_source(), "apply_points", BUGGY)
    bad = run_pytest(source=probe, name="test_regression", quiet=True)
    check(
        len(bad.failed) >= 2,
        "直す前の実装では 2 件以上落ちる（＝2 つの報告をどちらも再現できている。今は {} 件）".format(len(bad.failed)),
    )
`,
            hint: "支払額が 0 より下にならないようにするには `max()` が使えます。負のポイントのチェックは、計算より先に書いてください。テストは「1500 ポイント使うと 0 円」と「負のポイントで `ValueError`」の 2 件が再現テストにあたります。",
            solution: `import pytest


def apply_points(price, points):
    """所持ポイントを使って支払額を計算する。0 円より下にはしない。"""
    if points < 0:
        raise ValueError("ポイントに負の数は指定できません")

    return max(price - points, 0)


def test_points_are_subtracted():
    assert apply_points(1000, 300) == 700


def test_zero_points_keeps_the_price():
    assert apply_points(1000, 0) == 1000


def test_points_do_not_make_the_payment_negative():
    assert apply_points(1000, 1500) == 0


def test_exactly_enough_points_makes_it_free():
    assert apply_points(1000, 1000) == 0


def test_negative_points_is_an_error():
    with pytest.raises(ValueError):
        apply_points(1000, -100)


run_pytest("-v")`,
          },
        },
      ],
    },
  ],
};

export default content;
