import { describe, expect, it } from "vitest";

import { availableCourses } from "../courses/registry";
import { flattenLessons } from "../lib/course-utils";
import type { Course } from "../types";

const courses: Course[] = await Promise.all(availableCourses().map((e) => e.load()));

/** 段階ヒントも 1 本の文字列も、同じ検査にかけられるようにまとめる。 */
const hintText = (hint: string | string[]): string =>
  Array.isArray(hint) ? hint.join("\n") : hint;

describe.each(courses.map((c) => [c.title, c] as const))("%s", (_title, course) => {
  it("章とレッスンの id が重複していない", () => {
    const chapterIds = course.chapters.map((c) => c.id);
    expect(new Set(chapterIds).size).toBe(chapterIds.length);

    for (const chapter of course.chapters) {
      const ids = chapter.lessons.map((l) => l.id);
      expect(new Set(ids).size, `${chapter.id}`).toBe(ids.length);
    }
  });

  it("すべてのレッスンに本文がある", () => {
    for (const { lesson } of flattenLessons(course)) {
      expect(lesson.title, lesson.id).toBeTruthy();
      expect(lesson.body.trim().length, `${lesson.id} の本文`).toBeGreaterThan(0);
    }
  });

  it("演習には採点コードと初期コードがある", () => {
    for (const { lesson } of flattenLessons(course)) {
      const ex = lesson.exercise;
      if (!ex) continue;
      expect(ex.prompt.trim(), lesson.id).toBeTruthy();
      expect(ex.starter.trim(), lesson.id).toBeTruthy();
      expect(ex.tests, lesson.id).toContain("check(");
    }
  });

  it("ヒントに解答例の行がそのまま載っていない", () => {
    for (const { lesson } of flattenLessons(course)) {
      const { hint, solution } = lesson.exercise ?? {};
      if (!hint || !solution) continue;

      /* 解答例のうち「非自明な行」だけを見る。
         import や print、閉じかっこのような、書き写しても答えにならない
         行まで弾くと、まっとうなヒントが書けなくなるため。 */
      const meaningful = solution
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length >= 25 &&
            !line.startsWith("#") &&
            !line.startsWith("import ") &&
            !line.startsWith("from ") &&
            !line.startsWith("print(") &&
            !line.startsWith("def ") &&
            !line.startsWith("class ")
        );

      const flatHint = hintText(hint).replace(/\s+/g, " ");
      for (const line of meaningful) {
        expect(
          flatHint.includes(line.replace(/\s+/g, " ")),
          `${lesson.id} のヒントが解答例の行をそのまま含んでいる: ${line}`
        ).toBe(false);
      }
    }
  });

  it("段階ヒントは 2 段以上あり、どの段も空でない", () => {
    for (const { lesson } of flattenLessons(course)) {
      const hint = lesson.exercise?.hint;
      if (!Array.isArray(hint)) continue;

      /* 1 段だけの配列は、ただの文字列で書けばよい（UI も段数表示を出さない）。 */
      expect(hint.length, `${lesson.id} の段階ヒント`).toBeGreaterThan(1);
      for (const [i, step] of hint.entries()) {
        expect(step.trim().length, `${lesson.id} のヒント ${i + 1}`).toBeGreaterThan(0);
      }
    }
  });

  it("実行できる例には空でないコードがある", () => {
    for (const { lesson } of flattenLessons(course)) {
      for (const example of lesson.examples ?? []) {
        expect(example.code.trim(), lesson.id).toBeTruthy();
      }
    }
  });

  it("練習用ファイルを使うレッスンは、その中身が用意されている", () => {
    for (const [name, content] of Object.entries(course.files ?? {})) {
      expect(content.trim().length, name).toBeGreaterThan(0);
    }
  });
});
