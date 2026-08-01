/**
 * コースで使う Python パッケージ（wheel）を public/pyodide/ に用意する。
 *
 * これらの wheel は npm では配布されていないため、npm install の後処理として
 * 一度だけ取得し、以後はローカルから配信する。
 * （アプリの実行時に外部 CDN へ取りに行くことはない）
 *
 * ・取得先とバージョンは node_modules/pyodide の pyodide-lock.json が決める
 * ・配布物に無いものだけ pyodide-packages.mjs の EXTRA_WHEELS で PyPI から補う
 * ・sha256 を検証してから保存する
 * ・すでに正しいファイルがあれば何もしない
 *
 * 補った wheel と、申告漏れの依存（EXTRA_DEPENDS）は public/pyodide/pyodide-lock.json
 * に書き足す。そうしないと loadPackage("mypy") が依存を引けない。sync:pyodide が
 * lock を置き直すため、dev / build でも毎回このスクリプトを通している。
 */

import { createHash } from "node:crypto";
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { EXTRA_DEPENDS, EXTRA_WHEELS, WANTED } from "./pyodide-packages.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "pyodide");
const require = createRequire(import.meta.url);


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

/**
 * 配布物に無い wheel と、申告漏れの依存を lock に書き足す。
 *
 * Pyodide 側から見れば知らないパッケージなので、loadPackage が名前で引ける
 * ように lock の形（file_name / sha256 / depends / imports）で足しておく。
 * 何度実行しても同じ結果になる。書き換えたときだけ true を返す。
 */
function patchLock() {
  const before = JSON.stringify(lock.packages);

  for (const extra of EXTRA_WHEELS) {
    lock.packages[extra.name] = {
      name: extra.name,
      version: extra.version,
      file_name: extra.file_name,
      install_dir: "site",
      sha256: extra.sha256,
      package_type: "package",
      imports: extra.imports,
      depends: extra.depends ?? [],
      unvendored_tests: false,
    };
  }

  for (const [name, depends] of Object.entries(EXTRA_DEPENDS)) {
    const entry = lock.packages[name];
    if (!entry) continue;
    const merged = new Set([...(entry.depends ?? []), ...depends]);
    entry.depends = [...merged];
  }

  return JSON.stringify(lock.packages) !== before;
}

if (patchLock()) {
  await writeFile(lockPath, JSON.stringify(lock), "utf8");
}

/** URL は、配布物なら CDN、EXTRA_WHEELS なら PyPI。 */
const urlFor = (pkg) =>
  EXTRA_WHEELS.find((e) => e.name === pkg.name)?.url ?? BASE + pkg.file_name;

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

  const url = urlFor(pkg);
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

/* 1 つでも欠けると、そのパッケージを使うコースが実行時に「パッケージが
   見つからない」で壊れる。気づかないまま本番へ出さないよう、ここで失敗させる。 */
if (failures.length > 0) {
  console.error("\n[fetch-packages] 取得できなかったパッケージがあります:");
  failures.forEach((f) => console.error(`  - ${f}`));
  console.error("\nネットワークを確認して `npm run fetch:packages` を実行し直してください。");
  process.exit(1);
}
