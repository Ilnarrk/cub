import type { SolvedResponse, ValidationResponse } from '@shared/types/api';

type Command = { type: 'initialize' | 'random' } | { type: 'validate' | 'solve'; facelets: string };
type WorkerResponse = { id: number; type: 'ok'; value?: unknown } | { id: number; type: 'error'; message: string };
type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };

class LocalSolver {
  private worker: Worker | null = null;
  private sequence = 0;
  private ready = false;
  private initPromise: Promise<void> | null = null;
  private pending = new Map<number, Pending>();

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const pending = this.pending.get(data.id);
      if (!pending) return;
      this.pending.delete(data.id);
      if (data.type === 'error') pending.reject(new Error(data.message)); else pending.resolve(data.value);
    };
    return this.worker;
  }

  private request<T>(command: Command): Promise<T> {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.ensureWorker().postMessage({ ...command, id });
    });
  }

  initialize(): Promise<void> {
    if (this.ready) return Promise.resolve();
    if (!this.initPromise) this.initPromise = this.request<void>({ type: 'initialize' }).then(() => { this.ready = true; });
    return this.initPromise;
  }

  validate(facelets: string): Promise<ValidationResponse> { return this.request({ type: 'validate', facelets }); }
  async solve(facelets: string): Promise<SolvedResponse> { await this.initialize(); return this.request({ type: 'solve', facelets }); }
  randomState(): Promise<string> { return this.request({ type: 'random' }); }

  cancel(): void {
    this.worker?.terminate();
    this.worker = null; this.ready = false; this.initPromise = null;
    for (const pending of this.pending.values()) pending.reject(new Error('Расчёт отменён.'));
    this.pending.clear();
  }
}

export const localSolver = new LocalSolver();
