/**
 * データ分析コースで使う Python パッケージ（wheel）を public/pyodide/ に用意する。
 *
 * これらの wheel は npm では配布されていないため、npm install の後処理として
 * Pyodide 公式配布物から一度だけ取得し、以後はローカルから配信する。
 * （アプリの実行時に外部 CDN へ取りに行くことはない）
 *
 * ・取得先とバージョンは node_modules/pyodide の pyodide-lock.json が決める
 * ・sha256 を検証してから保存する
 * ・すでに正しいファイルがあれば何もしない
 */

import { createHash } from "node:crypto";
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "pyodide");
const require = createRequire(import.meta.url);

/** ここに書いたパッケージと、その依存関係すべてを取得する。 */
const WANTED = ["numpy", "pandas", "matplotlib"];

const version = JSON.parse(
  await readFile(require.resolve("pyodide/package.json"), "utf8")
).version;

const BASE = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

const lockPath = path.join(dir, "pyodide-lock.json");
let lock;
try {
  lock = JSON.parse(await readFile(lockPath, "utf8"));
} catch {
  console.warn("[fetch-packages] pyodide-lock.json がありません。先に npm run sync:pyodide を実行してください。");
  process.exit(0);
}

/** 依存関係をたどって、必要な wheel の一覧を作る。 */
function resolveAll(names) {
  const seen = new Set();
  const queue = [...names];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    const entry = lock.packages[name];
    if (!entry) {
      console.warn(`[fetch-packages] ${name} は pyodide-lock.json に見つかりません（読み飛ばします）`);
      continue;
    }
    seen.add(name);
    queue.push(...(entry.depends ?? []));
  }
  return [...seen].map((n) => lock.packages[n]);
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const targets = resolveAll(WANTED);
let downloaded = 0;
let skipped = 0;
const failures = [];

for (const pkg of targets) {
  const out = path.join(dir, pkg.file_name);

  if (await exists(out)) {
    const buf = await readFile(out);
    if (sha256(buf) === pkg.sha256) {
      skipped += 1;
      continue;
    }
  }

  const url = BASE + pkg.file_name;
  process.stdout.write(`[fetch-packages] ${pkg.name} ${pkg.version} を取得中… `);

  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    console.log("失敗（通信エラー）");
    failures.push(`${pkg.name}: ${e.message}`);
    continue;
  }

  if (!res.ok) {
    console.log(`失敗 (HTTP ${res.status})`);
    failures.push(`${pkg.name}: ${url} が HTTP ${res.status}`);
    continue;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (sha256(buf) !== pkg.sha256) {
    console.log("失敗（ハッシュ不一致）");
    failures.push(`${pkg.name}: sha256 が一致しないため保存しませんでした`);
    continue;
  }

  await writeFile(out, buf);
  downloaded += 1;
  console.log(`完了 (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}

console.log(
  `[fetch-packages] 準備完了：新規 ${downloaded} 件 / 既存 ${skipped} 件（合計 ${targets.length} 件）`
);

/* 1 つでも欠けると、データ分析コースが実行時に「パッケージが見つからない」で
   壊れる。気づかないまま本番へ出さないよう、ここで失敗させる。 */
if (failures.length > 0) {
  console.error("\n[fetch-packages] 取得できなかったパッケージがあります:");
  failures.forEach((f) => console.error(`  - ${f}`));
  console.error("\nネットワークを確認して `npm run fetch:packages` を実行し直してください。");
  process.exit(1);
}
