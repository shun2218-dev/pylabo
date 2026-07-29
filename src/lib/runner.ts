/* ============================================================
   Python ランナー（メインスレッド側）
   ワーカーとのやりとりを 1 本の Promise にまとめる。
   ============================================================ */

import PyodideWorker from "./pyodide.worker?worker";
import type {
  CheckResult,
  ResultMessage,
  RuntimeState,
  WorkerResponse,
} from "./protocol";

export interface RunOptions {
  code: string;
  tests?: string | null;
  packages?: string[];
  files?: Record<string, string> | null;
  onOutput?: (text: string, stream: "stdout" | "stderr") => void;
}

export interface RunResult {
  ok: boolean;
  checks: CheckResult[];
  error: string | null;
}

type StatusListener = (state: RuntimeState, label: string) => void;
type BusyListener = (busy: boolean) => void;

class PythonRunner {
  private worker: Worker | null = null;
  private seq = 0;
  private pending: {
    id: number;
    resolve: (r: RunResult) => void;
    onOutput: NonNullable<RunOptions["onOutput"]>;
  } | null = null;

  private listeners = new Set<StatusListener>();
  private busyListeners = new Set<BusyListener>();

  state: RuntimeState = "idle";
  label = "Python 未起動";

  onStatus(fn: StatusListener): () => void {
    this.listeners.add(fn);
    fn(this.state, this.label);
    return () => this.listeners.delete(fn);
  }

  /** 実行中かどうかの変化を購読する。同時に 2 つ実行できないため UI 側で使う。 */
  onBusyChange(fn: BusyListener): () => void {
    this.busyListeners.add(fn);
    fn(this.busy);
    return () => this.busyListeners.delete(fn);
  }

  private emit(state: RuntimeState, label: string): void {
    this.state = state;
    this.label = label;
    this.listeners.forEach((fn) => fn(state, label));
  }

  private emitBusy(): void {
    this.busyListeners.forEach((fn) => fn(this.busy));
  }

  get busy(): boolean {
    return this.pending !== null;
  }

  /** ワーカーを起動する。レッスンを開いた時点で呼んで温めておく。 */
  start(): void {
    if (this.worker) return;
    this.worker = new PyodideWorker();
    this.worker.onmessage = (ev: MessageEvent<WorkerResponse>) => this.handle(ev.data);
    this.worker.onerror = () => this.emit("error", "ワーカーの起動に失敗しました");
    this.worker.postMessage({ type: "boot" });
    this.emit("loading", "Python を起動中…");
  }

  private handle(msg: WorkerResponse): void {
    switch (msg.type) {
      case "status":
        this.emit(msg.state, msg.label);
        break;
      case "out":
        this.pending?.onOutput(msg.text, msg.stream);
        break;
      case "result":
        this.settle(msg);
        break;
    }
  }

  private settle(msg: ResultMessage): void {
    if (!this.pending || this.pending.id !== msg.id) return;
    const { resolve } = this.pending;
    this.pending = null;
    this.emitBusy();
    resolve({ ok: msg.ok, checks: msg.checks, error: msg.error });
  }

  run({
    code,
    tests = null,
    packages = [],
    files = null,
    onOutput = () => {},
  }: RunOptions): Promise<RunResult> {
    this.start();

    if (this.pending) {
      return Promise.resolve({
        ok: false,
        checks: [],
        error: "別のコードを実行中です。終わるまで待つか「停止」してください。",
      });
    }

    const id = ++this.seq;
    return new Promise<RunResult>((resolve) => {
      this.pending = { id, resolve, onOutput };
      this.emitBusy();
      this.worker!.postMessage({ type: "run", id, code, tests, packages, files });
    });
  }

  /** 無限ループなどで固まったときの緊急停止。ワーカーを作り直す。 */
  stop(): void {
    if (!this.worker) return;
    this.worker.terminate();
    this.worker = null;

    if (this.pending) {
      const { resolve } = this.pending;
      this.pending = null;
      this.emitBusy();
      resolve({
        ok: false,
        checks: [],
        error: "実行を停止しました。（Python を起動し直しています）",
      });
    }

    this.emit("idle", "停止しました");
    this.start();
  }
}

export const runner = new PythonRunner();
