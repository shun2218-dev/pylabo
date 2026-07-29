import { describe, expect, it } from "vitest";

import { coursePath, homePath, lessonPath, parseHash } from "../lib/route";

describe("parseHash", () => {
  it("空や不明なハッシュはホームになる", () => {
    expect(parseHash("")).toEqual({ name: "home" });
    expect(parseHash("#/")).toEqual({ name: "home" });
    expect(parseHash("#/unknown")).toEqual({ name: "home" });
  });

  it("コースだけの指定を読み取れる", () => {
    expect(parseHash("#/c/basics")).toEqual({
      name: "course",
      courseId: "basics",
      chapterId: undefined,
      lessonId: undefined,
    });
  });

  it("章とレッスンまで読み取れる", () => {
    expect(parseHash("#/c/data/ch3/l9")).toEqual({
      name: "course",
      courseId: "data",
      chapterId: "ch3",
      lessonId: "l9",
    });
  });

  it("余分なスラッシュがあっても壊れない", () => {
    expect(parseHash("#//c//basics//ch1//l1")).toEqual({
      name: "course",
      courseId: "basics",
      chapterId: "ch1",
      lessonId: "l1",
    });
  });

  it("パスを組み立てたものは、そのまま読み戻せる", () => {
    expect(parseHash(homePath())).toEqual({ name: "home" });
    expect(parseHash(coursePath("appdev"))).toMatchObject({ courseId: "appdev" });
    expect(parseHash(lessonPath("automation", "ch2", "l5"))).toEqual({
      name: "course",
      courseId: "automation",
      chapterId: "ch2",
      lessonId: "l5",
    });
  });
});
