import { describe, expect, it } from "vitest";

import { COURSE_ENTRIES, availableCourses, findAvailableCourse } from "../courses/registry";
import { courseIcons } from "../icons";
import { countLessons } from "../lib/course-utils";

describe("コースレジストリ", () => {
  it("id が重複していない", () => {
    const ids = COURSE_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("アイコンがすべて定義済み", () => {
    for (const entry of COURSE_ENTRIES) {
      expect(courseIcons[entry.icon], `${entry.id} のアイコン`).toBeTruthy();
    }
  });

  it("一覧に出す項目が埋まっている", () => {
    for (const entry of COURSE_ENTRIES) {
      expect(entry.title, entry.id).toBeTruthy();
      expect(entry.description, entry.id).toBeTruthy();
      expect(entry.level, entry.id).toBeTruthy();
      expect(entry.accent, entry.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("追加予定のコースは収録内容を持ち、開けない", () => {
    for (const entry of COURSE_ENTRIES) {
      if (entry.status !== "planned") continue;
      expect(entry.topics.length, entry.id).toBeGreaterThan(0);
      expect(findAvailableCourse(entry.id)).toBeUndefined();
    }
  });

  it("公開済みのコースは id で引ける", () => {
    for (const entry of availableCourses()) {
      expect(findAvailableCourse(entry.id)?.id).toBe(entry.id);
    }
  });

  it("lessonCount が本文と一致している", async () => {
    for (const entry of availableCourses()) {
      const course = await entry.load();
      expect(countLessons(course), `${entry.id} の lessonCount`).toBe(entry.lessonCount);
    }
  });
});
