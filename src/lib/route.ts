/* ============================================================
   ハッシュベースの簡易ルーター
   #/                          → コース一覧
   #/c/<course>                → そのコースの最初のレッスン
   #/c/<course>/<章>/<レッスン>  → 指定のレッスン
   ============================================================ */

import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "course"; courseId: string; chapterId?: string; lessonId?: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);

  if (parts[0] === "c" && parts[1]) {
    return {
      name: "course",
      courseId: parts[1],
      chapterId: parts[2],
      lessonId: parts[3],
    };
  }
  return { name: "home" };
}

export const homePath = () => "#/";

export const coursePath = (courseId: string) => `#/c/${courseId}`;

export const lessonPath = (courseId: string, chapterId: string, lessonId: string) =>
  `#/c/${courseId}/${chapterId}/${lessonId}`;

export function navigate(path: string): void {
  window.location.hash = path;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
