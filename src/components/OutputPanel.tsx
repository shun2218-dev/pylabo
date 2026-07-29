import { Fragment, useMemo } from "react";

import { IMAGE_MARKER } from "../lib/protocol";

interface Props {
  /** print された内容（図の行を含む） */
  text: string;
  error: string | null;
  /** 実行後なら、出力が空でも「出力はありません」と出す */
  hasRun: boolean;
}

export type Segment =
  | { kind: "text"; value: string }
  | { kind: "image"; value: string };

/** stdout を、テキストと図に切り分ける。 */
export function splitOutputSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    segments.push({ kind: "text", value: buffer.join("\n") });
    buffer = [];
  };

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (line.startsWith(IMAGE_MARKER)) {
      flush();
      segments.push({ kind: "image", value: line.slice(IMAGE_MARKER.length) });
      return;
    }
    // 末尾の空行は捨てる
    if (i === lines.length - 1 && line === "") return;
    buffer.push(line);
  });

  flush();
  return segments;
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
