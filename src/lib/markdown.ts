/* ============================================================
   レッスン本文の Markdown レンダリング
   markdown-it + highlight.js（必要な言語だけ登録）
   ============================================================ */

import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";

hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  highlight(code: string, lang: string): string {
    const language = lang && hljs.getLanguage(lang) ? lang : "python";
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      return escapeHtml(code);
    }
  },
});

/* 外部リンクは新しいタブで開く。
   Renderer / Token の型は markdown-it から直接 import できないため、
   ルール自体の型から取り出して引数に文脈型を効かせる。 */
type LinkOpenRule = NonNullable<MarkdownIt["renderer"]["rules"]["link_open"]>;

const defaultLinkOpen: LinkOpenRule =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

const linkOpen: LinkOpenRule = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") ?? "";
  if (/^https?:/.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

md.renderer.rules.link_open = linkOpen;

export const renderMarkdown = (source: string): string => md.render(source ?? "");

export const renderMarkdownInline = (source: string): string =>
  md.renderInline(source ?? "");
