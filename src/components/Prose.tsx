import { useMemo } from "react";

import { renderMarkdown, renderMarkdownInline } from "../lib/markdown";

interface Props {
  source: string;
  inline?: boolean;
  className?: string;
}

/**
 * レッスン本文の Markdown を描画する。
 * 入力はアプリに同梱したコースデータだけなので、HTML を直接埋め込んでよい
 * （markdown-it は html: false で、コンテンツ側の生 HTML は無効化してある）。
 */
export function Prose({ source, inline = false, className }: Props) {
  const html = useMemo(
    () => (inline ? renderMarkdownInline(source) : renderMarkdown(source)),
    [source, inline]
  );

  return (
    <div
      className={["prose", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
