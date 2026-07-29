/* ============================================================
   Python の出力を、テキストと図に切り分ける
   ------------------------------------------------------------
   ワーカーは図を「目印 + base64」の 1 行として送ってくる。
   表示コンポーネントから切り離しておき、単体で検証できるようにしている。
   ============================================================ */

import { IMAGE_MARKER } from "./protocol";

export type OutputSegment =
  | { kind: "text"; value: string }
  | { kind: "image"; value: string };

export function splitOutputSegments(text: string): OutputSegment[] {
  const segments: OutputSegment[] = [];
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
