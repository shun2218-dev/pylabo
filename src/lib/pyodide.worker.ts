/* ============================================================
   Pyodide ワーカー
   ------------------------------------------------------------
   ・UI を止めないよう Python の実行はすべてここで行う
   ・無限ループを書いてしまっても terminate すれば復帰できる
   ・ランタイムは public/pyodide/（npm の pyodide をコピーしたもの）から読む
   ============================================================ */

import type { PyodideInterface } from "pyodide";
import { IMAGE_MARKER } from "./protocol";
import type { CheckResult, WorkerRequest, WorkerResponse } from "./protocol";

const BASE = import.meta.env.BASE_URL || "/";
const PYODIDE_DIR = new URL(`${BASE}pyodide/`, self.location.href).href;

let pyodide: PyodideInterface | null = null;
const loadedPackages = new Set<string>();

/* 実行のたびに、まっさらな名前空間へ流し込む前処理。
   - print の内容を「画面へ流す」と「採点で参照する」の両方に配る
   - check() : 演習の採点で使うヘルパー
   - show()  : matplotlib の図を画面に出すヘルパー           */
const PREAMBLE = `
import io
import os
import sys

os.environ.setdefault("MPLBACKEND", "agg")

if not hasattr(sys, "_lab_real_stdout"):
    sys._lab_real_stdout = sys.stdout
_real_stdout = sys._lab_real_stdout


class _Tee(io.TextIOBase):
    """画面表示と、あとで採点に使うバッファの両方へ書き込む。"""

    def __init__(self, real):
        self._real = real
        self.buf = io.StringIO()

    def write(self, s):
        self.buf.write(s)
        return self._real.write(s)

    def flush(self):
        self._real.flush()


_tee = _Tee(_real_stdout)
sys.stdout = _tee


def _stdout():
    """このレッスンで print された内容をまとめて返す。"""
    return _tee.buf.getvalue()


_checks = []


def check(cond, message):
    """採点用。cond が真ならその項目はクリア。"""
    _checks.append((bool(cond), str(message)))


_shown_images = []


def show():
    """matplotlib の現在の図を画面に表示する（この学習アプリ専用のヘルパー）。"""
    import base64

    import matplotlib.pyplot as plt

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=110, bbox_inches="tight")
    plt.close("all")

    _shown_images.append(True)

    # 目印は必ず行頭に置く。print(..., end="") の直後だと行の途中になり、
    # 画面側が図として認識できずに base64 がそのまま出てしまうため。
    written = _tee.buf.getvalue()
    if written and not written.endswith("\\n"):
        print()

    print(${JSON.stringify(IMAGE_MARKER)} + base64.b64encode(buf.getvalue()).decode())


def _shown():
    """採点用。show() で図を出したかどうか。"""
    return len(_shown_images) > 0
`;

function post(msg: WorkerResponse): void {
  self.postMessage(msg);
}

async function boot(): Promise<void> {
  post({ type: "status", state: "loading", label: "Python を起動中…" });

  // public/ から配信しているランタイムを読む（バンドル対象外なので @vite-ignore）
  const mod = (await import(
    /* @vite-ignore */ `${PYODIDE_DIR}pyodide.mjs`
  )) as typeof import("pyodide");

  pyodide = await mod.loadPyodide({ indexURL: PYODIDE_DIR });

  pyodide.setStdout({
    batched: (text: string) => post({ type: "out", stream: "stdout", text: text + "\n" }),
  });
  pyodide.setStderr({
    batched: (text: string) => post({ type: "out", stream: "stderr", text: text + "\n" }),
  });

  post({ type: "status", state: "ready", label: "Python 準備完了" });
}

async function ensurePackages(packages: string[]): Promise<void> {
  const todo = packages.filter((p) => !loadedPackages.has(p));
  if (todo.length === 0) return;

  post({ type: "status", state: "loading", label: `${todo.join(", ")} を読み込み中…` });
  // 「Loading …」の進捗表示は学習者の出力に混ぜたくないので捨てる
  await pyodide!.loadPackage(todo, { messageCallback: () => {} });
  todo.forEach((p) => loadedPackages.add(p));
}

function writeFiles(files: Record<string, string> | null): void {
  if (!files) return;
  for (const [name, content] of Object.entries(files)) {
    pyodide!.FS.writeFile(name, content);
  }
}

/**
 * traceback から、学習者に関係のない内部フレームを落とす。
 *
 * Pyodide のトレースバックは、学習者のコードに入るまでに Pyodide 自身の
 * フレームを何段も挟む。学習者のコードは "<exec>" という名前で実行されるので、
 * 最初の <exec> フレーム以降だけを残す。
 */
function cleanTraceback(text: string): string {
  const lines = String(text).split("\n");
  const start = lines.findIndex((line) => line.includes('File "<exec>"'));

  if (start === -1) {
    // 学習者のコードのフレームが無いときは、最後のエラー行だけ見せる
    const message = lines.filter((line) => line.trim()).pop();
    return (message ?? text).trim();
  }

  return ["Traceback (most recent call last):", ...lines.slice(start)]
    .join("\n")
    .trim();
}

const errorText = (e: unknown): string =>
  cleanTraceback(e instanceof Error ? e.message : String(e));

async function execute(req: Extract<WorkerRequest, { type: "run" }>): Promise<void> {
  post({ type: "status", state: "busy", label: "実行中…" });

  let ok = false;
  let error: string | null = null;
  let checks: CheckResult[] = [];

  // Pyodide の PyProxy（名前空間の dict）。型が公開されていないため any で持つ。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ns: any = null;

  try {
    await ensurePackages(req.packages);
    writeFiles(req.files);

    ns = pyodide!.runPython("{}"); // まっさらな名前空間（PyProxy の dict）
    await pyodide!.runPythonAsync(PREAMBLE, { globals: ns });

    try {
      await pyodide!.runPythonAsync(req.code, { globals: ns });
      ok = true;
    } catch (e) {
      error = errorText(e);
    }

    // 書いたコードがエラーで止まったなら採点はしない
    if (ok && req.tests) {
      try {
        await pyodide!.runPythonAsync(req.tests, { globals: ns });
      } catch (e) {
        ok = false;
        error =
          "採点中にエラーが起きました。指示どおりの名前で変数や関数を定義できているか確認してみましょう。\n\n" +
          errorText(e);
      }

      const raw = ns.get("_checks");
      if (raw) {
        checks = (raw.toJs({ create_proxies: false }) as [boolean, string][]).map(
          ([pass, message]) => ({ pass: Boolean(pass), message: String(message) })
        );
        raw.destroy();
      }
      if (checks.some((c) => !c.pass)) ok = false;
    }
  } catch (e) {
    ok = false;
    error = errorText(e);
  } finally {
    try {
      ns?.destroy();
    } catch {
      /* 破棄済みなら無視 */
    }
  }

  post({ type: "result", id: req.id, ok, checks, error });
  post({ type: "status", state: "ready", label: "Python 準備完了" });
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  try {
    if (msg.type === "boot") {
      if (!pyodide) await boot();
    } else if (msg.type === "run") {
      if (!pyodide) await boot();
      await execute(msg);
    }
  } catch (e) {
    post({ type: "status", state: "error", label: "起動に失敗しました" });
    if (msg.type === "run") {
      post({
        type: "result",
        id: msg.id,
        ok: false,
        checks: [],
        error:
          "Python の起動に失敗しました。開発サーバーを起動し直すか、`npm install` をやり直してみてください。\n\n" +
          errorText(e),
      });
    }
  }
};
