/* ============================================================
   学習コンテンツの型定義
   ------------------------------------------------------------
   コースは「データ」として書く。UI 側はこの型だけを知っていればよいので、
   新しいコースを足すときにコンポーネントを触る必要はない。

   一覧に出す情報（CourseSummary）と本文（CourseContent）は分けてある。
   ホーム画面は本文を読み込まずに描画でき、本文はコースを開いたときに
   はじめて読み込まれる。
   ============================================================ */

/** コース一覧で使うアイコン。src/icons.tsx の courseIcons に対応する。 */
export type CourseIconName =
  | "code"
  | "chart"
  | "automation"
  | "server"
  | "test"
  | "lint"
  | "database"
  | "async"
  | "package"
  | "cli";

/**
 * コースの難易度。バッジの色はこの値で決まるので、増やすときは
 * src/components/CourseCard.tsx の LEVEL_TONE にも追記する（型で強制される）。
 */
export type CourseLevel = "入門" | "中級" | "実践";

/** 解説の途中に置く、実行できるコード例。 */
export interface CodeExample {
  /** ブロック見出し */
  caption?: string;
  /** コードの前に置く補足（Markdown） */
  note?: string;
  code: string;
  /**
   * false にすると読むだけのブロックになる。
   * ブラウザでは動かせないコード（サーバー起動など）を載せるときに使う。
   */
  runnable?: boolean;
  /**
   * true にすると「実行するとエラーになる」ことを見せる例になる。
   * scripts/verify-exercises.mjs は、この印が付いた例は逆に
   * 「本当にエラーで止まるか」を確かめる（説明と食い違ったら落とす）。
   */
  raises?: boolean;
  packages?: string[];
  files?: Record<string, string>;
}

/** 自動採点つきの演習。 */
export interface Exercise {
  /** 課題文（Markdown） */
  prompt: string;
  caption?: string;
  /** エディタの初期コード */
  starter: string;
  /**
   * 採点用の Python コード。学習者のコードと同じ名前空間で実行される。
   * check(条件, "説明") を並べて書くと、その並びがチェック項目になる。
   * _stdout() で「何が print されたか」、_shown() で「図を出したか」を取得できる。
   */
  tests: string;
  /**
   * ヒント（Markdown）。配列にすると段階ヒントになり、1 段ずつ開いていける。
   *
   * 書くのは「解答例にたどり着く手順」ではなく、考え方そのもの。
   * solution はサイトが用意した一例でしかないので、ヒントを追っていくと
   * その書き方に収束する、という作りにはしない。
   * 段階の目安は「何をする問題か → どこで判断を誤りやすいか → 手がかり」。
   */
  hint?: string | string[];
  /** 解答例。あくまで数ある書き方のひとつとして見せる。 */
  solution?: string;
  /**
   * 採点が落とせないといけない回答。
   *
   * 「初期コードのままなら落ちる」だけでは、答えを丸め込んだ回答
   * （テストの中身が空、結果を決め打ちなど）が通ってしまう抜けに気づけない。
   * 落としたい回答をここに置くと、scripts/verify-exercises.mjs が
   * 「本当に落ちるか」を毎回確かめる。
   */
  rejects?: { caption: string; code: string }[];
  packages?: string[];
  files?: Record<string, string>;
}

export interface Lesson {
  id: string;
  title: string;
  /** 「このレッスンのゴール」に出る 1 行 */
  goal?: string;
  /** 本文（Markdown） */
  body: string;
  examples?: CodeExample[];
  exercise?: Exercise;
  /** このレッスンで必要な Python パッケージ */
  packages?: string[];
  /** 実行前に仮想ファイルシステムへ書き出すファイル */
  files?: Record<string, string>;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

/* ---------- 一覧用の情報 ---------- */

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  icon: CourseIconName;
  /** 「入門」「中級」など */
  level: CourseLevel;
  /** コース色（CSS のカスタムプロパティに流し込む） */
  accent: string;
}

/* ---------- 本文 ---------- */

/** src/courses/<name>.ts が default export する中身。 */
export interface CourseContent {
  /** コース全体で必要な Python パッケージ */
  packages?: string[];
  /** コース全体で使う練習用ファイル */
  files?: Record<string, string>;
  chapters: Chapter[];
}

/** 一覧情報と本文をあわせた、画面が実際に扱うコース。 */
export type Course = CourseSummary & CourseContent;

/* ---------- 一覧のエントリ ---------- */

/** 公開済みのコース。本文は load() で必要になったときに読み込む。 */
export interface AvailableCourse extends CourseSummary {
  status: "available";
  /**
   * レッスン総数。本文を読み込まずに進捗バーを出すために持っている。
   * 本文とずれていないかは、コースを開いたときに開発モードで検証する。
   */
  lessonCount: number;
  load: () => Promise<Course>;
}

/** 追加予定のコース。一覧には出るが選べない。 */
export interface PlannedCourse extends CourseSummary {
  status: "planned";
  /** 「2026年内」など公開時期の目安（任意） */
  plannedFor?: string;
  /** 収録予定の内容 */
  topics: string[];
}

export type CourseEntry = AvailableCourse | PlannedCourse;

/** サイドバーやナビで使う、章とレッスンの組。 */
export interface LessonRef {
  chapter: Chapter;
  lesson: Lesson;
}
