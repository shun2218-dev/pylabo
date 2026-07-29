import { useCallback } from "react";

import { CodeBlock } from "./CodeBlock";
import { Prose } from "./Prose";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FlaskConical,
  Lightbulb,
  Play,
} from "../icons";
import { lessonKey, mergeFiles, mergePackages } from "../lib/course-utils";
import { homePath, lessonPath, navigate } from "../lib/route";
import type { Course, LessonRef } from "../types";

interface Props {
  course: Course;
  lessons: LessonRef[];
  index: number;
  isDone: boolean;
  onDoneChange: (done: boolean) => void;
}

export function LessonView({ course, lessons, index, isDone, onDoneChange }: Props) {
  const { chapter, lesson } = lessons[index];
  const key = lessonKey(chapter, lesson);

  const packagesFor = (extra?: string[]) =>
    mergePackages(course.packages, lesson.packages, extra);
  const filesFor = (extra?: Record<string, string>) =>
    mergeFiles(course.files, lesson.files, extra);

  const goTo = useCallback(
    (target: LessonRef) =>
      navigate(lessonPath(course.id, target.chapter.id, target.lesson.id)),
    [course.id]
  );

  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  return (
    <article className="lesson">
      <p className="lesson__crumb">{chapter.title}</p>
      <h1 className="lesson__title">{lesson.title}</h1>

      {lesson.goal && (
        <div className="lesson__goal">
          <Lightbulb aria-hidden />
          <p>
            <b>このレッスンのゴール：</b>
            {lesson.goal}
          </p>
        </div>
      )}

      <Prose source={lesson.body} />

      {lesson.examples && lesson.examples.length > 0 && (
        <>
          <h2 className="section-label">
            <Play aria-hidden />
            動かしてみる
          </h2>
          {lesson.examples.map((example, i) => (
            <div key={i}>
              {example.note && <Prose source={example.note} />}
              <CodeBlock
                caption={example.caption ?? "例"}
                code={example.code.trim()}
                readOnly={example.runnable === false}
                packages={packagesFor(example.packages)}
                files={filesFor(example.files)}
              />
            </div>
          ))}
        </>
      )}

      {lesson.exercise && (
        <>
          <h2 className="section-label">
            <FlaskConical aria-hidden />
            演習
          </h2>
          <Prose source={lesson.exercise.prompt} />
          <CodeBlock
            caption={lesson.exercise.caption ?? "ここに書いてください"}
            tag="Ctrl / ⌘ + Enter で採点"
            code={lesson.exercise.starter.replace(/^\n/, "").trimEnd()}
            tests={lesson.exercise.tests}
            hint={lesson.exercise.hint}
            solution={lesson.exercise.solution?.trim()}
            packages={packagesFor(lesson.exercise.packages)}
            files={filesFor(lesson.exercise.files)}
            draftKey={{ courseId: course.id, lessonKey: key, slot: "exercise" }}
            onSolved={() => onDoneChange(true)}
          />
        </>
      )}

      <nav className="lesson-nav">
        <button
          type="button"
          className="btn btn--lg"
          disabled={!previous}
          onClick={() => previous && goTo(previous)}
        >
          <ChevronLeft aria-hidden />
          前へ
        </button>

        <label className="done-toggle">
          <input
            type="checkbox"
            checked={isDone}
            onChange={(e) => onDoneChange(e.target.checked)}
          />
          このレッスンを理解した
        </label>

        <span className="lesson-nav__spacer" />

        <button
          type="button"
          className="btn btn--lg btn--primary"
          disabled={!next}
          onClick={() => next && goTo(next)}
        >
          次へ
          <ChevronRight aria-hidden />
        </button>
      </nav>

      {!next && (
        <div className="finale">
          <CircleCheck aria-hidden />
          <h3>このコースは以上です</h3>
          <p>気になった章にはいつでも戻れます。別のコースにも進んでみましょう。</p>
          <button type="button" className="btn btn--lg" onClick={() => navigate(homePath())}>
            コース一覧へ
          </button>
        </div>
      )}
    </article>
  );
}
