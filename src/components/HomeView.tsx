import { courseIcons, Hourglass, Sparkles } from "../icons";
import { progress } from "../lib/storage";
import { coursePath, navigate } from "../lib/route";
import type { AvailableCourse, CourseEntry, PlannedCourse } from "../types";

interface Props {
  entries: CourseEntry[];
}

export function HomeView({ entries }: Props) {
  const openCourses = entries.filter(
    (e): e is AvailableCourse => e.status === "available"
  );
  const plannedCourses = entries.filter(
    (e): e is PlannedCourse => e.status === "planned"
  );

  const totalLessons = openCourses.reduce((n, c) => n + c.lessonCount, 0);

  return (
    <div className="home">
      <div className="home__inner">
        <p className="home__eyebrow">
          <Sparkles aria-hidden />
          インストール不要・ブラウザだけで動く Python 学習環境
        </p>
        <h1 className="home__title">書いて、動かして、Python を身につける。</h1>
        <p className="home__lead">
          このページの中で本物の Python が動きます（CPython を WebAssembly
          に移植した Pyodide を同梱しています）。解説を読み、その場でコードを書いて実行し、
          自動採点で理解を確かめながら進められます。
        </p>

        <div className="home__chips">
          <span className="chip">{openCourses.length} コース公開中</span>
          <span className="chip">{totalLessons} レッスン</span>
          <span className="chip">環境構築なし</span>
          <span className="chip">進捗は自動保存</span>
        </div>

        <h2 className="home__section-title">コースを選ぶ</h2>
        <p className="home__section-note">
          目的別に分かれています。どこから始めても構いませんが、迷ったら「Python
          の基本文法」からどうぞ。
        </p>

        <div className="course-grid">
          {openCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {plannedCourses.length > 0 && (
          <section className="home__planned">
            <h2 className="home__section-title">
              <Hourglass aria-hidden />
              今後追加予定のコース
            </h2>
            <p className="home__section-note">
              実務でつまずきやすいところから順に用意しています。公開したらこの一覧から選べるようになります。
            </p>
            <div className="course-grid">
              {plannedCourses.map((course) => (
                <PlannedCourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        <section className="home__how">
          <h2 className="home__section-title">進め方</h2>
          <ol>
            <li>
              <b>読む</b> — 各レッスンは短い解説から始まります。
            </li>
            <li>
              <b>動かす</b> —
              例のコードはすべてその場で実行できます。書き換えて試すのが一番身につきます。
            </li>
            <li>
              <b>解く</b> —
              演習を書いて「採点する」。チェック項目がすべて緑になればクリアです。
            </li>
            <li>
              <b>進む</b> — 進捗はこのブラウザに保存されます。
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: AvailableCourse }) {
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
        <span className="course-card__level">{course.level}</span>
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

function PlannedCourseCard({ course }: { course: PlannedCourse }) {
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
