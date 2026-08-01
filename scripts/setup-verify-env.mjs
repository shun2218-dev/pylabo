/**
 * 演習の検証用に、Pyodide と同じ版の Python 環境を .venv-pyodide/ に用意する。
 *
 *   node scripts/setup-verify-env.mjs
 *
 * 採点の期待値は「実際の計算結果」なので、手元の python3（多くの場合 Pyodide とは
 * 別の版）で確かめても、通ったことが学習者の環境の保証にならない。CI は毎回この
 * 版を入れ直しているので、手元でも同じ組み合わせを作れるようにしておく。
 *
 * 用意できたら scripts/verify-exercises.mjs が自動でこの環境を使う。
 * uv（https://docs.astral.sh/uv/）が必要。
 */

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const venv = path.join(root, ".venv-pyodide");

/** pyodide-versions.mjs の key=value 出力を読む。 */
async function wanted() {
  const { stdout } = await run("node", ["scripts/pyodide-versions.mjs", "--github"], {
    cwd: root,
  });
  const values = Object.fromEntries(
    stdout
      .trim()
      .split("\n")
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1)];
      })
  );
  return { python: values.python, packages: values["pip-args"].split(" ") };
}

async function main() {
  try {
    await run("uv", ["--version"]);
  } catch {
    console.error(
      "uv が見つかりません。https://docs.astral.sh/uv/ の手順で入れてください。\n" +
        "（uv を使わない場合は、Pyodide と同じ版を入れた python を PYLABO_PYTHON で指定できます）"
    );
    process.exit(1);
  }

  const { python, packages } = await wanted();

  console.log(`Python ${python} の仮想環境を作ります: ${path.relative(root, venv)}/`);
  await run("uv", ["venv", "--python", python, venv], { cwd: root });

  console.log(`パッケージを入れます: ${packages.join(" ")}`);
  await run(
    "uv",
    ["pip", "install", "--python", path.join(venv, "bin", "python"), ...packages],
    { cwd: root }
  );

  console.log("\n完了しました。`npm run verify:exercises` がこの環境を使います。");
}

await main();
