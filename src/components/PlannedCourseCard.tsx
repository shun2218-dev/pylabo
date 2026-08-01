import { courseIcons, Hourglass } from "../icons";
import type { PlannedCourse } from "../types";

interface Props {
  course: PlannedCourse;
}

/** 追加予定のコース 1 件。破線・非活性で並び、収録予定の内容を見せる。 */
export function PlannedCourseCard({ course }: Props) {
  const Icon = courseIcons[course.icon];

  return (
    <div
      className="course-card course-card--planned"
      style={{ "--accent": course.accent } as React.CSSProperties}
      aria-disabled="true"
    >
      <div className="course-card__top">
        <span className="course-card__icon">
          <Icon aria-hidden />
        </span>
        <span className="course-card__badge">
          <Hourglass aria-hidden />
          {course.plannedFor ?? "追加予定"}
        </span>
      </div>
      <h3 className="course-card__title">{course.title}</h3>
      <p className="course-card__desc">{course.description}</p>
      <ul className="course-card__topics">
        {course.topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
    </div>
  );
}
