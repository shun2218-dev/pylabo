/**
 * 学習コンテンツが「書いてあるとおりに動くか」を確かめる。
 *
 *   node scripts/verify-exercises.mjs
 *   node scripts/verify-exercises.mjs --update-snapshot   # 出力の記録を取り直す
 *
 * 見ているのは 3 つ。
 *
 *   1. 演習の解答例（solution）… 全項目が通ること
 *      期待値の書き間違いや、解答例だけでは動かない（前提の変数が抜けている）
 *      不備を検出する。
 *   2. 演習の初期コード（starter）… 通ってはいけないこと
 *      手つかずのまま「採点する」を押して全項目クリアになる演習は、採点が
 *      課題文の要求を見ていない（＝学習者に誤った合格を返す）。1 だけでは
 *      この抜けが見つからないので、逆向きにも試す。
 *      どこまで細かく見ているかは scripts/audit-grading.mjs で調べられる。
 *   3. 解説中のコード例… エラーで止まらないこと＋出力が前回と同じこと
 *      学習者が最初に触るのは解説中のコード例なので、ここが動かないと
 *      解説そのものが誤りになる。出力は src/courses/__snapshots__ に記録し、
 *      本文の説明と食い違う変化（パッケージ更新で表示が変わった等）を
 *      レビューで気づけるようにする。raises: true の例は逆に「止まること」を見る。
 *
 * 1 件ごとに空のディレクトリを作って実行するので、ほかのレッスンが書いた
 * ファイルが混ざることはない（scripts/course-runner.mjs）。
 *
 * pandas などの追加パッケージが要る演習は、手元に入っていなければ読み飛ばす。
 * CI のように「全件動くはず」の場所では --max-skipped=N を付けること。
 * 読み飛ばしが N を超えたら失敗する（環境が壊れていても緑になるのを防ぐ）。
 *
 * そのほかの引数:
 *   --only-solution   … 2 を省く（原因を切り分けるとき用）
 *   --only-exercises  … 3 を省く
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  availablePackages,
  eachExercise,
  execute,
  filesFor,
  loadCourses,
  packagesFor,
  python,
  pythonVersion,
  root,
  usedPackages,
} from "./course-runner.mjs";

/** --max-skipped=N。指定が無ければ上限なし。 */
const maxSkipped = (() => {
  const arg = process.argv.find((a) => a.startsWith("--max-skipped="));
  return arg ? Number(arg.split("=")[1]) : Infinity;
})();
/** --only-solution … 初期コードを落とせるかの確認を省く。 */
const onlySolution = process.argv.includes("--only-solution");
/** --only-exercises … 解説中のコード例の確認を省く。 */
const onlyExercises = process.argv.includes("--only-exercises");
/** --update-snapshot … コード例の出力を記録し直す。 */
const updateSnapshot = process.argv.includes("--update-snapshot");

const snapshotPath = path.join(root, "src/courses/__snapshots__/example-output.json");

/**
 * 実行するたびに変わるが、学習者に見せている中身としては同じ部分を伏せる。
 * pytest の「1 passed in 0.02s」や一時ディレクトリの名前、OS 名がそのまま入ると、
 * 出力を記録しても毎回・環境ごとに違う値で赤くなってしまう。
 */
const mask = (line) =>
  line
    // pytest の所要時間（in 0.02s / 0.01s call ...）
    .replace(/\d+\.\d+s\b/g, "0.00s")
    // 一時ディレクトリ（rootdir や tmp_path。OS で場所が違う）
    .replace(/(?:\/private)?\/(?:var|tmp)\/[\w./\-+]+/g, "/tmp/…")
    // pytest の環境表示（手元は darwin、CI は linux）
    .replace(/^platform \w+ --/, "platform … --")
    // オブジェクトの id（Mock の repr など）
    .replace(/0x[0-9a-f]{6,}/g, "0x…")
    .replace(/id='\d+'/g, "id='…'");

/** 記録用に出力を行の配列へ。末尾の空行は落とす。 */
const toLines = (output) => {
  const lines = output.replace(/\n+$/, "").split("\n").map(mask);
  return lines.length === 1 && lines[0] === "" ? [] : lines;
};

const same = (a, b) => a.length === b.length && a.every((line, i) => line === b[i]);

const indent = (text) =>
  String(text)
    .split("\n")
    .map((l) => "       " + l)
    .join("\n");

async function loadSnapshot() {
  try {
    return JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  /** 初期コードのまま採点を通ってしまった演習 */
  const lenient = [];
  let examplePassed = 0;
  let exampleFailed = 0;
  let exampleSkipped = 0;

  const recorded = updateSnapshot ? {} : await loadSnapshot();
  /** 記録と突き合わせたキー（残ったものは古い記録なので消す） */
  const seen = new Set();

  /* どの Python で確かめたのかは、結果の意味そのものなので必ず出す。
     Pyodide と違う版だった場合、緑でも学習者の環境の保証にはならない。 */
  console.log(`検証に使う Python: ${await pythonVersion()}（${python}）`);

  const { courses, helper } = await loadCourses();
  const usable = await availablePackages(usedPackages(courses));

  /* ---------- 演習の採点 ---------- */

  console.log("\n########## 演習の採点 ##########");

  let currentCourse = null;
  for (const { course, lesson, exercise, label } of eachExercise(courses)) {
    if (course !== currentCourse) {
      console.log(`\n=== ${course.title} ===`);
      currentCourse = course;
    }

    if (!exercise.solution) {
      console.log(`  -  ${label} … 解答例なし（読み飛ばし）`);
      skipped += 1;
      continue;
    }

    const missing = packagesFor(course, lesson, exercise).filter((p) => !usable.has(p));
    if (missing.length > 0) {
      console.log(`  -  ${label} … ${missing.join(", ")} が無いので読み飛ばし`);
      skipped += 1;
      continue;
    }

    const args = {
      tests: exercise.tests,
      helper,
      files: filesFor(course, lesson, exercise),
    };
    const solution = await execute({ ...args, source: exercise.solution });

    if (solution.error) {
      console.log(`  ✕  ${label}`);
      console.log(`       解答例の実行でエラー:\n${indent(solution.error)}`);
      failed += 1;
      continue;
    }
    if (solution.checks.length === 0) {
      console.log(`  ✕  ${label} … check() が 1 つも実行されていません`);
      failed += 1;
      continue;
    }

    const ng = solution.checks.filter(([ok]) => !ok);
    if (ng.length > 0) {
      console.log(`  ✕  ${label}`);
      ng.forEach(([, msg]) => console.log(`       通らなかった項目: ${msg}`));
      failed += 1;
      continue;
    }

    /* 逆向き: 落としたい回答が落ちること。
       エラーで止まるなら、アプリでも採点まで進まないので落ちた扱い。 */
    if (!onlySolution) {
      const shouldFail = [
        { caption: "初期コードのまま", code: exercise.starter },
        ...(exercise.rejects ?? []),
      ];
      const slipped = [];

      for (const { caption, code } of shouldFail) {
        const attempt = await execute({ ...args, source: code });
        const rejected =
          attempt.error !== null ||
          attempt.checks.length === 0 ||
          attempt.checks.some(([ok]) => !ok);
        if (!rejected) slipped.push(caption);
      }

      if (slipped.length > 0) {
        console.log(`  ✕  ${label}  (${solution.checks.length} 項目)`);
        slipped.forEach((caption) =>
          console.log(`       「${caption}」で全項目クリアになります（採点が甘い）`)
        );
        lenient.push(`${label} … ${slipped.join(" / ")}`);
        failed += 1;
        continue;
      }
    }

    console.log(`  ✓  ${label}  (${solution.checks.length} 項目)`);
    passed += 1;
  }

  /* ---------- 解説中のコード例 ---------- */

  if (!onlyExercises) {
    console.log("\n########## 解説中のコード例 ##########");

    for (const course of courses) {
      console.log(`\n=== ${course.title} ===`);

      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          const runnable = (lesson.examples ?? []).filter((e) => e.runnable !== false);
          if (runnable.length === 0) continue;

          const label = `${chapter.id}/${lesson.id}  ${lesson.title}`;
          let ok = 0;
          const problems = [];

          for (const [i, example] of runnable.entries()) {
            const name = example.caption ? `「${example.caption}」` : `${i + 1} 番目`;
            const key = `${course.id}/${chapter.id}/${lesson.id}#${i}`;
            seen.add(key);

            const missing = packagesFor(course, lesson, example).filter((p) => !usable.has(p));
            if (missing.length > 0) {
              exampleSkipped += 1;
              continue;
            }

            // 採点は無い。ここで見たいのは「止まらないか」と「何が出るか」。
            const args = {
              source: example.code,
              helper,
              files: filesFor(course, lesson, example),
            };
            const result = await execute(args);

            if (example.raises) {
              // わざとエラーを見せる例。止まらなかったら説明と食い違っている。
              if (result.error) ok += 1;
              else problems.push([name, "エラーになる例のはずが、通ってしまいます"]);
            } else if (result.error) {
              problems.push([name, result.error]);
              continue;
            } else {
              ok += 1;
            }

            /* 出力の記録。取り直すときは 2 回動かし、実行ごとに変わる例
               （時刻を使うなど）は記録しない。記録してしまうと、あとから
               中身の違いではなく実行時刻で赤くなる。 */
            const lines = toLines(result.output);

            if (updateSnapshot) {
              const again = await execute(args);
              recorded[key] = same(lines, toLines(again.output))
                ? { caption: example.caption ?? null, output: lines }
                : { caption: example.caption ?? null, unstable: true };
              continue;
            }

            const before = recorded[key];
            if (!before) {
              problems.push([
                name,
                "出力が記録されていません（npm run verify:exercises -- --update-snapshot で記録してください）",
              ]);
            } else if (!before.unstable && !same(lines, before.output)) {
              problems.push([
                name,
                "出力が記録と違います。解説の説明と合っているか確かめてください。\n" +
                  `--- 記録\n${before.output.join("\n")}\n+++ いま\n${lines.join("\n")}`,
              ]);
            }
          }

          examplePassed += ok;
          if (problems.length === 0) {
            console.log(`  ✓  ${label}  (${ok} 例)`);
          } else {
            console.log(`  ✕  ${label}  (${ok} / ${runnable.length} 例)`);
            for (const [name, detail] of problems) {
              console.log(`       ${name}:\n${indent(detail)}`);
            }
            exampleFailed += problems.length;
          }
        }
      }
    }
  }

  /* ---------- 出力の記録を書く / 古い記録を指摘する ---------- */

  if (updateSnapshot) {
    await mkdir(path.dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, JSON.stringify(recorded, null, 2) + "\n", "utf8");
    const unstable = Object.values(recorded).filter((v) => v.unstable);
    console.log(
      `\nコード例の出力を ${Object.keys(recorded).length} 件記録しました` +
        `（実行ごとに変わるため記録しないもの ${unstable.length} 件）: ` +
        path.relative(root, snapshotPath)
    );
  } else if (!onlyExercises && exampleSkipped === 0) {
    // 読み飛ばしがあると「消えた」のか「動かせなかった」のか区別できないので、
    // 全件動かせたときだけ古い記録を指摘する。
    const stale = Object.keys(recorded).filter((key) => !seen.has(key));
    if (stale.length > 0) {
      exampleFailed += stale.length;
      console.log(
        `\n記録にしか無いコード例が ${stale.length} 件あります` +
          "（--update-snapshot で記録を取り直してください）:"
      );
      stale.forEach((key) => console.log(`  - ${key}`));
    }
  }

  console.log(`\n演習: 通過 ${passed} / 失敗 ${failed} / 読み飛ばし ${skipped}`);
  if (!onlyExercises) {
    console.log(
      `コード例: 通過 ${examplePassed} / 失敗 ${exampleFailed} / 読み飛ばし ${exampleSkipped}`
    );
  }

  if (lenient.length > 0) {
    console.error(
      `\n初期コードのままで採点を通る演習が ${lenient.length} 件あります:\n` +
        lenient.map((l) => `  - ${l}`).join("\n") +
        "\n課題文が求めていることを check() で見ているか確認してください。"
    );
  }

  if (skipped > maxSkipped) {
    console.error(
      `\n読み飛ばしが ${skipped} 件あり、上限の ${maxSkipped} 件を超えています。` +
        "\n必要な Python パッケージが入っているか確認してください。"
    );
    process.exit(1);
  }

  process.exit(failed + exampleFailed > 0 ? 1 : 0);
}

await main();
