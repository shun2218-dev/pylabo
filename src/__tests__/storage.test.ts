import { beforeEach, describe, expect, it } from "vitest";

import { draft, progress, theme } from "../lib/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("progress", () => {
  it("完了の記録と取り消しができる", () => {
    expect(progress.isDone("basics", "ch1/l1")).toBe(false);

    progress.set("basics", "ch1/l1", true);
    expect(progress.isDone("basics", "ch1/l1")).toBe(true);
    expect(progress.countDone("basics")).toBe(1);

    progress.set("basics", "ch1/l1", false);
    expect(progress.isDone("basics", "ch1/l1")).toBe(false);
    expect(progress.countDone("basics")).toBe(0);
  });

  it("コースごとに独立している", () => {
    progress.set("basics", "ch1/l1", true);
    progress.set("data", "ch1/l1", true);

    progress.reset("basics");
    expect(progress.countDone("basics")).toBe(0);
    expect(progress.countDone("data")).toBe(1);
  });

  it("壊れた値が入っていても落ちない", () => {
    localStorage.setItem("pylab.progress.v1", "{壊れたJSON");
    expect(progress.countDone("basics")).toBe(0);
    expect(progress.doneKeys("basics").size).toBe(0);
  });
});

describe("draft", () => {
  it("コース・レッスン・スロットごとに保存される", () => {
    draft.set("basics", "ch1/l1", "exercise", "print(1)");
    expect(draft.get("basics", "ch1/l1", "exercise")).toBe("print(1)");
    expect(draft.get("basics", "ch1/l2", "exercise")).toBeNull();

    draft.clear("basics", "ch1/l1", "exercise");
    expect(draft.get("basics", "ch1/l1", "exercise")).toBeNull();
  });

  it("空文字列も保存された値として扱う", () => {
    draft.set("basics", "ch1/l1", "exercise", "");
    expect(draft.get("basics", "ch1/l1", "exercise")).toBe("");
  });
});

describe("theme", () => {
  it("保存した値を読み戻し、html 要素に反映する", () => {
    theme.set("light");
    expect(theme.get()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("不正な値が入っていたら OS の設定にフォールバックする", () => {
    localStorage.setItem("pylab.theme.v1", "rainbow");
    expect(["dark", "light"]).toContain(theme.get());
  });
});
