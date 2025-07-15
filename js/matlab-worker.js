// ─────────────────────────────────────────────────────────────
// Web Worker that owns the RunMat WASM runtime. Running MATLAB
// execution in a worker (rather than the main thread) is not
// optional — verified by testing that RunMat's executeRequest()
// blocks synchronously with no yield back to the event loop, so a
// student's `while true; end` would freeze the entire tab if this
// ran on the main thread. A worker can be hard-killed from the
// main thread via Worker.terminate() when a run overruns its
// timeout; nothing short of that reliably recovers from it.
//
// PLOTTING — the call sequence here (createPlotSurface(canvas) once, then
// presentFigureOnSurface(surfaceId, handle) per run) matches RunMat's own
// documented "advanced hosts" pattern for multi-canvas setups (see
// https://github.com/runmat-org/runmat, docs/wasm/index.md) — confirmed
// directly against the published TypeScript bindings source, not guessed.
// What CANNOT be confirmed without a real browser (no GPU/canvas available
// in the environment this was built in): whether the WebGPU surface
// actually paints pixels onto the transferred canvas. What CAN be, and
// was, confirmed directly (headless, via Deno + its real WebGPU/wgpu
// backend, against the actual published runmat@0.6.1 WASM build):
//   - createPlotSurface() strictly requires a real HTMLCanvasElement or
//     OffscreenCanvas argument (throws "Expected an HTMLCanvasElement or
//     OffscreenCanvas" otherwise) — the OffscreenCanvas this worker passes
//     is the right shape.
//   - RunMat exposes `plotRendererReady()` and `session.gpuStatus()` as
//     genuine diagnostics (requested/active/error fields) — previously
//     unused here. A GPU/WebGPU failure on the student's end (unsupported
//     browser, blocked GPU, etc.) is a real, expected failure mode, not a
//     bug in this code — so instead of silently doing nothing, this
//     worker now reports both back on `canvasBound` (and folds gpuStatus's
//     error into `workerError` on an outright bind failure) so the caller
//     can tell the student *why* plotting isn't available instead of just
//     showing empty output.
//   - FOUND AND FIXED A REAL BUG (confirmed headless, no canvas needed):
//     `currentFigureHandle()` is NOT a valid "did this run plot something"
//     signal. It returns a stable/reused handle (e.g. `1`) that's already
//     non-null even before any plot() has ever been called, and stays the
//     same across runs — so the previous before/after handle-comparison
//     here always read "unchanged" and `presentFigureOnSurface` was never
//     actually invoked, even though the plot succeeded internally. Fixed
//     by using `executeRequest`'s own `figuresTouched` array instead
//     (documented in docs/wasm/index.md's Results table) — verified
//     directly it's genuinely per-run: `[]` when nothing was plotted,
//     `[1]`/`[1,2]` listing the real handle(s) touched by that run.
//
// Message protocol (all messages carry the request's `id` back):
//   in:  { id, type: 'preload', cacheBust? }
//   in:  { id, type: 'run', code, cacheBust? }
//   in:  { id, type: 'memoryUsage' }
//   in:  { id, type: 'bindCanvas', canvas }             — canvas is an
//                                                          OffscreenCanvas,
//                                                          transferred
//   out: { id, type: 'progress', stage, loaded?, total? } — during load;
//                                                         loaded/total (bytes)
//                                                         are only present
//                                                         while stage is
//                                                         'downloading' AND
//                                                         the server sent a
//                                                         Content-Length —
//                                                         callers should
//                                                         treat them as
//                                                         optional
//   out: { id, type: 'loaded' }                        — preload done
//   out: { id, type: 'result', stdout, error, plotted } — run done (error =
//                                                         the STUDENT's code
//                                                         failed; normal/
//                                                         expected. plotted =
//                                                         true if a figure was
//                                                         rendered to the
//                                                         bound canvas)
//   out: { id, type: 'memoryUsage', usage }
//   out: { id, type: 'canvasBound', rendererReady, gpuStatus } — rendererReady
//                                                         (bool) and gpuStatus
//                                                         ({requested,active,
//                                                         error?}) let the
//                                                         caller warn the
//                                                         student up front if
//                                                         plotting won't work
//                                                         in their browser
//   out: { id, type: 'workerError', message }          — the RUNTIME itself is
//                                                         broken (load failure or
//                                                         an unexpected exception);
//                                                         the caller should offer
//                                                         a full reload, not just
//                                                         show this as feedback.
// ─────────────────────────────────────────────────────────────

const RUNMAT_VERSION = '0.6.1';
const BASE = `https://cdn.jsdelivr.net/npm/runmat@${RUNMAT_VERSION}/dist/pkg-web`;
const WASM_URL = `${BASE}/runmat_wasm_web_bg.wasm`;
const WASM_CACHE_NAME = `runmat-wasm-${RUNMAT_VERSION}`;

let sessionPromise = null;
let modRef = null;       // wasm module namespace — holds the free plotting functions
let plotSurfaceId = null;

function withCacheBust(url, cacheBust) {
  return cacheBust ? `${url}?cb=${encodeURIComponent(cacheBust)}` : url;
}

// The ~15 MB .wasm binary is the actual "download" students perceive.
//
// FIRST ATTEMPT AT PERSISTENT CACHING WAS A REGRESSION — caught by the user
// noticing the load went from "very quick" to "minutes". Root cause: it
// AWAITED `cache.put()` (a full extra disk write of the whole 15 MB body)
// BEFORE returning the response for compiling, which serializes
// fetch-time + cache-write-time + compile-time back to back. The original
// (fast) path passed a bare URL to wasm-bindgen and let it call
// `WebAssembly.instantiateStreaming(fetch(url))` directly — compiling
// WHILE the bytes are still arriving, which is what actually made it feel
// instant. Fixed by never blocking the compile path on the cache write:
// on a cache hit, return the cached Response immediately (skips network
// entirely — this is the fast path for a second page load); on a miss,
// return the live streaming fetch Response right away for compiling, and
// separately `.clone()` it into CacheStorage WITHOUT awaiting that write
// (a stream tee, not a re-fetch — both consumers drain the same network
// response concurrently, so caching adds no serial delay to the first load).
//
// PROGRESS: wasm-bindgen's own fetch path gives no visibility into bytes
// transferred, so a real percentage requires reading the stream ourselves.
// `wrapWithProgress` uses a passthrough TransformStream that counts bytes
// as they flow past and reports them, then hands the (still-streaming,
// unmodified) result to instantiateStreaming — this preserves the
// streaming-compile speed while adding a genuine byte-level progress
// callback, not a fake/simulated one.
function wrapWithProgress(response, onBytes) {
  const total = Number(response.headers.get('content-length')) || 0;
  if (!onBytes || !response.body || !total) return response;
  let loaded = 0;
  const progress = new TransformStream({
    transform(chunk, controller) {
      loaded += chunk.byteLength;
      onBytes(loaded, total);
      controller.enqueue(chunk);
    },
  });
  return new Response(response.body.pipeThrough(progress), { headers: response.headers });
}

// Falls back to a plain (unwrapped, uncached) fetch if CacheStorage isn't
// available (e.g. private browsing) — the runtime still works, just
// without persistence across page loads.
async function getWasmResponse(cacheBust, onBytes) {
  if (!cacheBust) {
    try {
      const cache = await caches.open(WASM_CACHE_NAME);
      const cached = await cache.match(WASM_URL);
      if (cached) return cached; // second-load fast path — no network at all
    } catch { /* CacheStorage unavailable — fall through to network */ }
  }

  const url = cacheBust ? withCacheBust(WASM_URL, cacheBust) : WASM_URL;
  const response = await fetch(url);

  try {
    const cache = await caches.open(WASM_CACHE_NAME);
    // Deliberately not awaited — see header comment above. Caches under the
    // STABLE key even for a forceFresh reload, so the next normal load picks
    // up the freshly-redownloaded copy instead of a stale cached one.
    cache.put(WASM_URL, response.clone()).catch(() => {});
  } catch { /* best-effort; compiling still proceeds from `response` below */ }

  return wrapWithProgress(response, onBytes);
}

function loadSession(onProgress, cacheBust) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      onProgress('downloading');
      const jsUrl = withCacheBust(`${BASE}/runmat_wasm_web.js`, cacheBust);
      const mod = await import(/* webpackIgnore: true */ jsUrl);
      const wasmResponse = await getWasmResponse(cacheBust, (loaded, total) => {
        onProgress('downloading', { loaded, total });
      });
      await mod.default({ module_or_path: wasmResponse });
      modRef = mod;
      onProgress('initializing');
      const session = await mod.initRunMat({});
      if (typeof session.setLanguageCompat === 'function') {
        session.setLanguageCompat('matlab');
      }
      onProgress('ready');
      return session;
    })();
    // If loading fails, forget the cached (rejected) promise so a later retry
    // actually re-fetches instead of silently replaying the same failure —
    // without this, a worker that failed to load once could never succeed,
    // even after a transient network blip.
    sessionPromise.catch(() => { sessionPromise = null; modRef = null; });
  }
  return sessionPromise;
}

self.onmessage = async (e) => {
  const { id, type, code, cacheBust, canvas } = e.data;
  try {
    if (type === 'preload') {
      await loadSession((stage, detail) => self.postMessage({ id, type: 'progress', stage, ...(detail || {}) }), cacheBust);
      self.postMessage({ id, type: 'loaded' });
      return;
    }

    if (type === 'bindCanvas') {
      let session;
      try {
        session = await loadSession((stage, detail) => self.postMessage({ id, type: 'progress', stage, ...(detail || {}) }), cacheBust);
      } catch (err) {
        self.postMessage({ id, type: 'workerError', message: `MATLAB runtime failed to load: ${String((err && err.message) || err)}` });
        return;
      }
      try {
        // Re-binding within the same worker (e.g. revisiting the sandbox without a
        // full runtime reload) would otherwise leak the previous GPU surface.
        if (plotSurfaceId !== null && typeof modRef.destroyPlotSurface === 'function') {
          try { modRef.destroyPlotSurface(plotSurfaceId); } catch { /* best-effort cleanup */ }
        }
        plotSurfaceId = await modRef.createPlotSurface(canvas);
        const rendererReady = typeof modRef.plotRendererReady === 'function' ? modRef.plotRendererReady() : true;
        let gpuStatus = null;
        try { gpuStatus = typeof session.gpuStatus === 'function' ? session.gpuStatus() : null; } catch { /* best-effort */ }
        self.postMessage({ id, type: 'canvasBound', rendererReady, gpuStatus });
      } catch (err) {
        plotSurfaceId = null;
        let gpuStatus = null;
        try { gpuStatus = typeof session.gpuStatus === 'function' ? session.gpuStatus() : null; } catch { /* best-effort */ }
        const gpuNote = gpuStatus && gpuStatus.error ? ` (GPU: ${gpuStatus.error})` : '';
        self.postMessage({ id, type: 'workerError', message: `Could not set up the plot canvas: ${String((err && err.message) || err)}${gpuNote}` });
      }
      return;
    }

    if (type === 'run') {
      let session;
      try {
        session = await loadSession((stage, detail) => self.postMessage({ id, type: 'progress', stage, ...(detail || {}) }), cacheBust);
      } catch (loadErr) {
        self.postMessage({ id, type: 'workerError', message: `MATLAB runtime failed to load: ${String((loadErr && loadErr.message) || loadErr)}` });
        return;
      }
      session.clearWorkspace();
      if (typeof modRef.resetPlotState === 'function') {
        try { modRef.resetPlotState(); } catch { /* best-effort; don't fail the run over this */ }
      }

      const result = await session.executeRequest({
        source: { kind: 'text', name: '<sandbox>', text: code },
      });
      const stdout = (result.stdout || []).map(evt => evt.text).join('');
      const error = result.error
        ? { message: result.error.message, identifier: result.error.identifier, diagnostic: result.error.diagnostic }
        : null;

      // currentFigureHandle() is NOT a reliable "did this run plot anything"
      // signal — verified directly: it returns a stable handle (e.g. 1) that
      // RunMat reuses across runs, even before any plot() has ever been called,
      // so a before/after handle comparison always reads "unchanged" and never
      // detects a real plot. `figuresTouched` on the execution result is the
      // actual per-run signal (confirmed: [] when nothing was plotted, [1] or
      // [1,2,...] listing the real handles touched by this specific run).
      let plotted = false;
      if (plotSurfaceId !== null && !error && Array.isArray(result.figuresTouched) && result.figuresTouched.length) {
        try {
          const handle = result.figuresTouched[result.figuresTouched.length - 1];
          modRef.presentFigureOnSurface(plotSurfaceId, handle);
          plotted = true;
        } catch (plotErr) {
          // A plotting failure shouldn't take down an otherwise-successful run —
          // surface it as a console warning only, keep the text result intact.
          console.warn('[matlab-worker] figure render failed:', plotErr);
        }
      }

      // Included so callers can grade on actual variable *values*, not just
      // printed text — comparing stdout alone can't tell "x = 42;" apart from
      // "x = 41;" since both suppress output identically. Verified this gap
      // directly: a naive stdout-only comparison marked a wrong-value answer
      // as correct. previewToken inside each value is a random per-call id,
      // not part of the actual state — callers must ignore it when comparing.
      let workspace = null;
      try {
        workspace = typeof session.workspaceSnapshot === 'function' ? await session.workspaceSnapshot() : null;
      } catch { /* best-effort; grading falls back to stdout-only comparison */ }

      self.postMessage({ id, type: 'result', stdout, error, plotted, workspace });
      return;
    }

    if (type === 'memoryUsage') {
      if (!sessionPromise) { self.postMessage({ id, type: 'memoryUsage', usage: null }); return; }
      const session = await sessionPromise;
      const usage = typeof session.memoryUsage === 'function' ? session.memoryUsage() : null;
      self.postMessage({ id, type: 'memoryUsage', usage });
      return;
    }
  } catch (err) {
    // Anything unexpected outside the normal "student code failed" path
    // (e.g. a WASM-level panic) is treated as an infrastructure failure.
    self.postMessage({ id, type: 'workerError', message: String((err && err.message) || err) });
  }
};
