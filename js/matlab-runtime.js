// ─────────────────────────────────────────────────────────────
// Main-thread API for MATLAB code execution, backed by a Web Worker
// (js/matlab-worker.js) that owns the RunMat WASM runtime. Used by
// both the MATLAB Sandbox (js/sandbox.js) and, when a student opts
// in, live grading of code-entry quiz questions (js/views.js).
//
// Loaded entirely from a public CDN at runtime; nothing is bundled
// into this repo and nothing here requires a server of ours. The
// ~15 MB (compressed) WASM module is only fetched the first time
// it's actually needed, not on page load — see ensureWorker().
//
// WHY A WORKER (not optional — see js/matlab-worker.js header):
// RunMat's executeRequest() blocks the calling thread synchronously
// with no yield back to the event loop while a script runs. Verified
// directly: a `while true; end` submitted on the main thread hangs
// forever with no way for a JS-level timeout to recover, because the
// timer callback never gets a chance to fire. Running in a worker
// lets the main thread hard-kill a runaway run via Worker.terminate()
// — the only mechanism that reliably works here.
//
// RECOVERY: if the runtime gets into a bad state (a corrupted cached
// download, a WASM-level panic, a stuck load), call
// resetMatlabRuntime({ forceFresh: true }) — this terminates the
// current worker, spawns a fresh one, and cache-busts the CDN URLs so
// a corrupted cached response can't be replayed.
//
// KNOWN GAPS vs. real MATLAB (verified by hand — see README "MATLAB
// Sandbox" section for the full list and how they were found). A broad
// battery of ~60 functions/constructs across arrays, strings, structs,
// linear algebra, control flow, and numerical methods (fzero, fminbnd,
// ode45, polyfit, trapz, ...) was run against this build and passed —
// these are the specific exceptions found, not a sign of broad breakage:
//   - `s.field = value` on an undefined `s` does NOT auto-create a
//     struct (real MATLAB does). Undefined-variable error instead.
//     WORKAROUND (verified working): write `s = struct();` first.
//   - On a failed assignment (e.g. `z = x + y` where sizes don't
//     match), the target variable is left set to 0 and echoed
//     ("z = 0") alongside the error, instead of staying undefined
//     with no echo (real MATLAB's behavior).
//   - Element-wise power inside an anonymous function applied to a
//     range failed in testing (`f = @(x) x.^2 + 1; f(1:5)` errored
//     with "Slicing only supported on tensors") — avoid recommending
//     anonymous-function-over-a-vector patterns until this is
//     re-verified against a newer RunMat release.
//   - `switch`/`case` with a cell-array case value for OR-matching
//     multiple cases at once (`case {'a','b'}`, valid real MATLAB)
//     errors instead ("cannot convert Cell ... to f64"). Use separate
//     `case` lines or an `if`/`elseif` with `||` instead.
//   - `fminsearch` is entirely undefined in this build ("Undefined
//     function: fminsearch") despite being a real MATLAB function —
//     `fzero` and `fminbnd` were both verified working correctly.
// Treat this as a best-effort MATLAB-syntax sandbox for practice,
// not a certified MATLAB replacement — see the in-page disclaimer.
// ─────────────────────────────────────────────────────────────

const WORKER_URL = new URL('./matlab-worker.js', import.meta.url);

let worker = null;
let loaded = false;
let msgIdCounter = 0;
let pendingLoad = null;

function spawnWorker() {
  worker = new Worker(WORKER_URL, { type: 'module' });
  loaded = false;
}

// Spawned lazily (not at module load) so simply importing this module
// doesn't itself start a worker for visitors who never use it.
function ensureWorker() {
  if (!worker) spawnWorker();
  return worker;
}

function nextId() {
  return ++msgIdCounter;
}

export function isMatlabRuntimeLoaded() {
  return loaded;
}

/**
 * Fully resets the runtime: terminates the current worker (aborting
 * anything in flight) and spawns a fresh one. The next load/run call
 * will transparently re-fetch and re-initialize. Use this as the
 * "redownload" recovery action when something looks broken.
 *
 * @param {{forceFresh?: boolean}} [options] forceFresh cache-busts the
 *   CDN URLs on the next load, in case a corrupted cached response is
 *   the actual problem (not just in-memory state).
 */
export function resetMatlabRuntime({ forceFresh = false } = {}) {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  loaded = false;
  pendingLoad = null;
  nextCacheBust = forceFresh ? `${Date.now()}-${Math.random().toString(36).slice(2)}` : null;
}

let nextCacheBust = null;

/**
 * Loads the WASM runtime inside the worker. Safe to call repeatedly —
 * the actual load only happens once per worker instance.
 * @param {(stage: string, detail?: {loaded: number, total: number}) => void} [onProgress]
 *   stage is 'downloading' | 'initializing' | 'ready'. detail carries real
 *   byte counts (from the .wasm download only) and is only passed while
 *   stage is 'downloading' — omitted entirely once the server doesn't send
 *   a Content-Length, or during 'initializing'/'ready'.
 */
export function loadMatlabRuntime(onProgress) {
  if (loaded) return Promise.resolve();
  if (pendingLoad) return pendingLoad;

  const w = ensureWorker();
  const id = nextId();
  const cacheBust = nextCacheBust;
  nextCacheBust = null;

  pendingLoad = new Promise((resolve, reject) => {
    function handler(e) {
      if (e.data.id !== id) return;
      if (e.data.type === 'progress') {
        onProgress?.(e.data.stage, e.data.loaded != null ? { loaded: e.data.loaded, total: e.data.total } : undefined);
        return;
      }
      if (e.data.type === 'loaded') {
        w.removeEventListener('message', handler);
        loaded = true;
        pendingLoad = null;
        resolve();
        return;
      }
      if (e.data.type === 'workerError') {
        w.removeEventListener('message', handler);
        pendingLoad = null;
        const err = new Error(e.data.message);
        err.isInfraError = true;
        reject(err);
      }
    }
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'preload', cacheBust });
  });
  return pendingLoad;
}

/**
 * Runs one snippet of MATLAB code and returns
 * { stdout, error, plotted, workspace, executionTimeMs }.
 * `executionTimeMs` is RunMat's own interpreter-side timing (not measured
 * here), so it reflects actual run time, not worker/postMessage overhead —
 * null if the runtime build doesn't report it.
 * `error` here means the STUDENT's code failed (syntax/runtime error) —
 * that's a normal, expected outcome and is not thrown. If the runtime
 * infrastructure itself fails (fails to load, WASM panic), this instead
 * throws an Error with `.isInfraError = true` — callers should catch
 * that specifically and offer resetMatlabRuntime() as recovery.
 *
 * Each call clears the worker's workspace first, so runs are isolated
 * from one another (verified directly: a variable set in one run does
 * not exist in the next). If the run exceeds `timeoutMs`, the worker is
 * hard-terminated and replaced — the only way to actually recover from
 * a runaway/infinite loop — and a timeout error is returned (not thrown
 * — a timeout is a normal, recoverable outcome, not an infra failure).
 * The next call after a timeout transparently reloads the runtime in
 * the fresh worker before running.
 */
export async function runMatlabCode(code, { timeoutMs = 8000 } = {}) {
  if (!loaded) {
    await loadMatlabRuntime();
  }

  const id = nextId();
  const activeWorker = worker;

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      activeWorker.removeEventListener('message', handler);
      activeWorker.terminate();
      if (worker === activeWorker) spawnWorker(); // fresh worker; next call reloads transparently
      resolve({
        stdout: '',
        error: {
          message: `Execution took longer than ${timeoutMs / 1000}s and was stopped. The sandbox has been reset.`,
          identifier: 'Sandbox:Timeout',
          diagnostic: null,
        },
      });
    }, timeoutMs);

    function handler(e) {
      if (e.data.id !== id || settled) return;
      if (e.data.type === 'result') {
        settled = true;
        clearTimeout(timer);
        activeWorker.removeEventListener('message', handler);
        resolve({
          stdout: e.data.stdout,
          error: e.data.error,
          plotted: !!e.data.plotted,
          workspace: e.data.workspace ?? null,
          executionTimeMs: typeof e.data.executionTimeMs === 'number' ? e.data.executionTimeMs : null,
        });
      } else if (e.data.type === 'workerError') {
        settled = true;
        clearTimeout(timer);
        activeWorker.removeEventListener('message', handler);
        const err = new Error(e.data.message);
        err.isInfraError = true;
        reject(err);
      }
    }
    activeWorker.addEventListener('message', handler);
    activeWorker.postMessage({ id, type: 'run', code });
  });
}

/**
 * Best-effort memory usage snapshot from the running session, or null if
 * nothing is loaded yet or the running RunMat build doesn't expose it.
 * Shape is whatever RunMat's session.memoryUsage() returns — treat as
 * informational only.
 */
export async function getMatlabMemoryUsage() {
  if (!loaded || !worker) return null;
  const w = worker;
  const id = nextId();
  return new Promise((resolve) => {
    function handler(e) {
      if (e.data.id !== id) return;
      w.removeEventListener('message', handler);
      resolve(e.data.usage ?? null);
    }
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'memoryUsage' });
  });
}

/**
 * Compares two workspace snapshots (from runMatlabCode's `.workspace`) for
 * equality, ignoring `previewToken` (a random id assigned per snapshot call,
 * not part of the actual variable state — comparing it directly would make
 * every comparison fail even when nothing actually differs). Used to grade
 * code-entry answers on actual variable values, not just printed output —
 * see the note in matlab-worker.js for why stdout alone isn't enough.
 */
export function workspacesEqual(a, b) {
  const normalize = (snap) => {
    if (!snap || !Array.isArray(snap.values)) return [];
    return snap.values
      .map(v => ({ name: v.name, className: v.className, shape: v.shape, preview: v.preview?.values ?? null }))
      .sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
  };
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/**
 * Hands rendering control of a <canvas> element to the worker so figures
 * from plot()/etc. can be drawn there. The call sequence used on the worker
 * side (createPlotSurface + presentFigureOnSurface) was confirmed to match
 * RunMat's own documented usage pattern — see js/matlab-worker.js's header
 * comment — but whether the WebGPU surface actually paints pixels in a
 * given browser can't be confirmed without one, so this reports real
 * diagnostics instead of a bare boolean:
 *
 * Resolves to { bound, rendererReady, gpuStatus, reason? }:
 *   - bound: whether a plot surface was successfully created at all.
 *   - rendererReady: RunMat's own plotRendererReady() check — can be false
 *     even when bound is true (e.g. WebGPU requested but not active).
 *   - gpuStatus: RunMat's session.gpuStatus() ({requested, active, error?}),
 *     or null if unavailable — surface gpuStatus.error to the student when
 *     rendererReady is false so "plotting didn't work" has a concrete reason
 *     instead of just silently producing no figure.
 *   - reason: set (with bound:false) only when this browser doesn't support
 *     transferring canvas control to a worker at all (OffscreenCanvas).
 *
 * Must be called after loadMatlabRuntime() resolves, and can only be
 * called once per <canvas> element — a canvas's control can only be
 * transferred to a worker a single time. Call again with a *different*
 * (freshly rendered) canvas element if the sandbox view is re-rendered.
 */
export async function bindPlotCanvas(canvasEl) {
  if (typeof canvasEl.transferControlToOffscreen !== 'function') {
    return { bound: false, rendererReady: false, gpuStatus: null, reason: 'This browser does not support handing canvas control to a background worker (OffscreenCanvas), which plotting here relies on.' };
  }
  if (!loaded) await loadMatlabRuntime();

  const w = worker;
  const offscreen = canvasEl.transferControlToOffscreen();
  const id = nextId();

  return new Promise((resolve, reject) => {
    function handler(e) {
      if (e.data.id !== id) return;
      w.removeEventListener('message', handler);
      if (e.data.type === 'canvasBound') {
        resolve({ bound: true, rendererReady: e.data.rendererReady !== false, gpuStatus: e.data.gpuStatus ?? null });
        return;
      }
      if (e.data.type === 'workerError') {
        const err = new Error(e.data.message);
        err.isInfraError = true;
        reject(err);
      }
    }
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'bindCanvas', canvas: offscreen }, [offscreen]);
  });
}
