import { describe, expect, it } from "vitest";

import { IMAGE_MARKER } from "../lib/protocol";
import { splitOutputSegments } from "../lib/output";

describe("splitOutputSegments", () => {
  it("ただのテキストは 1 かたまりになる", () => {
    expect(splitOutputSegments("hello\nworld\n")).toEqual([
      { kind: "text", value: "hello\nworld" },
    ]);
  });

  it("空文字列は何も返さない", () => {
    expect(splitOutputSegments("")).toEqual([]);
  });

  it("図の行を画像として切り出す", () => {
    const text = `before\n${IMAGE_MARKER}AAAA\nafter\n`;
    expect(splitOutputSegments(text)).toEqual([
      { kind: "text", value: "before" },
      { kind: "image", value: "AAAA" },
      { kind: "text", value: "after" },
    ]);
  });

  it("図が続いても順序を保つ", () => {
    const text = `${IMAGE_MARKER}A\n${IMAGE_MARKER}B\n`;
    expect(splitOutputSegments(text)).toEqual([
      { kind: "image", value: "A" },
      { kind: "image", value: "B" },
    ]);
  });

  it("行の途中にある目印は図として扱わない（ワーカーは必ず行頭に置く）", () => {
    const text = `x ${IMAGE_MARKER}AAAA\n`;
    expect(splitOutputSegments(text)).toEqual([
      { kind: "text", value: `x ${IMAGE_MARKER}AAAA` },
    ]);
  });
});
