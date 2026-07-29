import { useEffect, useRef } from "react";

import { Circle, CircleCheck, courseIcons } from "../icons";
import { lessonKey } from "../lib/course-utils";
import { lessonPath, navigate } from "../lib/route";
import type { Course, CourseIconName, LessonRef } from "../types";

interface Props {
  course: Course;
  icon: CourseIconName;
  lessons: LessonRef[];
  doneKeys: Set<string>;
  currentKey: string;
}

export function Sidebar({ course, icon, lessons, doneKeys, currentKey }: Props) {
  const Icon = courseIcons[icon];
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentKey]);

  const doneCount = lessons.filter((ref) =>
    doneKeys.has(lessonKey(ref.chapter, ref.lesson))
  ).length;

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        <h2 className="sidebar__title">
          <Icon aria-hidden />
          {course.title}
        </h2>
        <div className="sidebar__progress">
          <span className="progress-bar">
            <span style={{ width: `${(doneCount / lessons.length) * 100}%` }} />
          </span>
          <span>
            {doneCount}/{lessons.length}
          </span>
        </div>
      </div>

      {course.chapters.map((chapter) => (
        <div className="sidebar__chapter" key={chapter.id}>
          <h3 className="sidebar__chapter-title">{chapter.title}</h3>
          {chapter.lessons.map((lesson) => {
            const key = lessonKey(chapter, lesson);
            const isDone = doneKeys.has(key);
            const isActive = key === currentKey;

            return (
              <button
                type="button"
                key={lesson.id}
                ref={isActive ? activeRef : undefined}
                className={[
                  "lesson-link",
                  isDone ? "is-done" : "",
                  isActive ? "is-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => navigate(lessonPath(course.id, chapter.id, lesson.id))}
                aria-current={isActive ? "page" : undefined}
              >
                {isDone ? <CircleCheck aria-hidden /> : <Circle aria-hidden />}
                <span>{lesson.title}</span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
