/**
 * コース本文を読み込み、アプリと同じ形で Python を動かす土台。
 *
 * scripts/verify-exercises.mjs（回帰の確認）と scripts/audit-grading.mjs
 * （採点の甘さの調査）が共通で使う。アプリ側の前処理（check / _stdout /
 * _shown / run_pytest）と同じ名前空間を作るのはここ 1 か所だけにしている。
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 検証に使う Python。
 *
 * 採点の期待値も解説に載せた出力も「実際の計算結果」なので、学習者のブラウザ内
 * （Pyodide）と違う版で確かめると、通ったことが何の保証にもならない。手元の
 * python3 はたいてい別の版なので、Pyodide と同じ版を入れた仮想環境
 * （npm run verify:setup で作れる）があればそちらを優先する。
 *
 * PYLABO_PYTHON で明示的に指定することもできる（CI はこれを使わず、
 * ジョブ側で Pyodide と同じ版の python を用意している）。
 */
export const python = (() => {
  if (process.env.PYLABO_PYTHON) return process.env.PYLABO_PYTHON;
  const venv = path.join(root, ".venv-pyodide", "bin", "python");
  return existsSync(venv) ? venv : "python3";
})();

/** アプリ側（src/lib/pyodide.worker.ts）の前処理に対応する部分。 */
const PREAMBLE = `
import io, os, sys

# 作業ディレクトリを import 先に加える。Pyodide では実行時のディレクトリが
# そのまま import 対象になるので、run_pytest(modules=...) が書き出した
# モジュールも見つかる。この仕組みではスクリプトを別の場所に置いているため、
# 明示的に足しておく必要がある。
sys.path.insert(0, os.getcwd())

_real_stdout = sys.stdout


class _Tee(io.TextIOBase):
    def __init__(self, real):
        self._real = real
        self.buf = io.StringIO()

    def write(self, s):
        self.buf.write(s)
        return self._real.write(s)


_tee = _Tee(_real_stdout)
sys.stdout = _tee


def _stdout():
    return _tee.buf.getvalue()


_checks = []


def check(cond, message):
    _checks.append((bool(cond), str(message)))


_shown_images = []


def show():
    """アプリ側と同じく、図を出したことを記録する（画像そのものは捨てる）。"""
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        pass
    else:
        plt.savefig(io.BytesIO(), format="png", dpi=110, bbox_inches="tight")
        plt.close("all")

    _shown_images.append(True)
    print("[図を表示]")


def _shown():
    return len(_shown_images) > 0
`;

/**
 * Python を動かすときの環境変数。
 *
 * 学習者のブラウザ内（Pyodide）と同じ出力になるようにそろえる。
 * pytest は環境で表示を変えるため、放っておくと「手元では合うのに CI では
 * 違う」記録になってしまう。
 *
 * - COLUMNS … 端末の幅で「===」の長さや失敗一覧の省略位置が変わる
 * - CI / BUILD_NUMBER … pytest はこれがあると失敗一覧を省略しない
 *   （学習者のブラウザには無いので、こちらも外して同じ表示にする）
 */
function childEnv() {
  const { CI, BUILD_NUMBER, ...rest } = process.env;
  return { ...rest, COLUMNS: "80" };
}

const REPORT = `
import json, sys
sys.stdout = _real_stdout
print("@@RESULT@@" + json.dumps(_checks, ensure_ascii=False))
`;

/** TypeScript のモジュールを esbuild で束ねて読み込む。 */
async function loadModule(workDir, entry, outName) {
  const bundle = path.join(workDir, outName);
  await run(
    "npx",
    [
      "esbuild",
      path.join(root, entry),
      "--bundle",
      "--format=esm",
      "--platform=node",
      "--log-level=warning",
      `--outfile=${bundle}`,
    ],
    { cwd: root }
  );

  return import(`file://${bundle}`);
}

/**
 * コースデータと、アプリ側と同じ run_pytest() を読み込む。
 * 束ねた結果を置くだけの一時ディレクトリは、この関数の中で始末する。
 */
export async function loadCourses() {
  const dir = await mkdtemp(path.join(tmpdir(), "pylabo-courses-"));
  try {
    const registry = await loadModule(dir, "src/courses/registry.ts", "courses.mjs");
    const { PYTHON_HELPERS } = await loadModule(
      dir,
      "src/lib/python-helpers.ts",
      "helpers.mjs"
    );
    const courses = await Promise.all(
      registry.COURSE_ENTRIES.filter((e) => e.status === "available").map((e) => e.load())
    );
    return { courses, helper: PYTHON_HELPERS };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** 検証に使う Python で import できるパッケージを調べる。 */
export async function availablePackages(names) {
  const found = new Set();
  for (const name of names) {
    try {
      await run(python, ["-c", `import ${name.replace("-", "_")}`]);
      found.add(name);
    } catch {
      /* 入っていない */
    }
  }
  return found;
}

/** コースの中で使われているパッケージを全部集める。 */
export function usedPackages(courses) {
  const all = new Set();
  for (const course of courses) {
    for (const p of course.packages ?? []) all.add(p);
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        for (const p of lesson.packages ?? []) all.add(p);
        for (const p of lesson.exercise?.packages ?? []) all.add(p);
        for (const example of lesson.examples ?? []) {
          for (const p of example.packages ?? []) all.add(p);
        }
      }
    }
  }
  return [...all];
}

/**
 * コードを 1 回実行する。アプリと同じ順（前処理 → 学習者のコード → 採点）で
 * 1 本のスクリプトにして流す。実行するたびに空のディレクトリを作るので、
 * ほかのレッスンが書いたファイルは見えない（`Path(".").iterdir()` のような
 * コード例の出力が、実行順で変わらないようにするため）。
 *
 * @returns {Promise<{error: string | null, checks: [boolean, string][], output: string}>}
 *   error が入っているときはコード自体が止まったということ。アプリでも
 *   その場合は採点まで進まない。output は print された内容。
 */
export async function execute({ source, tests = "", helper, files = {} }) {
  const dir = await mkdtemp(path.join(tmpdir(), "pylabo-case-"));
  /* 実行するスクリプトは作業ディレクトリの外に置く。中に置くと
     `Path(".").iterdir()` を使うコード例の出力に、この仕組みのファイルが
     混ざってしまう（学習者の画面には出ないもの）。 */
  const workDir = path.join(dir, "work");
  const scriptDir = path.join(dir, "script");
  try {
    await mkdir(workDir);
    await mkdir(scriptDir);
    for (const [name, content] of Object.entries(files)) {
      await writeFile(path.join(workDir, name), content, "utf8");
    }

    /* run_pytest() が「いま書かれているコード」を書き出せるように渡しておく
       （アプリでは ns.set で渡している）。JSON の文字列表現は Python の
       文字列リテラルとしてもそのまま通る。 */
    const script = [
      PREAMBLE,
      `_pylabo_source = ${JSON.stringify(source)}`,
      helper,
      source,
      "\n",
      tests,
      REPORT,
    ].join("\n");
    const file = path.join(scriptDir, "case.py");
    await writeFile(file, script, "utf8");

    let stdout = "";
    try {
      ({ stdout } = await run(python, [file], {
        cwd: workDir,
        timeout: 60_000,
        env: childEnv(),
      }));
    } catch (e) {
      return { error: e.stderr || e.message, checks: [], output: e.stdout ?? "" };
    }

    const marker = stdout.lastIndexOf("@@RESULT@@");
    if (marker === -1) {
      return { error: "採点結果を取得できませんでした", checks: [], output: stdout };
    }

    return {
      error: null,
      checks: JSON.parse(stdout.slice(marker + "@@RESULT@@".length)),
      output: stdout.slice(0, marker),
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** 採点が「通った」と言える状態か（アプリの合否判定と同じ）。 */
export const graded = (result) =>
  result.error === null && result.checks.length > 0 && result.checks.every(([ok]) => ok);

/** 演習に必要なファイル（コース → レッスン → 演習の順に上書き）。 */
export const filesFor = (course, lesson, own) => ({
  ...(course.files ?? {}),
  ...(lesson.files ?? {}),
  ...(own?.files ?? {}),
});

/** 演習・コード例に必要なパッケージ。 */
export const packagesFor = (course, lesson, own) => [
  ...(course.packages ?? []),
  ...(lesson.packages ?? []),
  ...(own?.packages ?? []),
];

/** 検証に使う Python の版を返す（結果の意味を示すために出力する）。 */
export async function pythonVersion() {
  const { stdout } = await run(python, ["-c", "import sys;print(sys.version.split()[0])"]);
  return stdout.trim();
}

/** 演習を持つレッスンを平らに並べる。 */
export function* eachExercise(courses) {
  for (const course of courses) {
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (!lesson.exercise) continue;
        yield {
          course,
          chapter,
          lesson,
          exercise: lesson.exercise,
          key: `${course.id}/${chapter.id}/${lesson.id}`,
          label: `${chapter.id}/${lesson.id}  ${lesson.title}`,
        };
      }
    }
  }
}
