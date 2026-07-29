import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LessonView } from "./LessonView";
import { Sidebar } from "./Sidebar";
import { countLessons, flattenLessons, lessonKey } from "../lib/course-utils";
import { progress } from "../lib/storage";
import { runner } from "../lib/runner";
import type { AvailableCourse, Course } from "../types";

interface Props {
  entry: AvailableCourse;
  chapterId?: string;
  lessonId?: string;
}

export function CourseView({ entry, chapterId, lessonId }: Props) {
  const [course, setCourse] = useState<Course | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  const [doneKeys, setDoneKeys] = useState<Set<string>>(() =>
    progress.doneKeys(entry.id)
  );

  // 本文はコースを開いたときに読み込む
  useEffect(() => {
    let cancelled = false;

    entry.load().then((loaded) => {
      if (cancelled) return;
      setCourse(loaded);

      if (import.meta.env.DEV && countLessons(loaded) !== entry.lessonCount) {
        console.warn(
          `[courses] ${entry.id}: registry.ts の lessonCount が ${entry.lessonCount} ですが、` +
            `本文は ${countLessons(loaded)} レッスンです。registry.ts を更新してください。`
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [entry]);

  // レッスンを開いた時点で Python を温めておく
  useEffect(() => {
    runner.start();
  }, []);

  const lessons = useMemo(() => (course ? flattenLessons(course) : []), [course]);

  const index = Math.max(
    0,
    lessons.findIndex(
      (ref) => ref.chapter.id === chapterId && ref.lesson.id === lessonId
    )
  );

  // レッスンを切り替えたら本文を先頭へ戻す
  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [index]);

  const setDone = useCallback(
    (key: string, done: boolean) => {
      progress.set(entry.id, key, done);
      setDoneKeys(progress.doneKeys(entry.id));
    },
    [entry.id]
  );

  if (!course) {
    return <p className="loading-note">コースを読み込んでいます…</p>;
  }

  const current = lessons[index];
  if (!current) return null;

  const currentKey = lessonKey(current.chapter, current.lesson);

  return (
    <div className="course">
      <Sidebar
        course={course}
        icon={entry.icon}
        lessons={lessons}
        doneKeys={doneKeys}
        currentKey={currentKey}
      />
      <div className="lesson-pane" ref={paneRef}>
        <LessonView
          key={currentKey}
          course={course}
          lessons={lessons}
          index={index}
          isDone={doneKeys.has(currentKey)}
          onDoneChange={(done) => setDone(currentKey, done)}
        />
      </div>
    </div>
  );
}
