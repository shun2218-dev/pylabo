import { useCallback, useEffect, useRef, useState } from "react";

import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";
import { Prose } from "./Prose";
import {
  BookOpen,
  Check,
  CircleCheck,
  Lightbulb,
  Play,
  RotateCcw,
  Square,
  Terminal,
  X,
} from "../icons";
import { runner } from "../lib/runner";
import { draft } from "../lib/storage";
import type { CheckResult } from "../lib/protocol";

interface Props {
  caption: string;
  tag?: string;
  code: string;
  packages: string[];
  files: Record<string, string> | null;
  /** 読むだけのブロック（ブラウザで実行できないコードを載せるとき） */
  readOnly?: boolean;

  /** 採点用コード。渡すと「演習モード」になる */
  tests?: string;
  hint?: string;
  solution?: string;

  /** 書きかけコードの保存先（演習モードのみ） */
  draftKey?: { courseId: string; lessonKey: string; slot: string };
  onSolved?: () => void;
}

export function CodeBlock({
  caption,
  tag,
  code,
  packages,
  files,
  readOnly = false,
  tests,
  hint,
  solution,
  draftKey,
  onSolved,
}: Props) {
  const isExercise = Boolean(tests);

  const [value, setValue] = useState<string>(() => {
    if (isExercise && draftKey) {
      return draft.get(draftKey.courseId, draftKey.lessonKey, draftKey.slot) ?? code;
    }
    return code;
  });

  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [verdict, setVerdict] = useState<"ok" | "ng" | null>(null);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Python は一度に 1 つしか実行できないので、他が動いている間はボタンを止める
  const [runtimeBusy, setRuntimeBusy] = useState(false);
  useEffect(() => runner.onBusyChange(setRuntimeBusy), []);

  // 実行中も onRun が最新の値を読めるようにしておく
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      if (isExercise && draftKey) {
        draft.set(draftKey.courseId, draftKey.lessonKey, draftKey.slot, next);
      }
    },
    [isExercise, draftKey]
  );

  const run = useCallback(async () => {
    if (runner.busy) return;

    setRunning(true);
    setHasRun(true);
    setChecks([]);
    setVerdict(null);
    setError(null);

    let buffer = "";
    setOutput("");

    const result = await runner.run({
      code: valueRef.current,
      tests: tests ?? null,
      packages,
      files,
      onOutput: (text) => {
        buffer += text;
        setOutput(buffer);
      },
    });

    setError(result.error);
    setRunning(false);

    if (isExercise) {
      setChecks(result.checks);
      setVerdict(result.ok ? "ok" : "ng");
      if (result.ok) onSolved?.();
    }
  }, [tests, packages, files, isExercise, onSolved]);

  const reset = useCallback(() => {
    setValue(code);
    setOutput("");
    setError(null);
    setChecks([]);
    setVerdict(null);
    setHasRun(false);
    if (draftKey) draft.clear(draftKey.courseId, draftKey.lessonKey, draftKey.slot);
  }, [code, draftKey]);

  // 別のレッスンへ移ったら実行状態を持ち越さない
  useEffect(() => () => setRunning(false), []);

  if (readOnly) {
    return (
      <div className="block">
        <div className="block__head">
          <span className="block__caption">
            <BookOpen aria-hidden />
            {caption}
          </span>
          <span className="block__tag">読むだけ（ここでは実行しません）</span>
        </div>
        <CodeEditor value={code} readOnly />
      </div>
    );
  }

  return (
    <div className={`block${verdict === "ok" ? " block--solved" : ""}`}>
      <div className="block__head">
        <span className="block__caption">
          <Terminal aria-hidden />
          {caption}
        </span>
        {tag && <span className="block__tag">{tag}</span>}

        <div className="block__actions">
          {running ? (
            <button type="button" className="btn btn--ghost" onClick={() => runner.stop()}>
              <Square aria-hidden />
              停止
            </button>
          ) : (
            isExercise && (
              <button type="button" className="btn btn--ghost" onClick={reset}>
                <RotateCcw aria-hidden />
                最初に戻す
              </button>
            )
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={run}
            disabled={running || runtimeBusy}
            title={runtimeBusy && !running ? "ほかのコードの実行が終わるのを待っています" : undefined}
          >
            {isExercise ? <Check aria-hidden /> : <Play aria-hidden />}
            {running ? "実行中…" : isExercise ? "採点する" : "実行する"}
          </button>
        </div>
      </div>

      <CodeEditor value={value} onChange={handleChange} onRun={run} />

      <OutputPanel text={output} error={error} hasRun={hasRun && !running} />

      {checks.length > 0 && (
        <ul className="checks">
          {checks.map((check, i) => (
            <li key={i} className={check.pass ? "is-pass" : "is-fail"}>
              {check.pass ? <Check aria-hidden /> : <X aria-hidden />}
              <span>{check.message}</span>
            </li>
          ))}
        </ul>
      )}

      {verdict && (
        <div className={`verdict verdict--${verdict}`}>
          {verdict === "ok" ? <CircleCheck aria-hidden /> : <X aria-hidden />}
          {verdict === "ok"
            ? "クリアです。次のレッスンへ進みましょう。"
            : checks.length === 0
              ? "コードの実行でエラーが出ました。上のメッセージを読んでみましょう。"
              : "まだ条件を満たしていません。上のチェック項目を見直してみましょう。"}
        </div>
      )}

      {hint && (
        <details className="reveal">
          <summary>
            <Lightbulb aria-hidden />
            ヒントを見る
          </summary>
          <Prose className="reveal__body" source={hint} />
        </details>
      )}

      {solution && (
        <details className="reveal">
          <summary>
            <BookOpen aria-hidden />
            解答例を見る
          </summary>
          <Prose className="reveal__body" source={"```python\n" + solution + "\n```"} />
        </details>
      )}
    </div>
  );
}
