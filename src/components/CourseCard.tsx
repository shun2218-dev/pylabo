import { courseIcons } from "../icons";
import { progress } from "../lib/storage";
import { coursePath, navigate } from "../lib/route";
import type { AvailableCourse, CourseLevel } from "../types";

/** 難易度バッジの色。実際の色は src/styles/_tokens.scss の --level-* にある。 */
const LEVEL_TONE: Record<CourseLevel, string> = {
  入門: "intro",
  中級: "mid",
  実践: "advanced",
};

interface Props {
  course: AvailableCourse;
}

/** 公開済みのコース 1 件。押すとそのコースへ移動する。 */
export function CourseCard({ course }: Props) {
  const Icon = courseIcons[course.icon];
  const done = progress.countDone(course.id);
  const percent =
    course.lessonCount === 0 ? 0 : Math.round((done / course.lessonCount) * 100);

  // 触れた時点で本文を先読みしておくと、クリック後の待ちがなくなる
  const prefetch = () => {
    void course.load();
  };

  return (
    <button
      type="button"
      className="course-card"
      style={{ "--accent": course.accent } as React.CSSProperties}
      onClick={() => navigate(coursePath(course.id))}
      onPointerEnter={prefetch}
      onFocus={prefetch}
    >
      <div className="course-card__top">
        <span className="course-card__icon">
          <Icon aria-hidden />
        </span>
        <span
          className={`course-card__level course-card__level--${LEVEL_TONE[course.level]}`}
        >
          {course.level}
        </span>
      </div>
      <h3 className="course-card__title">{course.title}</h3>
      <p className="course-card__desc">{course.description}</p>
      <div className="course-card__foot">
        <span className="progress-bar">
          <span style={{ width: `${percent}%` }} />
        </span>
        <span>
          {done}/{course.lessonCount}
        </span>
      </div>
    </button>
  );
}
