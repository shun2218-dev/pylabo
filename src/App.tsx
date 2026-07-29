import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";

import { COURSE_ENTRIES, findAvailableCourse } from "./courses/registry";
import { HomeView } from "./components/HomeView";
import { TopBar } from "./components/TopBar";
import { ThemeContext } from "./lib/theme-context";
import { theme as themeStore, type ThemeName } from "./lib/storage";
import { useHashRoute } from "./lib/route";

/* コース画面はエディタや Markdown レンダラを抱えているため、
   ホームの初期表示には含めず、開いたときに読み込む。 */
const CourseView = lazy(() =>
  import("./components/CourseView").then((m) => ({ default: m.CourseView }))
);

export default function App() {
  const [themeName, setThemeName] = useState<ThemeName>(() => themeStore.get());
  const route = useHashRoute();

  useEffect(() => {
    themeStore.set(themeName);
  }, [themeName]);

  const toggleTheme = useCallback(() => {
    setThemeName((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const themeValue = useMemo(
    () => ({ theme: themeName, toggleTheme }),
    [themeName, toggleTheme]
  );

  // 追加予定のコースはまだ開けないので、ここでは見つからない
  const entry = route.name === "course" ? findAvailableCourse(route.courseId) : undefined;

  return (
    <ThemeContext.Provider value={themeValue}>
      <div
        className="app"
        style={entry ? ({ "--accent": entry.accent } as React.CSSProperties) : undefined}
      >
        <TopBar />
        <main className="app__main">
          {entry ? (
            <Suspense fallback={<p className="loading-note">読み込んでいます…</p>}>
              <CourseView
                key={entry.id}
                entry={entry}
                chapterId={route.name === "course" ? route.chapterId : undefined}
                lessonId={route.name === "course" ? route.lessonId : undefined}
              />
            </Suspense>
          ) : (
            <HomeView entries={COURSE_ENTRIES} />
          )}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
