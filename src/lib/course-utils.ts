/* ============================================================
   コースデータを扱う小さなヘルパー
   ============================================================ */

import type { Chapter, Course, Lesson, LessonRef } from "../types";

/** 章をまたいで、レッスンを表示順に並べた一覧を作る。 */
export function flattenLessons(course: Course): LessonRef[] {
  return course.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({ chapter, lesson }))
  );
}

export function countLessons(course: Course): number {
  return course.chapters.reduce((n, chapter) => n + chapter.lessons.length, 0);
}

/** 進捗の保存に使うキー。 */
export const lessonKey = (chapter: Chapter, lesson: Lesson): string =>
  `${chapter.id}/${lesson.id}`;

/** コース・レッスン・ブロックの指定をまとめて 1 つの配列にする。 */
export function mergePackages(...lists: (string[] | undefined)[]): string[] {
  return [...new Set(lists.filter(Boolean).flat() as string[])];
}

export function mergeFiles(
  ...objects: (Record<string, string> | undefined | null)[]
): Record<string, string> | null {
  const merged = Object.assign({}, ...objects.filter(Boolean)) as Record<string, string>;
  return Object.keys(merged).length > 0 ? merged : null;
}
