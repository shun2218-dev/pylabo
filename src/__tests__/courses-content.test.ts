import { describe, expect, it } from "vitest";

import { availableCourses } from "../courses/registry";
import { flattenLessons } from "../lib/course-utils";
import type { Course } from "../types";

const courses: Course[] = await Promise.all(availableCourses().map((e) => e.load()));

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

  it("ヒントに解答の丸写しを置いていない（長すぎる行がない）", () => {
    for (const { lesson } of flattenLessons(course)) {
      const hint = lesson.exercise?.hint;
      if (!hint) continue;
      for (const line of hint.split("\n")) {
        expect(line.length, `${lesson.id} のヒント: ${line}`).toBeLessThan(220);
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
