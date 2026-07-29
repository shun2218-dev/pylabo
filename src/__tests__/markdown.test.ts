import { describe, expect, it } from "vitest";

import { renderMarkdown, renderMarkdownInline } from "../lib/markdown";

/* 本文は Prose の dangerouslySetInnerHTML に流れ込むため、
   「生 HTML が通らないこと」はここで担保する。 */
describe("renderMarkdown の安全性", () => {
  it("script タグはそのまま出力されない", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("img タグは要素として出力されず、文字としてエスケープされる", () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("javascript: のリンクは href として出力されない", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain('href="javascript:');
  });

  it("インライン描画でも生 HTML は無効化される", () => {
    expect(renderMarkdownInline("<b>x</b>")).not.toContain("<b>x</b>");
  });
});

describe("renderMarkdown の外部リンク", () => {
  it("外部リンクは新しいタブで開き、rel が付く", () => {
    const html = renderMarkdown("[docs](https://docs.python.org/ja/3/)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("相対リンクには target を付けない", () => {
    const html = renderMarkdown("[中](./other)");
    expect(html).not.toContain('target="_blank"');
  });
});

describe("renderMarkdown の記法", () => {
  it("~~~ で囲んだブロックもコードとして扱う", () => {
    const html = renderMarkdown("~~~\nprint(1)\n~~~");
    expect(html).toContain("<pre>");
    expect(html).toContain("<code");
  });

  it("表を描画できる", () => {
    const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
  });

  it("コードは Python として色づけされる", () => {
    expect(renderMarkdown("~~~\ndef f():\n    pass\n~~~")).toContain("hljs-keyword");
  });

  it("空の入力でも落ちない", () => {
    expect(renderMarkdown("")).toBe("");
  });
});
