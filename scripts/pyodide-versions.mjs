/**
 * Pyodide が使っている Python と主要パッケージのバージョンを出力する。
 *
 *   node scripts/pyodide-versions.mjs          # 人が読む形式
 *   node scripts/pyodide-versions.mjs --github # key=value（GITHUB_OUTPUT 用）
 *
 * 演習の採点は「実際の計算結果」を期待値にしているため、検証に使う Python が
 * 学習者のブラウザ内の Python とずれていると、CI が緑でも本番で落ちうる。
 * CI はここで出た値に合わせて環境を用意する。
 */

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { WANTED } from "./pyodide-packages.mjs";

const require = createRequire(import.meta.url);
const pyodideDir = path.dirname(require.resolve("pyodide/package.json"));
const lock = JSON.parse(
  await readFile(path.join(pyodideDir, "pyodide-lock.json"), "utf8")
);

// "3.14.0" → "3.14"（setup-python にはマイナーまで渡す）
const python = lock.info.python.split(".").slice(0, 2).join(".");

const versions = Object.fromEntries(
  WANTED.filter((name) => lock.packages[name]).map((name) => [
    name,
    lock.packages[name].version,
  ])
);

if (process.argv.includes("--github")) {
  console.log(`python=${python}`);
  console.log(
    `pip-args=${Object.entries(versions)
      .map(([n, v]) => `${n}==${v}`)
      .join(" ")}`
  );
} else {
  console.log(`Python ${python}`);
  for (const [name, version] of Object.entries(versions)) {
    console.log(`  ${name} ${version}`);
  }
}
