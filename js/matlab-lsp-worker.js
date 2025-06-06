// ─────────────────────────────────────────────────────────────
// Web Worker that owns RunMat's LSP (Language Server Protocol)
// WASM module — completions, hover docs, diagnostics. This is a
// SEPARATE worker from js/matlab-worker.js (which runs code)
// deliberately: LSP requests need to stay fast and responsive while
// the student types, and shouldn't ever queue behind a long-running
// (or hung) code execution in the other worker. It's also a
// separate, large (~47 MB uncompressed) download from the
// interpreter itself — kept behind its own explicit opt-in (the
// sandbox's "Enable autocomplete" toggle) rather than loaded
// whenever the interpreter is.
//
// Verified directly (via a standalone script, not in a real browser
// — see js/matlab-editor.js header for what that means here):
// completion() and hover() both return real, well-formed LSP-shaped
// results with markdown documentation pulled from RunMat's own
// builtin docs.
//
// Message protocol:
//   in:  { id, type: 'preload', cacheBust? }
//   in:  { id, type: 'completion', text, line, character }
//   in:  { id, type: 'hover', text, line, character }
//   out: { id, type: 'progress', stage }
//   out: { id, type: 'loaded' }
//   out: { id, type: 'completion', items }
//   out: { id, type: 'hover', contents }
//   out: { id, type: 'workerError', message }
// ─────────────────────────────────────────────────────────────

const RUNMAT_VERSION = '0.6.1';
const BASE = `https://cdn.jsdelivr.net/npm/runmat@${RUNMAT_VERSION}/dist/lsp`;
const URI = 'file:///sandbox.m';

let lspPromise = null;

function withCacheBust(url, cacheBust) {
  return cacheBust ? `${url}?cb=${encodeURIComponent(cacheBust)}` : url;
}

function loadLsp(onProgress, cacheBust) {
  if (!lspPromise) {
    lspPromise = (async () => {
      onProgress('downloading');
      const jsUrl = withCacheBust(`${BASE}/runmat_lsp.js`, cacheBust);
      const wasmUrl = withCacheBust(`${BASE}/runmat_lsp_bg.wasm`, cacheBust);
      const lsp = await import(/* webpackIgnore: true */ jsUrl);
      await lsp.default({ module_or_path: wasmUrl });
      onProgress('initializing');
      if (typeof lsp.setCompatMode === 'function') lsp.setCompatMode('matlab');
      await lsp.open_document(URI, '');
      onProgress('ready');
      return lsp;
    })();
    lspPromise.catch(() => { lspPromise = null; }); // allow retry after a failed load
  }
  return lspPromise;
}

self.onmessage = async (e) => {
  const { id, type, cacheBust, text, line, character } = e.data;
  try {
    if (type === 'preload') {
      await loadLsp(stage => self.postMessage({ id, type: 'progress', stage }), cacheBust);
      self.postMessage({ id, type: 'loaded' });
      return;
    }

    if (type === 'completion') {
      let lsp;
      try {
        lsp = await loadLsp(stage => self.postMessage({ id, type: 'progress', stage }), cacheBust);
      } catch (loadErr) {
        self.postMessage({ id, type: 'workerError', message: `Autocomplete failed to load: ${String((loadErr && loadErr.message) || loadErr)}` });
        return;
      }
      await lsp.change_document(URI, text);
      const result = lsp.completion(URI, line, character);
      self.postMessage({ id, type: 'completion', items: (result && result.items) || [] });
      return;
    }

    if (type === 'hover') {
      let lsp;
      try {
        lsp = await loadLsp(stage => self.postMessage({ id, type: 'progress', stage }), cacheBust);
      } catch (loadErr) {
        self.postMessage({ id, type: 'workerError', message: `Autocomplete failed to load: ${String((loadErr && loadErr.message) || loadErr)}` });
        return;
      }
      await lsp.change_document(URI, text);
      const result = lsp.hover(URI, line, character);
      self.postMessage({ id, type: 'hover', contents: (result && result.contents) || null });
      return;
    }
  } catch (err) {
    self.postMessage({ id, type: 'workerError', message: String((err && err.message) || err) });
  }
};
