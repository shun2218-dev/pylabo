/* ============================================================
   進捗・書きかけコード・テーマの保存（localStorage）
   ============================================================ */

const KEY_PROGRESS = "pylab.progress.v1";
const KEY_DRAFT = "pylab.draft.v1";
const KEY_THEME = "pylab.theme.v1";

export type ThemeName = "dark" | "light";

function read<T extends object>(key: string): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as T;
  } catch {
    return {} as T;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 容量オーバーなどは黙って諦める */
  }
}

/* ---------- 進捗 ---------- */

type ProgressMap = Record<string, Record<string, true>>;

export const progress = {
  isDone(courseId: string, lessonKey: string): boolean {
    return Boolean(read<ProgressMap>(KEY_PROGRESS)[courseId]?.[lessonKey]);
  },

  set(courseId: string, lessonKey: string, done: boolean): void {
    const all = read<ProgressMap>(KEY_PROGRESS);
    const course = all[courseId] ?? (all[courseId] = {});
    if (done) course[lessonKey] = true;
    else delete course[lessonKey];
    write(KEY_PROGRESS, all);
  },

  doneKeys(courseId: string): Set<string> {
    return new Set(Object.keys(read<ProgressMap>(KEY_PROGRESS)[courseId] ?? {}));
  },

  countDone(courseId: string): number {
    return Object.keys(read<ProgressMap>(KEY_PROGRESS)[courseId] ?? {}).length;
  },

  reset(courseId: string): void {
    const all = read<ProgressMap>(KEY_PROGRESS);
    delete all[courseId];
    write(KEY_PROGRESS, all);
  },
};

/* ---------- 書きかけのコード ---------- */

type DraftMap = Record<string, string>;

const draftKey = (courseId: string, lessonKey: string, slot: string) =>
  `${courseId}/${lessonKey}/${slot}`;

export const draft = {
  get(courseId: string, lessonKey: string, slot: string): string | null {
    return read<DraftMap>(KEY_DRAFT)[draftKey(courseId, lessonKey, slot)] ?? null;
  },

  set(courseId: string, lessonKey: string, slot: string, code: string): void {
    const all = read<DraftMap>(KEY_DRAFT);
    all[draftKey(courseId, lessonKey, slot)] = code;
    write(KEY_DRAFT, all);
  },

  clear(courseId: string, lessonKey: string, slot: string): void {
    const all = read<DraftMap>(KEY_DRAFT);
    delete all[draftKey(courseId, lessonKey, slot)];
    write(KEY_DRAFT, all);
  },
};

/* ---------- テーマ ---------- */

export const theme = {
  get(): ThemeName {
    const saved = localStorage.getItem(KEY_THEME);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  },

  set(value: ThemeName): void {
    localStorage.setItem(KEY_THEME, value);
    document.documentElement.dataset.theme = value;
  },
};
