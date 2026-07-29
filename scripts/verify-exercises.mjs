/**
 * すべての演習について「解答例をそのまま実行したら採点を通るか」を確かめる。
 *
 *   node scripts/verify-exercises.mjs
 *
 * コース本文を esbuild で束ねて読み込み、各演習の solution と tests を
 * 手元の python3 で実行する。アプリ側と同じヘルパー（check / _stdout / _shown）を
 * 用意したうえで走らせるので、期待値の書き間違いや、解答例だけでは動かない
 * （前提の変数が抜けている）といった不備をここで検出できる。
 *
 * pandas などの追加パッケージが要る演習は、手元に入っていなければ読み飛ばす。
 */

import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PREAMBLE = `
import io, sys

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
    _shown_images.append(True)


def _shown():
    return len(_shown_images) > 0
`;

const REPORT = `
import json, sys
sys.stdout = _real_stdout
print("@@RESULT@@" + json.dumps(_checks, ensure_ascii=False))
`;

/** コースデータを esbuild で束ねて読み込む。 */
async function loadCourses(workDir) {
  const bundle = path.join(workDir, "courses.mjs");
  await run("npx", [
    "esbuild",
    path.join(root, "src/courses/registry.ts"),
    "--bundle",
    "--format=esm",
    "--platform=node",
    "--log-level=warning",
    `--outfile=${bundle}`,
  ], { cwd: root });

  const mod = await import(`file://${bundle}`);
  const entries = mod.COURSE_ENTRIES.filter((e) => e.status === "available");
  return Promise.all(entries.map((e) => e.load()));
}

/** 手元の python3 で使えるパッケージを調べる。 */
async function availablePackages(names) {
  const found = new Set();
  for (const name of names) {
    try {
      await run("python3", ["-c", `import ${name.replace("-", "_")}`]);
      found.add(name);
    } catch {
      /* 入っていない */
    }
  }
  return found;
}

async function main() {
  const workDir = await mkdtemp(path.join(tmpdir(), "verify-exercises-"));
  let failed = 0;
  let passed = 0;
  let skipped = 0;

  try {
    const courses = await loadCourses(workDir);

    const allPackages = new Set();
    for (const course of courses) {
      for (const p of course.packages ?? []) allPackages.add(p);
      for (const ch of course.chapters) {
        for (const ls of ch.lessons) {
          for (const p of ls.packages ?? []) allPackages.add(p);
          for (const p of ls.exercise?.packages ?? []) allPackages.add(p);
        }
      }
    }
    const usable = await availablePackages([...allPackages]);

    for (const course of courses) {
      console.log(`\n=== ${course.title} ===`);

      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          const ex = lesson.exercise;
          if (!ex) continue;

          const label = `${chapter.id}/${lesson.id}  ${lesson.title}`;

          if (!ex.solution) {
            console.log(`  -  ${label} … 解答例なし（読み飛ばし）`);
            skipped += 1;
            continue;
          }

          const needed = [
            ...(course.packages ?? []),
            ...(lesson.packages ?? []),
            ...(ex.packages ?? []),
          ];
          const missing = needed.filter((p) => !usable.has(p));
          if (missing.length > 0) {
            console.log(`  -  ${label} … ${missing.join(", ")} が無いので読み飛ばし`);
            skipped += 1;
            continue;
          }

          // 練習用ファイルを置く
          const files = { ...(course.files ?? {}), ...(lesson.files ?? {}), ...(ex.files ?? {}) };
          for (const [name, content] of Object.entries(files)) {
            await writeFile(path.join(workDir, name), content, "utf8");
          }

          const script = [PREAMBLE, ex.solution, "\n", ex.tests, REPORT].join("\n");
          const file = path.join(workDir, "case.py");
          await writeFile(file, script, "utf8");

          let stdout = "";
          try {
            ({ stdout } = await run("python3", [file], { cwd: workDir, timeout: 30_000 }));
          } catch (e) {
            console.log(`  ✕  ${label}`);
            console.log(`       解答例の実行でエラー:\n${indent(e.stderr || e.message)}`);
            failed += 1;
            continue;
          }

          const marker = stdout.lastIndexOf("@@RESULT@@");
          if (marker === -1) {
            console.log(`  ✕  ${label} … 採点結果を取得できませんでした`);
            failed += 1;
            continue;
          }

          const checks = JSON.parse(stdout.slice(marker + "@@RESULT@@".length));
          const ng = checks.filter(([ok]) => !ok);

          if (checks.length === 0) {
            console.log(`  ✕  ${label} … check() が 1 つも実行されていません`);
            failed += 1;
          } else if (ng.length > 0) {
            console.log(`  ✕  ${label}`);
            ng.forEach(([, msg]) => console.log(`       通らなかった項目: ${msg}`));
            failed += 1;
          } else {
            console.log(`  ✓  ${label}  (${checks.length} 項目)`);
            passed += 1;
          }
        }
      }
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  console.log(`\n合計: 通過 ${passed} / 失敗 ${failed} / 読み飛ばし ${skipped}`);
  process.exit(failed > 0 ? 1 : 0);
}

const indent = (text) =>
  String(text)
    .split("\n")
    .map((l) => "       " + l)
    .join("\n");

await main();
