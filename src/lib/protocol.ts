/* ============================================================
   メインスレッド ⇄ Pyodide ワーカー のメッセージ定義
   ============================================================ */

export type RuntimeState = "idle" | "loading" | "ready" | "busy" | "error";

/** 図を送るときの目印。stdout の行頭に付けて送る。
 *  制御文字は Pyodide の stdout を通る間に失われることがあるため、
 *  ふつうの文字だけで作った、まず衝突しない文字列にしている。 */
export const IMAGE_MARKER = "%%PYLAB_IMAGE%%";

export interface CheckResult {
  pass: boolean;
  message: string;
}

/* ---------- メインスレッド → ワーカー ---------- */

export interface BootRequest {
  type: "boot";
}

export interface RunRequest {
  type: "run";
  id: number;
  code: string;
  tests: string | null;
  packages: string[];
  files: Record<string, string> | null;
}

export type WorkerRequest = BootRequest | RunRequest;

/* ---------- ワーカー → メインスレッド ---------- */

export interface StatusMessage {
  type: "status";
  state: RuntimeState;
  label: string;
}

export interface OutputMessage {
  type: "out";
  stream: "stdout" | "stderr";
  text: string;
}

export interface ResultMessage {
  type: "result";
  id: number;
  ok: boolean;
  checks: CheckResult[];
  error: string | null;
}

export type WorkerResponse = StatusMessage | OutputMessage | ResultMessage;
