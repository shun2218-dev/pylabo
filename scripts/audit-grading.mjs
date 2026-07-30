/**
 * 採点がどこまで見ているかを調べる（採点の甘さの調査）。
 *
 *   node scripts/audit-grading.mjs                 # 全演習
 *   node scripts/audit-grading.mjs ch3/l7          # 一部だけ（前方一致）
 *   node scripts/audit-grading.mjs --limit=20      # 1 演習あたりの書き換え数の上限
 *
 * やっていること: 解答例を少しだけ間違えた版（scripts/mutate.py）に書き換え、
 * その状態で採点を通ってしまわないかを見る。通ってしまう書き換えは
 * 「採点がその振る舞いを見ていない」ということなので、学習者が間違えたまま
 * 合格になりうる場所として並べる。
 *
 * 全部を潰すべきものではない（表示の文言まで固定すると理不尽な採点になる）。
 * 課題文が明確に求めていることが通ってしまう場合だけ、check() を足す。
 *
 * 時間がかかるので CI には入れていない。コースを足したときや、採点の書き方を
 * 変えたときに手元で回す用。
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  availablePackages,
  eachExercise,
  execute,
  filesFor,
  graded,
  loadCourses,
  packagesFor,
  python,
  pythonVersion,
  root,
  usedPackages,
} from "./course-runner.mjs";

const run = promisify(execFile);

const limit = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : Infinity;
})();
const filters = process.argv.slice(2).filter((a) => !a.startsWith("-"));
/** 同時に走らせる python の本数。 */
const concurrency = Number(process.env.PYLABO_JOBS ?? 8);

/** 書き換えた版を作る（Python 側の ast を使う）。 */
async function mutants(source) {
  const dir = await mkdtemp(path.join(tmpdir(), "pylabo-mutate-"));
  try {
    const file = path.join(dir, "solution.py");
    await writeFile(file, source, "utf8");
    const { stdout } = await run(python, [path.join(root, "scripts/mutate.py"), file]);
    return JSON.parse(stdout);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** thunk を並べて、同時 concurrency 本まで走らせる。 */
async function pooled(thunks) {
  const results = new Array(thunks.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, thunks.length) }, async () => {
    while (next < thunks.length) {
      const i = next++;
      results[i] = await thunks[i]();
    }
  });
  await Promise.all(workers);
  return results;
}

/** 1 演習あたりの書き換え数を上限まで間引く（種類が偏らないように順番に取る）。 */
function thin(all, max) {
  if (all.length <= max) return all;
  const byKind = new Map();
  for (const m of all) {
    if (!byKind.has(m.kind)) byKind.set(m.kind, []);
    byKind.get(m.kind).push(m);
  }
  const picked = [];
  const queues = [...byKind.values()];
  while (picked.length < max && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (q.length === 0) continue;
      picked.push(q.shift());
      if (picked.length === max) break;
    }
  }
  return picked;
}

async function main() {
  console.log(`検証に使う Python: ${await pythonVersion()}（${python}）`);
  if (Number.isFinite(limit)) console.log(`1 演習あたり最大 ${limit} 件まで試します`);

  const { courses, helper } = await loadCourses();
  const usable = await availablePackages(usedPackages(courses));

  let tried = 0;
  let caught = 0;
  const survivors = [];
  const notes = [];

  for (const { course, lesson, exercise, key, label } of eachExercise(courses)) {
    if (filters.length > 0 && !filters.some((f) => key.includes(f))) continue;
    if (!exercise.solution) continue;

    const missing = packagesFor(course, lesson, exercise).filter((p) => !usable.has(p));
    if (missing.length > 0) {
      notes.push(`${label} … ${missing.join(", ")} が無いので読み飛ばし`);
      continue;
    }

    const args = { tests: exercise.tests, helper, files: filesFor(course, lesson, exercise) };
    const all = await mutants(exercise.solution);
    const picked = thin(all, limit);
    if (picked.length < all.length) {
      notes.push(`${label} … 書き換え ${all.length} 件のうち ${picked.length} 件だけ試しました`);
    }

    const results = await pooled(
      picked.map((m) => () => execute({ ...args, source: m.code }).then((r) => graded(r)))
    );

    const passedThrough = picked.filter((_, i) => results[i]);
    tried += picked.length;
    caught += picked.length - passedThrough.length;

    const rate = picked.length === 0 ? 1 : (picked.length - passedThrough.length) / picked.length;
    const mark = passedThrough.length === 0 ? "✓" : "!";
    console.log(
      `  ${mark}  ${label} … ${picked.length - passedThrough.length}/${picked.length} 件を落とせました` +
        ` (${Math.round(rate * 100)}%)`
    );

    for (const m of passedThrough) {
      survivors.push({ label, kind: m.kind, detail: m.detail });
      console.log(`       通ってしまう: [${m.kind}] ${m.detail}`);
    }
  }

  console.log(
    `\n合計: ${tried} 件の書き換えのうち ${caught} 件を落とせました` +
      `（通ってしまうもの ${survivors.length} 件 / ${tried === 0 ? 0 : Math.round((caught / tried) * 100)}%）`
  );

  if (notes.length > 0) {
    console.log("\n読み飛ばし・間引き:");
    notes.forEach((n) => console.log(`  - ${n}`));
  }

  if (survivors.length > 0) {
    const byKind = new Map();
    for (const s of survivors) byKind.set(s.kind, (byKind.get(s.kind) ?? 0) + 1);
    console.log("\n通ってしまった書き換えの種類:");
    for (const [kind, count] of byKind) console.log(`  ${kind}: ${count} 件`);
  }
}

await main();
