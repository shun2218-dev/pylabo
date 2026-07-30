/* ============================================================
   ブラウザ内 Python に足すヘルパー（Python ソース）
   ------------------------------------------------------------
   ワーカー（src/lib/pyodide.worker.ts）と、解答例の検証スクリプト
   （scripts/verify-exercises.mjs）の両方から使う。両方に同じ Python を
   書くと必ず片方だけ直して食い違うため、ここ 1 か所に置いている。

   検証スクリプトは esbuild でこのファイルを束ねて読み込む。
   ============================================================ */

/**
 * 「テストと品質」コース用のヘルパー。
 *
 * 学習アプリのエディタはファイルが 1 枚しかないので、そのままでは
 * 「テストファイルを pytest にかける」という体験ができない。
 * そこで、いま書いているコードをそのままテストファイルとして書き出し、
 * pytest に渡すヘルパーを用意している。
 *
 * レッスンから使うのは run_pytest() だけ。採点からはこれに加えて
 * _source()（エディタの中身）と _replace_def()（実装だけ差し替えたソースを作る）
 * を使う。pytest の import は呼ばれたときに行うので、pytest を読み込まない
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
        self.results = []

    def pytest_runtest_logreport(self, report):
        # 1 テストにつき setup / call / teardown が来る。本体（call）だけ数え、
        # 前準備で落ちたものは失敗として拾う。
        if report.when == "call":
            self.results.append((report.nodeid, report.outcome))
        elif report.outcome == "failed":
            self.results.append((report.nodeid, "failed"))


def _without_run_pytest(src):
    """
    run_pytest(...) の呼び出しだけを空行に置き換えたソースを返す。

    書き出したファイルは pytest が import する（＝トップレベルが動く）ので、
    呼び出しが残っていると無限に入れ子になる。失敗レポートの行番号が
    エディタとずれないよう、行を消さずに空にしている。
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
            and called.func.id == "run_pytest"
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
        f.write(_without_run_pytest(_source() if source is None else source))

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
    if not quiet:
        print(report, end="" if report.endswith("\n") else "\n")

    return _PytestOutcome(exit_code, recorder.results, report)
`;
