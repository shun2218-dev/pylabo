/* ============================================================
   ブラウザ内 Python に足すヘルパー（Python ソース）
   ------------------------------------------------------------
   ワーカー（src/lib/pyodide.worker.ts）と、解答例の検証スクリプト
   （scripts/verify-exercises.mjs）の両方から使う。両方に同じ Python を
   書くと必ず片方だけ直して食い違うため、ここ 1 か所に置いている。

   検証スクリプトは esbuild でこのファイルを束ねて読み込む。
   ============================================================ */

/**
 * 「テストと品質」「型ヒントと静的解析」コース用のヘルパー。
 *
 * 学習アプリのエディタはファイルが 1 枚しかないので、そのままでは
 * 「ファイルを pytest / mypy にかける」という体験ができない。そこで、
 * いま書いているコードをそのままファイルとして書き出し、道具に渡す
 * ヘルパーを用意している。
 *
 * レッスンから使うのは run_pytest() と run_mypy() だけ。採点からはこれに加えて
 * _source()（エディタの中身）と _replace_def()（実装だけ差し替えたソースを作る）
 * を使う。pytest と mypy の import は呼ばれたときに行うので、それらを読み込まない
 * ほかのコースで定義されていても害はない。
 *
 * 前提: 実行前に _pylabo_source（エディタの中身）が名前空間にあること。
 */
export const PYTHON_HELPERS = String.raw`
def _source():
    """いまエディタに書かれているコードの文字列（この学習アプリ専用）。"""
    return _pylabo_source


def _replace_def(source, name, replacement):
    """
    トップレベルの def / class を 1 つだけ差し替えたソースを返す（採点用）。

    「学習者が書いたテストは、壊れた実装をちゃんと落とせるか」を見るために使う。
    エディタが 1 枚なので実装とテストが同じファイルに並んでいる。実装だけを
    壊した版に置き換えたソースを作れば、テストの中身を確かめられる。
    （テストが書けているかを個数だけで見ると、中身が空でも通ってしまう）

    デコレータ付きの関数も丸ごと残すため、行番号から切り出している。
    """
    import ast

    lines = source.split("\n")
    tree = ast.parse(source)
    pieces = []

    for node in tree.body:
        defined = isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
        if defined and node.name == name:
            pieces.append(replacement.strip("\n"))
            continue

        start = node.lineno
        for decorator in getattr(node, "decorator_list", []):
            start = min(start, decorator.lineno)
        pieces.append("\n".join(lines[start - 1 : node.end_lineno]))

    return "\n\n".join(pieces)


class _PytestOutcome:
    """run_pytest() の結果。採点からも参照する。"""

    def __init__(self, exit_code, results, output):
        self.exit_code = int(exit_code)
        # [(nodeid, "passed" / "failed" / "skipped"), ...]
        self.results = results
        self.output = output

    @property
    def passed(self):
        return [name for name, outcome in self.results if outcome == "passed"]

    @property
    def failed(self):
        return [name for name, outcome in self.results if outcome == "failed"]

    @property
    def ok(self):
        """1 つ以上テストがあって、すべて通ったか。"""
        return self.exit_code == 0 and len(self.results) > 0

    def __repr__(self):
        return "<pytest {} passed / {} failed>".format(
            len(self.passed), len(self.failed)
        )


class _PytestRecorder:
    """pytest のプラグイン。どのテストがどうなったかを集める。"""

    def __init__(self):
        self._outcomes = {}
        self._order = []

    def pytest_runtest_logreport(self, report):
        """
        1 テストにつき setup / call / teardown の 3 回呼ばれる。本体（call）を
        結果とし、前準備・後片付けで落ちたものは失敗として拾う。

        テスト 1 件は必ず 1 件として数える。本体が落ちたうえに後片付けでも
        落ちた場合など、同じテストで 2 回拾える場面があり、そのまま並べると
        「テストを N 件以上書けている」の採点が実際より多く数えてしまう。
        """
        if report.when == "call":
            outcome = report.outcome
        elif report.outcome == "failed":
            outcome = "failed"
        else:
            return

        if report.nodeid not in self._outcomes:
            self._order.append(report.nodeid)
            self._outcomes[report.nodeid] = outcome
        elif outcome == "failed":
            # 落ちたことのほうを残す（片付けで落ちても、そのテストは失敗）
            self._outcomes[report.nodeid] = "failed"

    @property
    def results(self):
        """[(nodeid, "passed" / "failed"), ...] を実行順で返す。"""
        return [(nodeid, self._outcomes[nodeid]) for nodeid in self._order]


def _without_call(src, func_name):
    """
    トップレベルの func_name(...) の呼び出しだけを空行に置き換えたソースを返す。

    run_pytest が書き出したファイルは pytest が import する（＝トップレベルが
    動く）ので、呼び出しが残っていると無限に入れ子になる。run_mypy のほうは、
    このアプリだけの名前を mypy が「未定義」と報告してしまう。
    どちらも、失敗レポートの行番号がエディタとずれないよう、行を消さずに
    空にしている。
    """
    import ast

    lines = src.split("\n")
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return src

    for node in tree.body:
        called = None
        if isinstance(node, (ast.Expr, ast.Assign)):
            called = node.value
        if (
            isinstance(called, ast.Call)
            and isinstance(called.func, ast.Name)
            and called.func.id == func_name
        ):
            for i in range(node.lineno - 1, (node.end_lineno or node.lineno)):
                lines[i] = ""

    return "\n".join(lines)


def run_pytest(*args, **kwargs):
    """
    いま書いているコードを 1 枚のテストファイルとして pytest にかける。

        run_pytest()          # 静かめの出力
        run_pytest("-v")      # 1 テストずつ結果を出す

    手元の環境では、テストをファイルに保存して pytest コマンドを叩きます。
    このヘルパーは、エディタが 1 枚しかないこのアプリだけのものです。

    キーワード引数（採点で使う）:
      source  … テストファイルの中身を明示する（既定はエディタの中身）
      modules … {"calc": "..."} でテスト対象のモジュールを差し替える
      name    … 書き出すテストファイル名（既定 "test_lesson"）
      quiet   … True にすると pytest の出力を画面に流さない
    """
    import importlib
    import io
    import shutil
    import sys

    import pytest

    source = kwargs.pop("source", None)
    modules = kwargs.pop("modules", None) or {}
    name = kwargs.pop("name", "test_lesson")
    quiet = kwargs.pop("quiet", False)
    if kwargs:
        raise TypeError("run_pytest() の知らない引数: " + ", ".join(sorted(kwargs)))

    # テスト対象のモジュールを差し替える（採点で「壊した版」を試すときに使う）
    for mod_name, mod_source in modules.items():
        with open(mod_name + ".py", "w") as f:
            f.write(mod_source)

    path = name + ".py"
    with open(path, "w") as f:
        f.write(_without_call(_source() if source is None else source, "run_pytest"))

    # 同じ名前のファイルを何度も書き換えるので、前回の import は捨てる。
    # 差し替えたモジュールは実行後にも捨てる。そうしないと、次の実行で
    # ファイルが元に戻っても sys.modules 側が古いままになる。
    stale = [name] + list(modules)
    for mod_name in stale:
        sys.modules.pop(mod_name, None)
    shutil.rmtree("__pycache__", ignore_errors=True)
    importlib.invalidate_caches()

    recorder = _PytestRecorder()

    # pytest の出力は、そのまま流すと採点から読めないので一度ためる
    buffered = io.StringIO()
    real_stdout = sys.stdout
    sys.stdout = buffered
    try:
        exit_code = pytest.main(
            ["-q", "-p", "no:cacheprovider", path] + list(args),
            plugins=[recorder],
        )
    finally:
        sys.stdout = real_stdout
        for mod_name in stale:
            sys.modules.pop(mod_name, None)

    report = buffered.getvalue()
    # 出力が空のときに print すると、意味のない空行が 1 行出てしまう
    if not quiet and report:
        print(report, end="" if report.endswith("\n") else "\n")

    return _PytestOutcome(exit_code, recorder.results, report)


# mypy のキャッシュ置き場。2 回目以降のチェックが目に見えて速くなる
# （初回は型情報を読み込むぶん数秒かかる）。実行ごとの作業ディレクトリとは
# 別の場所に置き、レッスンをまたいで使い回す。
_MYPY_CACHE = "/tmp/pylabo-mypy-cache"


class _MypyMessage:
    """mypy が出した 1 件。"""

    def __init__(self, line, severity, message, code):
        self.line = line
        self.severity = severity
        self.message = message
        self.code = code

    def __repr__(self):
        code = " [" + self.code + "]" if self.code else ""
        return "<{}行目 {}: {}{}>".format(self.line, self.severity, self.message, code)


class _MypyOutcome:
    """run_mypy() の結果。採点からも参照する。"""

    def __init__(self, exit_code, messages, output):
        self.exit_code = int(exit_code)
        self.messages = messages
        self.output = output

    @property
    def errors(self):
        return [m for m in self.messages if m.severity == "error"]

    @property
    def notes(self):
        return [m for m in self.messages if m.severity == "note"]

    @property
    def ok(self):
        """型エラーが 1 件も無いか。"""
        return self.exit_code == 0

    @property
    def codes(self):
        """エラーコード（arg-type / assignment など）の一覧。"""
        return [m.code for m in self.errors]

    @property
    def lines(self):
        """エラーが出た行番号の一覧。エディタの行と一致する。"""
        return [m.line for m in self.errors]

    def find(self, code=None, line=None, contains=None):
        """条件に当てはまるエラーだけを取り出す（採点で使う）。"""
        found = []
        for message in self.errors:
            if code is not None and message.code != code:
                continue
            if line is not None and message.line != line:
                continue
            if contains is not None and contains not in message.message:
                continue
            found.append(message)
        return found

    def __repr__(self):
        return "<mypy エラー {} 件>".format(len(self.errors))


def _parse_mypy(output, filename):
    """mypy の出力を 1 行ずつ読んで _MypyMessage にする。"""
    import re

    head = re.compile(re.escape(filename) + r":(\d+)(?::\d+)?: (error|note|warning): (.*)$")
    tail = re.compile(r"\s+\[([\w-]+)\]$")

    messages = []
    for raw in output.split("\n"):
        found = head.match(raw.rstrip())
        if not found:
            continue

        text = found.group(3)
        code = None
        # 末尾の [arg-type] のようなエラーコードは、本文と分けて持つ
        marked = tail.search(text)
        if marked:
            code = marked.group(1)
            text = text[: marked.start()].rstrip()

        messages.append(_MypyMessage(int(found.group(1)), found.group(2), text, code))

    return messages


def run_mypy(*args, **kwargs):
    """
    いま書いているコードを 1 枚のファイルとして mypy にかける。

        run_mypy()            # 型チェックして、見つかったものを表示する
        run_mypy("--strict")  # 引数はそのまま mypy へ渡る

    手元の環境では、ファイルを保存して mypy コマンドを叩きます。
    このヘルパーは、エディタが 1 枚しかないこのアプリだけのものです。

    キーワード引数（採点で使う）:
      source … チェックする中身を明示する（既定はエディタの中身）
      name   … 書き出すファイル名（既定 "lesson"）
      quiet  … True にすると mypy の出力を画面に流さない
    """
    from mypy import api

    source = kwargs.pop("source", None)
    name = kwargs.pop("name", "lesson")
    quiet = kwargs.pop("quiet", False)
    if kwargs:
        raise TypeError("run_mypy() の知らない引数: " + ", ".join(sorted(kwargs)))

    path = name + ".py"
    with open(path, "w") as f:
        f.write(_without_call(_source() if source is None else source, "run_mypy"))

    out, err, exit_code = api.run(
        ["--no-color-output", "--cache-dir=" + _MYPY_CACHE, path] + list(args)
    )

    report = out + err
    if not quiet and report:
        print(report, end="" if report.endswith("\n") else "\n")

    return _MypyOutcome(exit_code, _parse_mypy(out, path), report)
`;
