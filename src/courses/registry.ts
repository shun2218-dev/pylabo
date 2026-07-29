/* ============================================================
   コースレジストリ
   ------------------------------------------------------------
   一覧に出す情報だけをここに集約している。本文（chapters）は
   load() が呼ばれたときに動的 import で読み込まれるため、
   ホーム画面の初期表示にコース本文は含まれない。

   ・コースを追加する      → available(...) を 1 行足す
   ・追加予定として告知する → planned(...) を 1 行足す
   ・追加予定 → 公開に変える → planned(...) を available(...) に書き換える

   詳しくは docs/コースの追加方法.md を参照。
   ============================================================ */

import type {
  AvailableCourse,
  Course,
  CourseContent,
  CourseEntry,
  CourseSummary,
  PlannedCourse,
} from "../types";

type AvailableSummary = CourseSummary & { lessonCount: number };
type ContentModule = { default: CourseContent };

/** 公開済みのコース。本文は必要になってから読み込む。 */
function available(
  summary: AvailableSummary,
  loader: () => Promise<ContentModule>
): AvailableCourse {
  return {
    ...summary,
    status: "available",
    load: async (): Promise<Course> => ({ ...summary, ...(await loader()).default }),
  };
}

/** 追加予定のコース。一覧には出るが、まだ開けない。 */
function planned(
  summary: CourseSummary,
  detail: { plannedFor?: string; topics: string[] }
): PlannedCourse {
  return { ...summary, status: "planned", ...detail };
}

export const COURSE_ENTRIES: CourseEntry[] = [
  /* ---------- 公開済み ---------- */

  available(
    {
      id: "basics",
      title: "Python の基本文法",
      icon: "code",
      level: "入門",
      accent: "#4f8cff",
      lessonCount: 16,
      description:
        "変数・条件分岐・リスト・関数・クラスまで、Python の骨格を一通り。ほかのコースの土台になります。",
    },
    () => import("./basics")
  ),

  available(
    {
      id: "data",
      title: "データ分析・集計",
      icon: "chart",
      level: "中級",
      accent: "#22b8a6",
      lessonCount: 10,
      description:
        "CSV を読み、条件で絞り、グループごとに集計してグラフにする。pandas と matplotlib を実際に動かしながら覚えます。",
    },
    () => import("./data-analysis")
  ),

  available(
    {
      id: "automation",
      title: "Web/API・自動化",
      icon: "automation",
      level: "中級",
      accent: "#f0803c",
      lessonCount: 7,
      description:
        "ファイル・CSV・JSON・正規表現・日時を扱い、手作業を置き換えるスクリプトを書けるようになります。HTTP と API の基礎も。",
    },
    () => import("./automation")
  ),

  available(
    {
      id: "appdev",
      title: "アプリ開発（FastAPI）",
      icon: "server",
      level: "実践",
      accent: "#8b5cf6",
      lessonCount: 6,
      description:
        "Web API の仕組みを自作して理解し、FastAPI で書き直す。手元でサーバーを起動するところまで案内します。",
    },
    () => import("./app-dev")
  ),

  /* ---------- 追加予定 ---------- */

  planned(
    {
      id: "testing",
      title: "テストと品質",
      icon: "test",
      level: "実践",
      accent: "#e05a8a",
      description:
        "pytest でテストを書き、壊れたらすぐ気づける状態を作る。テストしやすい設計の勘所まで。",
    },
    {
      plannedFor: "次回リリース",
      topics: [
        "pytest の基本と assert",
        "フィクスチャとパラメータ化",
        "モックで外部依存を切る",
        "カバレッジの読み方",
        "テストしやすい設計",
      ],
    }
  ),

  planned(
    {
      id: "typing",
      title: "型ヒントと静的解析",
      icon: "lint",
      level: "実践",
      accent: "#3aa0d8",
      description:
        "型ヒントを設計の道具として使い、mypy と ruff で実行前に間違いを見つける。",
    },
    {
      topics: [
        "typing の実用パターン",
        "mypy / pyright の導入と設定",
        "ruff によるリントと整形",
        "Protocol と型による疎結合",
        "既存コードへの段階的な導入",
      ],
    }
  ),

  planned(
    {
      id: "database",
      title: "データベースと SQL",
      icon: "database",
      level: "実践",
      accent: "#d9a441",
      description:
        "sqlite3 から始めて SQL を書き、SQLAlchemy でアプリからデータベースを扱えるようにする。",
    },
    {
      topics: [
        "sqlite3 で SQL を書く",
        "SELECT / JOIN / 集計",
        "SQLAlchemy の基本",
        "マイグレーションの考え方",
        "N+1 問題とインデックス",
      ],
    }
  ),

  planned(
    {
      id: "async",
      title: "非同期処理と並行実行",
      icon: "async",
      level: "実践",
      accent: "#7b6cf0",
      description:
        "待ち時間の多い処理を速くする。asyncio と並行実行の使いどころを、実測しながら判断できるように。",
    },
    {
      topics: [
        "async / await の考え方",
        "asyncio でまとめて待つ",
        "httpx で並行リクエスト",
        "threading と multiprocessing の使い分け",
        "計測してから選ぶ",
      ],
    }
  ),

  planned(
    {
      id: "packaging",
      title: "環境とパッケージング",
      icon: "package",
      level: "実践",
      accent: "#4fae7a",
      description:
        "venv / uv・pyproject.toml・Docker まで。「自分の環境では動く」を卒業するための回。",
    },
    {
      topics: [
        "venv と uv による環境分離",
        "pyproject.toml と依存の固定",
        "自作パッケージの構成",
        "Docker で動かす",
        "GitHub Actions で lint とテスト",
      ],
    }
  ),

  planned(
    {
      id: "cli",
      title: "CLI ツール開発",
      icon: "cli",
      level: "実践",
      accent: "#8a94a8",
      description:
        "毎回手で動かしている処理を、引数つきのコマンドに仕立てて配れるようにする。",
    },
    {
      topics: [
        "argparse と Typer",
        "設定ファイルと環境変数",
        "logging で動きを残す",
        "エラー設計と終了コード",
        "配布して使ってもらう",
      ],
    }
  ),
];

/** 公開済みのコースだけを取り出す。 */
export const availableCourses = (): AvailableCourse[] =>
  COURSE_ENTRIES.filter((e): e is AvailableCourse => e.status === "available");

/** id から公開済みのコースを引く。追加予定のコースは開けないので undefined になる。 */
export const findAvailableCourse = (id: string): AvailableCourse | undefined =>
  availableCourses().find((e) => e.id === id);
