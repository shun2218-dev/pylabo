/* ============================================================
   アイコン
   ------------------------------------------------------------
   絵文字はフォント依存で大きさや余白が揃わないため、
   表示に使う記号はすべて lucide-react（SVG）に統一する。
   ============================================================ */

import {
  BookOpen,
  ChartLine,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CodeXml,
  Cog,
  Database,
  FlaskConical,
  Hourglass,
  Lightbulb,
  Moon,
  Package,
  Play,
  RotateCcw,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  Square,
  SquareTerminal,
  Sun,
  Terminal,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { CourseIconName } from "./types";

/** コースカードとサイドバーで使うアイコン。types.ts の CourseIconName と対応。 */
export const courseIcons: Record<CourseIconName, LucideIcon> = {
  code: CodeXml,
  chart: ChartLine,
  automation: Cog,
  server: Server,
  test: ShieldCheck,
  lint: ScanSearch,
  database: Database,
  async: Zap,
  package: Package,
  cli: SquareTerminal,
};

export {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  FlaskConical,
  Hourglass,
  Lightbulb,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Terminal,
  X,
};
export type { LucideIcon };
