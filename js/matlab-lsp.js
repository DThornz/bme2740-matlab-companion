// ─────────────────────────────────────────────────────────────
// Main-thread API for MATLAB autocomplete/hover, backed by a
// dedicated Web Worker (js/matlab-lsp-worker.js) that owns RunMat's
// LSP WASM module — deliberately separate from js/matlab-runtime.js
// (which runs code), so a slow/hung execution never blocks
// completions, and so this ~47 MB download only happens for
// students who explicitly turn autocomplete on.
// ─────────────────────────────────────────────────────────────

const WORKER_URL = new URL('./matlab-lsp-worker.js', import.meta.url);

let worker = null;
let loaded = false;
let msgIdCounter = 0;
let pendingLoad = null;

function ensureWorker() {
  if (!worker) worker = new Worker(WORKER_URL, { type: 'module' });
  return worker;
}

function nextId() {
  return ++msgIdCounter;
}

export function isMatlabLspLoaded() {
  return loaded;
}

export function resetMatlabLsp() {
  if (worker) { worker.terminate(); worker = null; }
  loaded = false;
  pendingLoad = null;
}

/**
 * @param {(stage: string) => void} [onProgress] 'downloading' | 'initializing' | 'ready'
 */
export function loadMatlabLsp(onProgress) {
  if (loaded) return Promise.resolve();
  if (pendingLoad) return pendingLoad;

  const w = ensureWorker();
  const id = nextId();
  pendingLoad = new Promise((resolve, reject) => {
    function handler(e) {
      if (e.data.id !== id) return;
      if (e.data.type === 'progress') { onProgress?.(e.data.stage); return; }
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
        reject(new Error(e.data.message));
      }
    }
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'preload' });
  });
  return pendingLoad;
}

/**
 * Returns LSP-shaped completion items: [{ label, kind, detail, documentation }, ...]
 * `line`/`character` are 0-indexed, matching standard LSP position convention
 * (not the 1-indexed convention MATLAB itself uses for array indexing —
 * these are source-text positions, unrelated).
 */
export async function getMatlabCompletions(text, line, character) {
  if (!loaded) await loadMatlabLsp();
  const w = worker;
  const id = nextId();
  return new Promise((resolve, reject) => {
    function handler(e) {
      if (e.data.id !== id) return;
      w.removeEventListener('message', handler);
      if (e.data.type === 'completion') { resolve(e.data.items || []); return; }
      if (e.data.type === 'workerError') reject(new Error(e.data.message));
    }
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'completion', text, line, character });
  });
}

/** Returns the hover markdown string, or null if there's nothing to show. */
export async function getMatlabHover(text, line, character) {
  if (!loaded) await loadMatlabLsp();
  const w = worker;
  const id = nextId();
  return new Promise((resolve, reject) => {
    function handler(e) {
      if (e.data.id !== id) return;
      w.removeEventListener('message', handler);
      if (e.data.type === 'hover') { resolve(e.data.contents?.value ?? null); return; }
      if (e.data.type === 'workerError') reject(new Error(e.data.message));
    }
    w.addEventListener('message', handler);
    w.postMessage({ id, type: 'hover', text, line, character });
  });
}
