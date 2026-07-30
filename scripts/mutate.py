"""解答例を少しだけ「間違えた」版に書き換えて並べる。

    python scripts/mutate.py <解答例のファイル>

標準出力に JSON で [{"kind": ..., "detail": ..., "code": ...}, ...] を返す。
scripts/audit-grading.mjs が、これらを採点にかけて「間違えたのに通ってしまう」
書き換えを探すために使う（採点がどこまで見ているかの調査）。

ast を使うので、文字列やコメントの中身を壊す心配がない。書き換えたコードは
ast.unparse で組み直すため見た目は変わるが、動きは同じものになる。
"""

import ast
import copy
import json
import sys


def _unparse(tree):
    try:
        return ast.unparse(tree)
    except Exception:
        return None


def _numbers(tree):
    """数値リテラルを 1 つずつずらす（境界や期待値を見ているかの確認）。"""
    targets = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float))
        and not isinstance(node.value, bool)
    ]
    for i in range(len(targets)):
        clone = copy.deepcopy(tree)
        spots = [
            node
            for node in ast.walk(clone)
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float))
            and not isinstance(node.value, bool)
        ]
        node = spots[i]
        before = node.value
        node.value = before + 1
        code = _unparse(clone)
        if code:
            yield {"kind": "数値", "detail": f"{before!r} → {node.value!r}", "code": code}


def _docstrings(tree):
    """docstring の Constant を集める（書き換えても意味が変わらないので除く）。"""
    found = set()
    for node in ast.walk(tree):
        body = getattr(node, "body", None)
        if not isinstance(body, list) or not body:
            continue
        first = body[0]
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            if isinstance(first.value.value, str):
                found.add(id(first.value))
    return found


def _is_run_pytest(node):
    """run_pytest(...) の呼び出しかどうか（この学習アプリ専用のヘルパー）。"""
    call = node.value if isinstance(node, (ast.Expr, ast.Assign)) else node
    return (
        isinstance(call, ast.Call)
        and isinstance(call.func, ast.Name)
        and call.func.id == "run_pytest"
    )


def _string_targets(tree):
    """書き換える対象の文字列リテラルを、木の中の出現順で返す。

    docstring と run_pytest("-v") の引数は外す。どちらも書き換えても
    「間違えた回答」にはならないので、採点の甘さの話にならない。
    """
    skip = _docstrings(tree)
    for node in ast.walk(tree):
        if _is_run_pytest(node):
            call = node.value if isinstance(node, (ast.Expr, ast.Assign)) else node
            for arg in call.args:
                if isinstance(arg, ast.Constant):
                    skip.add(id(arg))

    return [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant)
        and isinstance(node.value, str)
        and id(node) not in skip
    ]


def _strings(tree):
    """文字列リテラルの末尾を変える（表示の文言まで見ているかの確認）。"""
    count = len(_string_targets(tree))
    for i in range(count):
        clone = copy.deepcopy(tree)
        node = _string_targets(clone)[i]
        before = node.value
        if before.strip() == "" or len(before) > 60:
            continue
        node.value = before + "x"
        code = _unparse(clone)
        if code:
            yield {
                "kind": "文字列",
                "detail": f"{before!r} → {node.value!r}",
                "code": code,
            }


FLIP = {
    ast.Gt: ast.Lt,
    ast.Lt: ast.Gt,
    ast.GtE: ast.LtE,
    ast.LtE: ast.GtE,
    ast.Eq: ast.NotEq,
    ast.NotEq: ast.Eq,
    ast.In: ast.NotIn,
    ast.NotIn: ast.In,
}


def _comparisons(tree):
    """比較をひっくり返す（条件の向きを見ているかの確認）。"""
    def spots(t):
        found = []
        for node in ast.walk(t):
            if isinstance(node, ast.Compare):
                for j, op in enumerate(node.ops):
                    if type(op) in FLIP:
                        found.append((node, j))
        return found

    for i in range(len(spots(tree))):
        clone = copy.deepcopy(tree)
        node, j = spots(clone)[i]
        before = type(node.ops[j])
        node.ops[j] = FLIP[before]()
        code = _unparse(clone)
        if code:
            yield {
                "kind": "比較",
                "detail": f"{before.__name__} → {FLIP[before].__name__}",
                "code": code,
            }


def _statements(tree):
    """文を 1 つ消す（その処理が採点で見られているかの確認）。"""
    holders = []

    def collect(node):
        for field in ("body", "orelse", "finalbody"):
            body = getattr(node, field, None)
            if isinstance(body, list) and all(isinstance(s, ast.stmt) for s in body):
                holders.append((node, field, len(body)))
        for child in ast.iter_child_nodes(node):
            collect(child)

    collect(tree)

    for hi, (_, field, length) in enumerate(holders):
        for si in range(length):
            clone = copy.deepcopy(tree)
            spots = []

            def collect_clone(node):
                for f in ("body", "orelse", "finalbody"):
                    body = getattr(node, f, None)
                    if isinstance(body, list) and all(isinstance(s, ast.stmt) for s in body):
                        spots.append((node, f))
                for child in ast.iter_child_nodes(node):
                    collect_clone(child)

            collect_clone(clone)
            holder, f = spots[hi]
            body = getattr(holder, f)
            removed = body[si]
            # import と関数・クラスの定義そのものを消すと NameError で必ず落ちる。
            # 「採点が見ていない」の話にならないので飛ばす。
            if isinstance(
                removed,
                (ast.Import, ast.ImportFrom, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef),
            ):
                continue
            # run_pytest() の呼び出しは、採点が自分で走らせ直すので消しても同じ
            if _is_run_pytest(removed):
                continue
            label = _unparse(ast.Module(body=[removed], type_ignores=[])) or "?"
            del body[si]
            if not body:
                body.append(ast.Pass())
            code = _unparse(clone)
            if code:
                yield {
                    "kind": "文の削除",
                    "detail": label.strip().split("\n")[0][:80],
                    "code": code,
                }


def main():
    source = open(sys.argv[1], encoding="utf-8").read()
    tree = ast.parse(source)

    mutants = []
    seen = {source, _unparse(tree)}
    for gen in (_numbers, _strings, _comparisons, _statements):
        for mutant in gen(tree):
            if mutant["code"] in seen:
                continue
            seen.add(mutant["code"])
            mutants.append(mutant)

    json.dump(mutants, sys.stdout, ensure_ascii=False)


main()
