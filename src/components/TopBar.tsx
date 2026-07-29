import { useEffect, useState } from "react";

import { Moon, Sun, Terminal } from "../icons";
import { runner } from "../lib/runner";
import type { RuntimeState } from "../lib/protocol";
import { homePath, navigate } from "../lib/route";
import { useTheme } from "../lib/theme-context";

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [status, setStatus] = useState<{ state: RuntimeState; label: string }>({
    state: runner.state,
    label: runner.label,
  });

  useEffect(() => runner.onStatus((state, label) => setStatus({ state, label })), []);

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__home"
        onClick={() => navigate(homePath())}
        title="コース一覧へ"
      >
        <Terminal aria-hidden />
        <span>Pylabo</span>
      </button>

      <div className="topbar__spacer" />

      <div className="runtime" data-state={status.state} title={status.label}>
        <span className="runtime__dot" aria-hidden />
        <span className="runtime__label">{status.label}</span>
      </div>

      <button
        type="button"
        className="icon-btn"
        onClick={toggleTheme}
        title={theme === "dark" ? "ライトテーマにする" : "ダークテーマにする"}
        aria-label="テーマを切り替える"
      >
        {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </button>
    </header>
  );
}
