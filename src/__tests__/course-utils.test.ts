import { describe, expect, it } from "vitest";

import {
  countLessons,
  flattenLessons,
  lessonKey,
  mergeFiles,
  mergePackages,
} from "../lib/course-utils";
import type { Course } from "../types";

const course: Course = {
  id: "demo",
  title: "デモ",
  description: "テスト用",
  icon: "code",
  level: "入門",
  accent: "#000",
  chapters: [
    {
      id: "ch1",
      title: "第1章",
      lessons: [
        { id: "l1", title: "A", body: "" },
        { id: "l2", title: "B", body: "" },
      ],
    },
    { id: "ch2", title: "第2章", lessons: [{ id: "l3", title: "C", body: "" }] },
  ],
};

describe("course-utils", () => {
  it("章をまたいで表示順にレッスンを並べる", () => {
    expect(flattenLessons(course).map((r) => r.lesson.id)).toEqual(["l1", "l2", "l3"]);
  });

  it("レッスン数を数えられる", () => {
    expect(countLessons(course)).toBe(3);
  });

  it("進捗キーは章とレッスンの組で決まる", () => {
    const [first] = flattenLessons(course);
    expect(lessonKey(first.chapter, first.lesson)).toBe("ch1/l1");
  });

  it("パッケージは重複を除いてまとめる", () => {
    expect(mergePackages(["pandas"], undefined, ["pandas", "matplotlib"])).toEqual([
      "pandas",
      "matplotlib",
    ]);
    expect(mergePackages(undefined, undefined)).toEqual([]);
  });

  it("ファイルは後ろのものが優先される", () => {
    expect(mergeFiles({ "a.csv": "1" }, { "a.csv": "2", "b.csv": "3" })).toEqual({
      "a.csv": "2",
      "b.csv": "3",
    });
  });

  it("ファイルが 1 つも無ければ null を返す", () => {
    expect(mergeFiles(undefined, null)).toBeNull();
  });
});
