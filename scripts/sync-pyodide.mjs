/**
 * node_modules/pyodide のランタイム一式を public/pyodide/ へコピーする。
 *
 * Pyodide 本体は CDN からではなく npm で管理し、配信は自前の静的ファイルで行う。
 * バージョンを上げるときは package.json の pyodide を更新して npm install するだけでよい。
 */

import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "public", "pyodide");
const require = createRequire(import.meta.url);

/** node_modules/pyodide の場所を解決する。 */
function resolvePyodideDir() {
  try {
    return path.dirname(require.resolve("pyodide/package.json"));
  } catch {
    return null;
  }
}

const src = resolvePyodideDir();

if (!src) {
  console.warn("[sync-pyodide] pyodide が見つかりません。`npm install` を先に実行してください。");
  process.exit(0);
}

/* 配信しないファイル。
   ・console.html / console-v2.html … Pyodide 付属の REPL。外部 CDN から
     jQuery や xterm を読み込むため、自分のドメインに置きたくない
   ・*.d.ts / *.map … 型定義とソースマップ。配信する必要がない */
const isExcluded = (name) =>
  name.endsWith(".html") || name.endsWith(".d.ts") || name.endsWith(".map");

/* コピー対象の決め方を変えたら、この番号を上げること。
   同じ Pyodide バージョンのままでも public/pyodide を作り直す。 */
const LAYOUT_REVISION = 2;

const pkg = JSON.parse(await readFile(path.join(src, "package.json"), "utf8"));
const stamp = `${pkg.version}+layout${LAYOUT_REVISION}`;
const stampPath = path.join(dest, ".version");
const currentStamp = existsSync(stampPath) ? (await readFile(stampPath, "utf8")).trim() : "";

if (currentStamp === stamp) {
  console.log(`[sync-pyodide] public/pyodide は最新です (v${pkg.version})`);
  process.exit(0);
}

// 入れ替え前に掃除する。ただし fetch:packages で取得したホイールは残す。
if (existsSync(dest)) {
  for (const name of await readdir(dest)) {
    if (name.endsWith(".whl")) continue;
    await rm(path.join(dest, name), { recursive: true, force: true });
  }
} else {
  await mkdir(dest, { recursive: true });
}

let copied = 0;
for (const name of await readdir(src)) {
  const from = path.join(src, name);
  if ((await stat(from)).isDirectory()) continue;
  if (name === "package.json" || name === "README.md" || name === "LICENSE") continue;
  if (isExcluded(name)) continue;
  await cp(from, path.join(dest, name));
  copied += 1;
}

await writeFile(stampPath, stamp, "utf8");
console.log(`[sync-pyodide] pyodide v${pkg.version} を public/pyodide へコピーしました（${copied} ファイル）`);
