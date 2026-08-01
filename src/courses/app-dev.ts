/* ============================================================
   コース：アプリ開発（FastAPI）
   一覧に出す情報（タイトルやアイコン）は src/courses/registry.ts 側にある。

   ブラウザ内では本物のサーバーを起動できないため、
   ・仕組みの理解 → 素の Python で自作して動かす（実行可）
   ・FastAPI の書き方 → 参考コード + 手元での動かし方（読むだけ）
   の二段構えにしている。
   ============================================================ */

import type { CourseContent } from "../types";

const content: CourseContent = {
  chapters: [
    /* ================= 第1章 ================= */
    {
      id: "ch1",
      title: "第1章　API の仕組みを自作する",
      lessons: [
        {
          id: "l1",
          title: "リクエストとレスポンス",
          goal: "Web アプリが受け取るもの・返すものを、データとして捉える",
          body: `
Web アプリケーションの仕事は、突き詰めると 1 つだけです。

> **リクエスト（データ）を受け取り、レスポンス（データ）を返す**

フレームワークは、この変換を書きやすくするための道具にすぎません。まずはリクエストとレスポンスを **ただの辞書** として扱ってみると、全体像がすっきりします。

### リクエストに含まれるもの

| 要素 | 例 |
|---|---|
| メソッド | \`"GET"\`, \`"POST"\` |
| パス | \`"/todos/3"\` |
| クエリ | \`{"page": "2", "done": "true"}\` |
| ヘッダー | \`{"Authorization": "Bearer ..."}\` |
| ボディ | \`{"title": "牛乳を買う"}\` |

### レスポンスに含まれるもの

| 要素 | 例 |
|---|---|
| ステータス | \`200\`, \`201\`, \`404\` |
| ヘッダー | \`{"Content-Type": "application/json"}\` |
| ボディ | \`{"id": 3, "title": "牛乳を買う"}\` |

FastAPI を使うと、この受け渡しのほとんどを関数の**引数と戻り値**として書けるようになります。「関数を書けば API になる」——これがフレームワークのありがたみです。
`,
          examples: [
            {
              caption: "リクエストを辞書として扱う",
              code: `
def handle(request: dict) -> dict:
    """リクエスト（辞書）を受け取り、レスポンス（辞書）を返す。"""
    if request["method"] == "GET" and request["path"] == "/health":
        return {"status": 200, "body": {"ok": True}}

    return {"status": 404, "body": {"detail": "Not Found"}}


requests = [
    {"method": "GET", "path": "/health", "query": {}, "body": None},
    {"method": "GET", "path": "/unknown", "query": {}, "body": None},
]

for req in requests:
    res = handle(req)
    print(f'{req["method"]:<5} {req["path"]:<10} → {res["status"]} {res["body"]}')
`,
            },
          ],
          exercise: {
            prompt: `
関数 \`handle(request)\` を作ってください。返すのは \`{"status": ..., "body": ...}\` の辞書です。

| メソッド | パス | 返すもの |
|---|---|---|
| GET | \`/health\` | \`200\` / \`{"ok": True}\` |
| GET | \`/version\` | \`200\` / \`{"version": "1.0.0"}\` |
| POST | \`/echo\` | \`200\` / リクエストの \`body\` をそのまま |
| 上記以外 | | \`404\` / \`{"detail": "Not Found"}\` |

> \`/echo\` に **GET** で来た場合は \`405\` / \`{"detail": "Method Not Allowed"}\` を返してください。
`,
            starter: `
def handle(request):
    pass


tests = [
    {"method": "GET", "path": "/health", "body": None},
    {"method": "GET", "path": "/version", "body": None},
    {"method": "POST", "path": "/echo", "body": {"hello": "world"}},
    {"method": "GET", "path": "/echo", "body": None},
    {"method": "GET", "path": "/nope", "body": None},
]

for req in tests:
    print(req["method"], req["path"], "→", handle(req))
`,
            tests: `
g = globals()
f = g.get("handle")

check(callable(f), "handle という関数を定義できている")
if callable(f):
    r = f({"method": "GET", "path": "/health", "body": None})
    check(r == {"status": 200, "body": {"ok": True}}, f"/health の応答が正しい（今は {r}）")

    r = f({"method": "GET", "path": "/version", "body": None})
    check(r == {"status": 200, "body": {"version": "1.0.0"}}, "/version の応答が正しい")

    r = f({"method": "POST", "path": "/echo", "body": {"hello": "world"}})
    check(r == {"status": 200, "body": {"hello": "world"}}, "POST /echo が body をそのまま返す")

    r = f({"method": "GET", "path": "/echo", "body": None})
    check(r.get("status") == 405, f"GET /echo が 405 になる（今は {r.get('status')}）")

    r = f({"method": "GET", "path": "/nope", "body": None})
    check(r == {"status": 404, "body": {"detail": "Not Found"}}, "知らないパスが 404 になる")
`,
            hint: "パスを先に判定し、その中でメソッドを見ると 405 が書きやすくなります。最後に 404 を返して締めます。",
            solution: `def handle(request: dict) -> dict:
    method = request["method"]
    path = request["path"]

    if path == "/health" and method == "GET":
        return {"status": 200, "body": {"ok": True}}

    if path == "/version" and method == "GET":
        return {"status": 200, "body": {"version": "1.0.0"}}

    if path == "/echo":
        if method != "POST":
            return {"status": 405, "body": {"detail": "Method Not Allowed"}}
        return {"status": 200, "body": request["body"]}

    return {"status": 404, "body": {"detail": "Not Found"}}`,
          },
        },

        {
          id: "l2",
          title: "ルーティングを作る",
          goal: "「パスと関数を結びつける」仕組みを、自分の手で組み立てる",
          body: `
前のレッスンの \`if\` の羅列は、パスが増えるほど読みづらくなります。フレームワークはこれを **ルーティング表** に置き換えます。

~~~
routes = {
    ("GET", "/health"): health_handler,
    ("POST", "/todos"): create_todo,
}
~~~

キーが「メソッドとパスの組」、値が「呼ぶ関数」。あとは辞書を引くだけです。

### デコレータで登録する

FastAPI の \`@app.get("/health")\` という書き方は、この登録作業を関数定義のすぐ上に書けるようにしたものです。デコレータは「関数を受け取って何かする関数」でしかありません。

~~~
def get(path):
    def decorator(func):
        routes[("GET", path)] = func
        return func
    return decorator

@get("/health")
def health():
    return {"ok": True}
~~~

\`@get("/health")\` は \`health = get("/health")(health)\` の**省略記法**です。ここが腑に落ちると、FastAPI の書き方が「魔法」ではなくなります。

### パスパラメータ

\`/todos/3\` の \`3\` のように、URL に埋め込まれた値です。素朴に作るならパスを \`/\` で分割して照合します。
`,
          examples: [
            {
              caption: "小さなルーターを作って動かす",
              code: `
routes = {}


def route(method, path):
    """関数をルーティング表に登録するデコレータ。"""
    def decorator(func):
        routes[(method, path)] = func
        return func
    return decorator


@route("GET", "/health")
def health(request):
    return 200, {"ok": True}


@route("GET", "/users")
def list_users(request):
    page = int(request.get("query", {}).get("page", 1))
    return 200, {"page": page, "users": ["佐藤", "鈴木"]}


def dispatch(request):
    handler = routes.get((request["method"], request["path"]))
    if handler is None:
        return 404, {"detail": "Not Found"}
    return handler(request)


print("登録されたルート:", list(routes.keys()))
print()

for req in [
    {"method": "GET", "path": "/health", "query": {}},
    {"method": "GET", "path": "/users", "query": {"page": "3"}},
    {"method": "GET", "path": "/nope", "query": {}},
]:
    print(req["path"], "→", dispatch(req))
`,
            },
          ],
          exercise: {
            prompt: `
パスパラメータに対応した \`match_path(pattern, path)\` を作ってください。

- \`pattern\` は \`"/todos/{id}"\` のような形
- 一致したら \`{"id": "3"}\` のような辞書を返す
- 一致しなければ \`None\` を返す
- パラメータが無いパターン（\`"/health"\`）も扱えること（一致したら空の辞書 \`{}\`）

例：

| pattern | path | 戻り値 |
|---|---|---|
| \`/todos/{id}\` | \`/todos/3\` | \`{"id": "3"}\` |
| \`/todos/{id}\` | \`/todos\` | \`None\` |
| \`/users/{uid}/posts/{pid}\` | \`/users/7/posts/12\` | \`{"uid": "7", "pid": "12"}\` |
| \`/health\` | \`/health\` | \`{}\` |
`,
            starter: `
def match_path(pattern, path):
    pass


print(match_path("/todos/{id}", "/todos/3"))
print(match_path("/todos/{id}", "/todos"))
print(match_path("/users/{uid}/posts/{pid}", "/users/7/posts/12"))
print(match_path("/health", "/health"))
print(match_path("/health", "/version"))
`,
            tests: `
g = globals()
f = g.get("match_path")

check(callable(f), "match_path という関数を定義できている")
if callable(f):
    check(f("/todos/{id}", "/todos/3") == {"id": "3"}, "パスパラメータを取り出せる")
    check(f("/todos/{id}", "/todos") is None, "階層の数が違えば None")
    check(f("/todos/{id}", "/todos/3/extra") is None, "余分な階層があれば None")
    check(
        f("/users/{uid}/posts/{pid}", "/users/7/posts/12") == {"uid": "7", "pid": "12"},
        "パラメータが 2 つでも取り出せる",
    )
    check(f("/health", "/health") == {}, "パラメータ無しで一致したら空の辞書")
    check(f("/health", "/version") is None, "一致しなければ None")
`,
            hint: [
              "`/todos/{id}` と `/todos/3` は文字列としてはまったくの別物ですが、`/` で区切った「区画の並び」として見ると、同じ長さで 1 区画ずつ対応しています。文字列のまま比べようとせず、まず比べられる形にそろえるのが出発点です。",
              "区画の数が違えば、中身を見るまでもなく不一致が確定します（`/todos` と `/todos/3/extra` がこれ）。ここを先に片付けておくと、あとの突き合わせで長さのずれを気にせずに済みます。",
              "1 区画ずつ見ていくと、パターン側の区画は 2 種類しかありません。中かっこで囲まれた区画は「どんな値でも受け入れて、名前をつけて拾う」もの。そうでない区画は「完全に同じでなければ不一致」。名前は囲みを外した部分です。",
              "戻り値は 3 通りに見えて 2 通りです。不一致なら `None`、一致したら拾えたぶんの辞書。`/health` が `{}` を返すのは「一致したがパラメータが 0 個だった」というだけなので、この場合のための特別扱いは要りません。",
            ],
            solution: `def match_path(pattern: str, path: str):
    pattern_parts = pattern.strip("/").split("/")
    path_parts = path.strip("/").split("/")

    if len(pattern_parts) != len(path_parts):
        return None

    params = {}
    for expected, actual in zip(pattern_parts, path_parts):
        if expected.startswith("{") and expected.endswith("}"):
            params[expected[1:-1]] = actual
        elif expected != actual:
            return None

    return params`,
          },
        },

        {
          id: "l3",
          title: "入力を検証する",
          goal: "受け取ったデータを信用しない、という前提を身につける",
          body: `
API に届くデータは、**壊れているかもしれない**という前提で扱います。必須項目が無い、型が違う、値が範囲外——どれも日常的に起きます。

検証で見るのは主にこの 4 つです。

1. **必須項目があるか**
2. **型が正しいか**
3. **値が妥当か**（長さ、範囲、選択肢）
4. **余計な項目が混ざっていないか**

### 素の Python で書くとどうなるか

~~~
def validate(data):
    errors = []
    if "title" not in data:
        errors.append("title は必須です")
    elif not isinstance(data["title"], str):
        errors.append("title は文字列にしてください")
    return errors
~~~

項目が増えると、この定型文がどんどん膨らみます。**Pydantic はこれを型ヒントから自動生成してくれる**ライブラリで、FastAPI の中核です。

~~~
from pydantic import BaseModel, Field

class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    done: bool = False
~~~

これだけで、必須チェック・型チェック・長さチェック・エラーメッセージが揃います。

まずは自分で書いてみて、あとで Pydantic に置き換えると、何が自動化されているのかがはっきり分かります。
`,
          examples: [
            {
              caption: "検証を自分で書いてみる",
              code: `
ALLOWED_PRIORITIES = {"low", "normal", "high"}


def validate_todo(data: dict) -> list:
    errors = []

    title = data.get("title")
    if title is None:
        errors.append("title は必須です")
    elif not isinstance(title, str):
        errors.append("title は文字列にしてください")
    elif not 1 <= len(title) <= 100:
        errors.append("title は 1〜100 文字にしてください")

    done = data.get("done", False)
    if not isinstance(done, bool):
        errors.append("done は true / false にしてください")

    priority = data.get("priority", "normal")
    if priority not in ALLOWED_PRIORITIES:
        errors.append(f"priority は {sorted(ALLOWED_PRIORITIES)} のいずれかにしてください")

    return errors


samples = [
    {"title": "牛乳を買う"},
    {"title": "", "done": "yes"},
    {"done": True, "priority": "urgent"},
]

for s in samples:
    print(s)
    problems = validate_todo(s)
    print("  →", "OK" if not problems else problems)
`,
            },
            {
              caption: "Pydantic なら（手元で動かす用）",
              runnable: false,
              code: `
from typing import Literal

from pydantic import BaseModel, Field, ValidationError


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    done: bool = False
    priority: Literal["low", "normal", "high"] = "normal"


# 正しいデータ
todo = TodoCreate(title="牛乳を買う")
print(todo)                  # title='牛乳を買う' done=False priority='normal'
print(todo.model_dump())     # 辞書にする

# 壊れたデータ
try:
    TodoCreate(title="", priority="urgent")
except ValidationError as e:
    for err in e.errors():
        print(err["loc"], err["msg"])
`,
            },
          ],
          exercise: {
            prompt: `
関数 \`validate_user(data)\` を作ってください。エラーメッセージの**リスト**を返します（問題なければ空のリスト）。

| 項目 | ルール | エラーメッセージ |
|---|---|---|
| \`name\` | 必須・文字列・1〜50 文字 | \`"name が不正です"\` |
| \`age\` | 必須・整数・0〜150 | \`"age が不正です"\` |
| \`plan\` | 省略可（既定 \`"free"\`）・\`free\` / \`pro\` / \`team\` のいずれか | \`"plan が不正です"\` |

> \`bool\` は Python では \`int\` の一種です（\`isinstance(True, int)\` は \`True\`）。\`age\` に \`True\` が来たら不正として扱ってください。
`,
            starter: `
def validate_user(data):
    pass


samples = [
    {"name": "佐藤", "age": 30},
    {"name": "", "age": 30},
    {"name": "鈴木", "age": "30"},
    {"name": "高橋", "age": 20, "plan": "gold"},
    {"name": "田中", "age": 45, "plan": "pro"},
]

for s in samples:
    print(s, "→", validate_user(s))
`,
            tests: `
g = globals()
f = g.get("validate_user")

check(callable(f), "validate_user という関数を定義できている")
if callable(f):
    check(f({"name": "佐藤", "age": 30}) == [], "正しいデータならエラー無し")
    check(f({"name": "田中", "age": 45, "plan": "pro"}) == [], "plan が正しければエラー無し")

    check("name が不正です" in f({"age": 30}), "name が無ければエラー")
    check("name が不正です" in f({"name": "", "age": 30}), "name が空ならエラー")
    check("name が不正です" in f({"name": "あ" * 51, "age": 30}), "name が 51 文字ならエラー")

    check("age が不正です" in f({"name": "佐藤"}), "age が無ければエラー")
    check("age が不正です" in f({"name": "佐藤", "age": "30"}), "age が文字列ならエラー")
    check("age が不正です" in f({"name": "佐藤", "age": 200}), "age が 200 ならエラー")
    check("age が不正です" in f({"name": "佐藤", "age": True}), "age が True ならエラー")

    check("plan が不正です" in f({"name": "佐藤", "age": 30, "plan": "gold"}), "未知の plan はエラー")
    check(len(f({"name": "", "age": "x"})) == 2, "問題が 2 つならエラーも 2 件")
`,
            hint: [
              "3 つの項目は互いに独立に判定できます。エラーは見つかったぶんだけ溜めていく形なので、最初の 1 つを見つけた時点で `return` してしまうと「問題が 2 つならエラーも 2 件」のチェックが通りません。",
              "必須の項目でも、キー自体が無いまま呼ばれます。取り出しで落ちない形にしたうえで、「無かった」も不正の一種として同じ判定に流し込めると、`name` も `age` も条件が 1 本にまとまります。",
              "`age` は「整数であること」だけでは足りません。課題文の注記のとおり `True` も整数の一種と見なされるので、型の判定だけでは `True` がすり抜けます。型・`bool` 除外・範囲の 3 つがそろって初めて全部のチェックが通ります。",
              "`plan` だけは省略可で、省略時は `\"free\"` として扱います。先に既定値を埋めてから「許されている値かどうか」を見れば、「キーが無い場合」と「知らない値が来た場合」を別々に書かずに済みます。",
            ],
            solution: `PLANS = {"free", "pro", "team"}


def validate_user(data: dict) -> list:
    errors = []

    name = data.get("name")
    if not isinstance(name, str) or not 1 <= len(name) <= 50:
        errors.append("name が不正です")

    age = data.get("age")
    if not isinstance(age, int) or isinstance(age, bool) or not 0 <= age <= 150:
        errors.append("age が不正です")

    if data.get("plan", "free") not in PLANS:
        errors.append("plan が不正です")

    return errors`,
          },
        },
      ],
    },

    /* ================= 第2章 ================= */
    {
      id: "ch2",
      title: "第2章　FastAPI で書き直す",
      lessons: [
        {
          id: "l4",
          title: "最初の API を動かす",
          goal: "手元で FastAPI を起動できる状態にする",
          body: `
ここまでで自作した「ルーティング」と「検証」を、FastAPI に任せます。

### 手元での準備

~~~
mkdir todo-api && cd todo-api
python3 -m venv .venv
source .venv/bin/activate        # Windows は .venv\\Scripts\\activate
pip install "fastapi[standard]"
~~~

> \`venv\`（仮想環境）はプロジェクトごとにライブラリを分ける仕組みです。作らずに \`pip install\` すると、別プロジェクトとバージョンが衝突します。**必ず作る**習慣をつけましょう。

### 起動する

\`main.py\` を置いて、

~~~
fastapi dev main.py
~~~

これで \`http://127.0.0.1:8000\` で動きます。コードを保存すると自動で再読み込みされます。

### 最大の利点：自動ドキュメント

起動したら \`http://127.0.0.1:8000/docs\` を開いてください。**型ヒントから API ドキュメントが自動生成され、その場で実行できます。** 別途ドキュメントを書く必要がなく、しかも実装とずれません。これが FastAPI が広く使われる理由の 1 つです。

> このブラウザ内ではサーバーを起動できないため、以下は読むだけのコードです。手元にコピーして動かしてみてください。

### もっと詳しく

- [FastAPI チュートリアル（公式・日本語）](https://fastapi.tiangolo.com/ja/tutorial/)
- [仮想環境の作り方（公式）](https://docs.python.org/ja/3/library/venv.html)
`,
          examples: [
            {
              caption: "main.py — 最小の API",
              runnable: false,
              code: `
from fastapi import FastAPI

app = FastAPI(title="Todo API", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/")
def root():
    return {"message": "Hello, FastAPI"}
`,
            },
            {
              caption: "確認のしかた（ターミナル）",
              runnable: false,
              code: `
# 起動
fastapi dev main.py

# 別のターミナルから叩く
curl http://127.0.0.1:8000/health
# → {"ok":true}

curl http://127.0.0.1:8000/
# → {"message":"Hello, FastAPI"}

# ブラウザで自動ドキュメントを開く
# http://127.0.0.1:8000/docs
`,
            },
          ],
          exercise: {
            prompt: `
このレッスンには自動採点の演習はありません。かわりに、**手元で実際に動かしてみてください。**

1. 上の手順で仮想環境を作り、\`fastapi[standard]\` を入れる
2. \`main.py\` を作って \`fastapi dev main.py\` で起動する
3. \`http://127.0.0.1:8000/docs\` を開き、\`/health\` を「Try it out」で実行する

動いたら、下のチェックだけ実行して次へ進みましょう。
`,
            caption: "確認用（そのまま採点を押してください）",
            starter: `
# 手元で FastAPI が起動できたら、ここはそのまま採点を押してください。
done = True
`,
            tests: `
g = globals()
check(g.get("done") is True, "次のレッスンへ進む準備ができた")
`,
          },
        },

        {
          id: "l5",
          title: "パラメータとリクエストボディ",
          goal: "型ヒントだけで入力を受け取れることを理解する",
          body: `
FastAPI では、**関数の引数の書き方だけ**でどこから値を受け取るかが決まります。

| 引数の書き方 | どこから来るか |
|---|---|
| パスに \`{id}\` があり、引数名も \`id\` | パスパラメータ |
| パスに無い、かつ単純な型 | クエリパラメータ |
| Pydantic モデル型 | リクエストボディ（JSON） |

~~~
@app.get("/todos/{todo_id}")
def get_todo(todo_id: int, verbose: bool = False):
    ...
~~~

この 1 行で、\`todo_id\` を **int に変換し**、変換できなければ 422 エラーを自動で返してくれます。第1章で自作した検証が、型ヒントだけで済むわけです。

### ステータスコードとエラー

- 作成時は \`status_code=201\` を指定する
- 見つからないときは \`raise HTTPException(status_code=404, detail="...")\`

### レスポンスの形も型で決める

\`response_model\` を指定すると、返す形が保証され、ドキュメントにも反映されます。パスワードなど**返してはいけない項目を落とす**役割も果たします。

### もっと詳しく

- [パスパラメータ（FastAPI 公式・日本語）](https://fastapi.tiangolo.com/ja/tutorial/path-params/)
- [クエリパラメータ（FastAPI 公式・日本語）](https://fastapi.tiangolo.com/ja/tutorial/query-params/)
- [Pydantic モデル（公式・英語）](https://docs.pydantic.dev/latest/concepts/models/)
`,
          examples: [
            {
              caption: "パラメータの受け取り方いろいろ",
              runnable: false,
              code: `
from fastapi import FastAPI, HTTPException, Query

app = FastAPI()

TODOS = {
    1: {"id": 1, "title": "牛乳を買う", "done": False},
    2: {"id": 2, "title": "資料を読む", "done": True},
}


# パスパラメータ（int に自動変換 + 検証）
@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    todo = TODOS.get(todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="そのタスクはありません")
    return todo


# クエリパラメータ（?done=true&limit=10）
@app.get("/todos")
def list_todos(
    done: bool | None = None,
    limit: int = Query(default=10, ge=1, le=100),
):
    items = list(TODOS.values())
    if done is not None:
        items = [t for t in items if t["done"] == done]
    return {"total": len(items), "items": items[:limit]}
`,
            },
            {
              caption: "リクエストボディとレスポンスモデル",
              runnable: false,
              code: `
from fastapi import FastAPI, status
from pydantic import BaseModel, Field

app = FastAPI()


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    done: bool = False


class TodoOut(BaseModel):
    id: int
    title: str
    done: bool


TODOS: dict[int, dict] = {}
next_id = 1


@app.post("/todos", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate):
    global next_id
    todo = {"id": next_id, **payload.model_dump()}
    TODOS[next_id] = todo
    next_id += 1
    return todo
`,
            },
          ],
          exercise: {
            prompt: `
FastAPI が裏でやっている**クエリパラメータの型変換**を、自分で書いてみましょう。

関数 \`coerce_query(raw, spec)\` を作ってください。

- \`raw\` … \`{"limit": "20", "done": "true"}\` のような**文字列だけ**の辞書（URL から来た値）
- \`spec\` … \`{"limit": (int, 10), "done": (bool, False)}\` のような \`{名前: (型, 既定値)}\`
- 戻り値 … 型変換した辞書。\`raw\` に無いキーは既定値を使う
- \`bool\` は \`"true"\`, \`"1"\`, \`"yes"\`（大文字小文字は無視）を \`True\`、それ以外を \`False\` とする
- 変換できない値（\`int("abc")\` など）は \`ValueError\` をそのまま送出してよい
`,
            starter: `
def coerce_query(raw, spec):
    pass


spec = {"limit": (int, 10), "done": (bool, False), "q": (str, "")}

print(coerce_query({"limit": "20", "done": "true"}, spec))
print(coerce_query({}, spec))
print(coerce_query({"done": "NO", "q": "python"}, spec))
`,
            tests: `
g = globals()
f = g.get("coerce_query")
spec = {"limit": (int, 10), "done": (bool, False), "q": (str, "")}

check(callable(f), "coerce_query という関数を定義できている")
if callable(f):
    r = f({"limit": "20", "done": "true"}, spec)
    check(r == {"limit": 20, "done": True, "q": ""}, f"型変換と既定値が正しい（今は {r}）")
    check(isinstance(r["limit"], int), "limit が int になっている")

    check(f({}, spec) == {"limit": 10, "done": False, "q": ""}, "全部省略なら既定値になる")
    check(f({"done": "NO", "q": "python"}, spec)["done"] is False, '"NO" は False')
    check(f({"done": "Yes"}, spec)["done"] is True, '"Yes" は True（大文字小文字を無視）')
    check(f({"done": "1"}, spec)["done"] is True, '"1" は True')

    try:
        f({"limit": "abc"}, spec)
        raised = False
    except ValueError:
        raised = True
    check(raised, "変換できない値では ValueError になる")
`,
            hint: [
              "回すのは `raw` ではなく `spec` です。`raw` に無いキーも既定値つきで結果に入れる必要があるので、「何を返すべきか」を知っている側を基準にすると、抜けが出ません。`spec` の値は `(型, 既定値)` の 2 つ組です。",
              "各キーは「`raw` に来ているか / 来ていないか」の 2 通り。来ていなければ既定値をそのまま入れ、来ていれば文字列を指定された型に変換します。変換に失敗したときは、そのままエラーが上がって構いません（受け止めなくてよい、というのが課題の指定です）。",
              "`bool` だけは他の型と同じようにはいきません。`\"false\"` も `\"NO\"` も、空でない文字列は真になってしまうからです。真とみなす言葉をあらかじめ決めておき、来た文字列がそれに当てはまるかで判定します。大文字小文字を無視する必要もあります。",
              "`bool` 以外は、`spec` から受け取った型そのものが変換に使えます。Python では型も呼び出せる値なので、`int` か `str` かで分岐を書き分ける必要はありません。",
            ],
            solution: `TRUTHY = {"true", "1", "yes"}


def coerce_query(raw: dict, spec: dict) -> dict:
    result = {}

    for name, (type_, default) in spec.items():
        if name not in raw:
            result[name] = default
            continue

        value = raw[name]
        if type_ is bool:
            result[name] = value.strip().lower() in TRUTHY
        else:
            result[name] = type_(value)

    return result`,
          },
        },
      ],
    },

    /* ================= 第3章 ================= */
    {
      id: "ch3",
      title: "第3章　卒業制作",
      lessons: [
        {
          id: "l6",
          title: "TODO API を組み立てる",
          goal: "CRUD を一通り備えたサービス層を書き、FastAPI に載せる",
          body: `
仕上げに TODO API を作ります。ポイントは **「保存と取り出しの処理（サービス層）」を、Web フレームワークから独立させる** ことです。

~~~
リクエスト → FastAPI（受け取り・検証） → サービス層（本体の処理） → レスポンス
~~~

こう分けておくと、

- ブラウザでもテストでも、サービス層だけ単体で動かせる
- あとで保存先を辞書からデータベースに替えても、API 側は変えなくてよい

という利点があります。**このレッスンでは、そのサービス層を書きます。** ブラウザの中で完結し、そのまま手元の FastAPI に載せられるコードです。

### CRUD の対応表

| 操作 | HTTP | サービス層のメソッド |
|---|---|---|
| 一覧 | \`GET /todos\` | \`list_todos()\` |
| 取得 | \`GET /todos/{id}\` | \`get(id)\` |
| 作成 | \`POST /todos\` | \`create(title)\` |
| 更新 | \`PATCH /todos/{id}\` | \`update(id, ...)\` |
| 削除 | \`DELETE /todos/{id}\` | \`delete(id)\` |
`,
          examples: [
            {
              caption: "サービス層を FastAPI に載せた形（参考）",
              runnable: false,
              code: `
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from service import TodoService, TodoNotFound   # ← 演習で作るクラス

app = FastAPI(title="Todo API")
service = TodoService()


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    done: bool | None = None


@app.get("/todos")
def list_todos(done: bool | None = None):
    return service.list_todos(done=done)


@app.post("/todos", status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate):
    return service.create(payload.title)


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, payload: TodoUpdate):
    try:
        return service.update(todo_id, **payload.model_dump(exclude_unset=True))
    except TodoNotFound:
        raise HTTPException(status_code=404, detail="そのタスクはありません")


@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int):
    try:
        service.delete(todo_id)
    except TodoNotFound:
        raise HTTPException(status_code=404, detail="そのタスクはありません")
`,
            },
          ],
          exercise: {
            prompt: `
\`TodoService\` クラスを完成させてください。

- \`__init__\` … 空の辞書 \`self._items\` と、次の ID \`self._next_id = 1\` を用意する
- \`create(title)\` … \`{"id": 連番, "title": title, "done": False}\` を保存して**その辞書を返す**
  - \`title\` が空文字（または空白だけ）なら \`ValueError\` を送出する
- \`get(todo_id)\` … 該当の辞書を返す。無ければ \`TodoNotFound\` を送出する
- \`list_todos(done=None)\` … リストを返す。\`done\` が \`True\`/\`False\` ならその状態のものだけ
- \`update(todo_id, **changes)\` … \`title\` と \`done\` だけを更新して、更新後の辞書を返す
  - 無ければ \`TodoNotFound\`
- \`delete(todo_id)\` … 削除する。無ければ \`TodoNotFound\`

> ID は削除しても再利用しません（\`_next_id\` は増える一方）。
`,
            starter: `
class TodoNotFound(Exception):
    """指定された ID のタスクが無いときに送出する。"""


class TodoService:
    def __init__(self):
        pass

    def create(self, title):
        pass

    def get(self, todo_id):
        pass

    def list_todos(self, done=None):
        pass

    def update(self, todo_id, **changes):
        pass

    def delete(self, todo_id):
        pass


# --- 動作確認 ---
service = TodoService()
service.create("牛乳を買う")
service.create("資料を読む")
service.update(2, done=True)

for todo in service.list_todos():
    mark = "済" if todo["done"] else "未"
    print(f'[{mark}] {todo["id"]}. {todo["title"]}')

print("完了のみ:", service.list_todos(done=True))
`,
            tests: `
g = globals()
S = g.get("TodoService")
NF = g.get("TodoNotFound")

check(S is not None, "TodoService クラスを定義できている")

if S is not None:
    s = S()
    check(s.list_todos() == [], "作りたてなら一覧は空")

    a = s.create("牛乳を買う")
    check(a == {"id": 1, "title": "牛乳を買う", "done": False}, f"create が正しい辞書を返す（今は {a}）")

    b = s.create("資料を読む")
    check(b["id"] == 2, "ID が連番になっている")
    check(len(s.list_todos()) == 2, "一覧が 2 件になっている")

    check(s.get(1)["title"] == "牛乳を買う", "get で取り出せる")

    updated = s.update(2, done=True)
    check(updated["done"] is True, "update で done を変えられる")
    check(s.update(2, title="復習する")["title"] == "復習する", "update で title を変えられる")
    check(s.get(2)["id"] == 2, "update しても id は変わらない")

    check(s.list_todos(done=True) == [s.get(2)], "done=True で絞り込める")
    check(len(s.list_todos(done=False)) == 1, "done=False でも絞り込める")

    s.delete(1)
    check(len(s.list_todos()) == 1, "delete で件数が減る")
    check(s.create("次のタスク")["id"] == 3, "削除後も ID は再利用されない")

    def raises(fn, exc):
        try:
            fn()
        except exc:
            return True
        except Exception:
            return False
        return False

    check(raises(lambda: s.get(999), NF), "無い ID の get で TodoNotFound")
    check(raises(lambda: s.update(999, done=True), NF), "無い ID の update で TodoNotFound")
    check(raises(lambda: s.delete(999), NF), "無い ID の delete で TodoNotFound")
    check(raises(lambda: s.create("   "), ValueError), "空白だけの title は ValueError")
`,
            hint: [
              "メソッドは 6 つありますが、状態は 2 つ（保存先と次の ID）だけです。`__init__` → `create` → `get` → 残り、の順に書いて、そのつど採点すると切り分けやすくなります。ID で 1 件を引く操作が多いので、保存先は「ID から 1 件を引ける形」にしておくと後が楽です。",
              "`create` … 空白だけの `\"   \"` も弾く必要があります。「文字が入っているか」を見るには、前後の空白を落としてから判断します。ID は削除しても再利用しないので、次の ID は「今ある件数」から計算するのではなく、使うたびに増やしていくカウンタとして持ちます。",
              "`update` と `delete` は、どちらも「無い ID なら `TodoNotFound`」という同じ前提から始まります。`get` がすでにその判定をしているので、先頭で自分の `get` を呼べば、存在チェックを 3 か所に書き散らさずに済みます。",
              "`update` は `title` と `done` **だけ**を反映します。渡された `changes` をまるごと上書きすると `id` まで書き換えられてしまい、「update しても id は変わらない」チェックで落ちます。`list_todos` は `done=None`（絞り込みなし）と、`True`/`False` での絞り込みを区別してください。",
            ],
            solution: `class TodoNotFound(Exception):
    """指定された ID のタスクが無いときに送出する。"""


class TodoService:
    def __init__(self):
        self._items: dict[int, dict] = {}
        self._next_id = 1

    def create(self, title: str) -> dict:
        if not title or not title.strip():
            raise ValueError("title は必須です")

        todo = {"id": self._next_id, "title": title, "done": False}
        self._items[self._next_id] = todo
        self._next_id += 1
        return todo

    def get(self, todo_id: int) -> dict:
        if todo_id not in self._items:
            raise TodoNotFound(todo_id)
        return self._items[todo_id]

    def list_todos(self, done=None) -> list:
        items = list(self._items.values())
        if done is None:
            return items
        return [t for t in items if t["done"] == done]

    def update(self, todo_id: int, **changes) -> dict:
        todo = self.get(todo_id)
        for key in ("title", "done"):
            if key in changes and changes[key] is not None:
                todo[key] = changes[key]
        return todo

    def delete(self, todo_id: int) -> None:
        self.get(todo_id)
        del self._items[todo_id]`,
          },
        },
      ],
    },
  ],
};

export default content;
