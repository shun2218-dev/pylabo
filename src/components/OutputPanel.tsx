import { Fragment, useMemo } from "react";

import { splitOutputSegments } from "../lib/output";

interface Props {
  /** print された内容（図の行を含む） */
  text: string;
  error: string | null;
  /** 実行後なら、出力が空でも「出力はありません」と出す */
  hasRun: boolean;
}

export function OutputPanel({ text, error, hasRun }: Props) {
  const segments = useMemo(() => splitOutputSegments(text), [text]);

  if (!hasRun && segments.length === 0 && !error) return null;

  const isEmpty = segments.length === 0 && !error;

  return (
    <pre className="output">
      {segments.map((segment, i) =>
        segment.kind === "image" ? (
          <img
            key={i}
            className="output__image"
            src={`data:image/png;base64,${segment.value}`}
            alt="グラフ"
          />
        ) : (
          <Fragment key={i}>{segment.value + "\n"}</Fragment>
        )
      )}

      {error && <span className="output__error">{error}</span>}
      {isEmpty && <span className="output__hint">（出力はありませんでした）</span>}
    </pre>
  );
}
