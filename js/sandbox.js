// ─────────────────────────────────────────────────────────────
// MATLAB Sandbox — an experimental, opt-in page where students can
// write and run real MATLAB-syntax code client-side, powered by
// RunMat (WebAssembly). See js/matlab-runtime.js for the loader and
// known MATLAB-compatibility gaps. This is a practice/exploration
// tool, separate from the graded question bank — it does not feed
// into progress tracking or quiz grading. (Live grading of code-entry
// quiz questions is a separate, explicit opt-in — see js/views.js.)
// ─────────────────────────────────────────────────────────────

import {
  loadMatlabRuntime, runMatlabCode, isMatlabRuntimeLoaded,
  resetMatlabRuntime, getMatlabMemoryUsage, bindPlotCanvas,
} from './matlab-runtime.js';
import { createMatlabEditor } from './matlab-editor.js';
import { escapeHtml } from './render.js';

const EXAMPLES = [
  { label: 'Vectors & loops', code: 'total = 0;\nfor i = 1:5\n    total = total + i^2;\nend\ndisp(total)' },
  { label: 'Matrix indexing', code: 'A = [1 2 3; 4 5 6; 7 8 9];\ndisp(A(2,:))\ndisp(A(:,3))' },
  { label: 'Conditionals', code: "bp = 138;\nif bp > 140\n    disp('Stage 2 Hypertension')\nelseif bp > 130\n    disp('Stage 1 Hypertension')\nelse\n    disp('Normal / Elevated')\nend" },
  // Deliberately NOT `f(1:5)` (an inline range literal as the call argument) —
  // verified directly against the real runmat@0.6.1 WASM build that this
  // exact pattern throws "Slicing only supported on tensors" inside an
  // anonymous function, even though the equivalent non-anonymous `x.^2` on
  // the same range, or the same anonymous function called on an explicit
  // array or a pre-assigned variable, both work fine. Assigning the range to
  // a variable first (as below) sidesteps it entirely.
  { label: 'Anonymous functions', code: 'x = 1:5;\nf = @(v) v.^2 + 1;\ndisp(f(x))' },
  { label: 'Plot (experimental)', code: "x = linspace(0, 2*pi, 100);\ny = sin(x);\nplot(x, y)\ntitle('sin(x)')\nxlabel('x')\nylabel('sin(x)')" },
];

const STAGE_LABEL = {
  downloading: 'Downloading MATLAB runtime (~15 MB, one-time — cached after this)…',
  initializing: 'Starting MATLAB runtime…',
  ready: 'Ready.',
};

const LSP_STAGE_LABEL = {
  downloading: 'Downloading autocomplete data (~47 MB, one-time — cached after this)…',
  initializing: 'Starting autocomplete…',
  ready: 'Autocomplete ready.',
};

let plotCanvasBound = false;
let plotUnavailableReason = null;
let editor = null;

// Set by js/problem-views.js's "Open in Sandbox" button before navigating
// here — must match the constant of the same name/value duplicated there
// (see that file's comment for why it isn't imported instead).
const PREFILL_KEY = 'bme2740:sandboxPrefill';

// Turns bindPlotCanvas()'s diagnostic result into a one-line, student-facing
// reason — see matlab-runtime.js's bindPlotCanvas JSDoc for the field shapes.
function describePlotUnavailable(bindResult) {
  if (!bindResult) return 'Plotting is unavailable in this browser.';
  if (!bindResult.bound) return bindResult.reason || 'Plotting is unavailable in this browser.';
  const gpuErr = bindResult.gpuStatus && bindResult.gpuStatus.error;
  return gpuErr
    ? `This browser's GPU (WebGPU) support isn't sufficient for plotting: ${gpuErr}`
    : "The GPU-based plot renderer isn't ready in this browser — plotting is unavailable, but the rest of your code still ran normally.";
}

function codeLooksLikeItPlots(code) {
  return /\b(plot|scatter|bar|histogram|surf|mesh|contour|stem|stairs|pie|imagesc)\s*\(/.test(code || '');
}

// Warms up the connection to the CDN the runtime downloads from, so the
// first real fetch (on Run) starts a little faster. Injected only when the
// sandbox route is actually visited — not on every page load — and only
// once per page session (repeat visits to the sandbox are a no-op here).
function preconnectToRuntimeCdn() {
  if (document.querySelector('link[data-sandbox-preconnect]')) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://cdn.jsdelivr.net';
  link.crossOrigin = 'anonymous';
  link.dataset.sandboxPreconnect = '1';
  document.head.appendChild(link);
}

export function renderSandbox(container) {
  preconnectToRuntimeCdn();
  const alreadyLoaded = isMatlabRuntimeLoaded();
  plotCanvasBound = false; // this view's <canvas> is a fresh DOM element every render
  plotUnavailableReason = null;

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><span>MATLAB Sandbox</span></nav>
    <div class="section">
      <div class="section-num">Experimental</div>
      <h1 class="section-title" style="font-size:2.1em">MATLAB Sandbox</h1>
      <div class="callout callout-amber">
        <div class="callout-title">Experimental — read before use</div>
        Code here runs in a real MATLAB-syntax interpreter (<a href="https://runmat.com" target="_blank" rel="noopener">RunMat</a>), compiled to WebAssembly and executed entirely in your browser, in a background worker — nothing is sent to any server. It is <strong>not</strong> official MATLAB and isn't 100% behavior-identical. Known gaps found while testing this prototype:
        <ul style="margin:8px 0 0 20px;line-height:1.7">
          <li>Assigning a field to an undefined variable (e.g. <code>s.age = 45;</code> without <code>s</code> already existing) does not auto-create a struct the way real MATLAB does — write <code>s = struct();</code> first as a workaround.</li>
          <li>If an assignment's right-hand side errors (e.g. adding mismatched-size arrays), the target variable is left at <code>0</code> and echoed instead of staying undefined with no output.</li>
          <li><code>switch</code>/<code>case</code> with a cell-array case (<code>case {'a','b'}</code>) for matching multiple values at once isn't supported — use separate <code>case</code> lines instead.</li>
          <li><code>fminsearch</code> isn't implemented in this build — <code>fzero</code> and <code>fminbnd</code> both work correctly.</li>
          <li>Calling an anonymous function with an inline range as the argument, e.g. <code>f = @(x) x.^2; f(1:5)</code>, fails with a "Slicing only supported on tensors" error — assign the range to a variable first (<code>r = 1:5; f(r)</code>) and it works fine.</li>
          <li><code>plot(M)</code> with a single matrix argument doesn't plot one line per column the way real MATLAB does — it flattens the whole matrix into one series instead. Plot columns explicitly if you need multiple lines: <code>hold on; for i=1:size(M,2); plot(M(:,i)); end</code>.</li>
          <li>Plotting depends on your browser's WebGPU support. If a figure doesn't appear, the output area below will now say specifically why (e.g. WebGPU unavailable) instead of just showing nothing — that's a real browser-support limit, not something you did wrong.</li>
        </ul>
        This sandbox is for free-form practice and exploration only — it is separate from the graded question bank and doesn't affect your progress stats.
      </div>

      <div class="sandbox-examples">
        <span class="sandbox-examples-label">Try an example:</span>
        ${EXAMPLES.map((ex, i) => `<button type="button" class="pill sandbox-example-btn" data-example="${i}">${escapeHtml(ex.label)}</button>`).join('')}
      </div>

      <div id="sandboxEditorHost" class="sandbox-editor-host">Loading editor…</div>

      <div class="sandbox-autocomplete-row">
        <label class="acc-toggle-row" style="max-width:320px">
          <span class="acc-toggle-label">Autocomplete</span>
          <span class="acc-switch"><input type="checkbox" id="sandboxAutocompleteToggle"><span class="acc-slider"></span></span>
        </label>
        <span class="input-hint">Live function suggestions + hover docs while you type. Downloads ~47 MB extra, one-time.</span>
      </div>

      <div class="dashboard-actions">
        <button type="button" class="btn btn-primary" id="sandboxRunBtn">${alreadyLoaded ? 'Run Code' : 'Load Runtime & Run'}</button>
        <button type="button" class="btn btn-outline" id="sandboxClearBtn">Clear Output</button>
        <button type="button" class="btn btn-outline" id="sandboxReloadBtn" title="Fully restart the MATLAB runtime — use this if something looks broken or stuck">↻ Reload Runtime</button>
        ${alreadyLoaded ? '<span class="sandbox-mem-note" id="sandboxMemNote"></span>' : ''}
      </div>

      <div id="sandboxStatus" class="sandbox-status" hidden></div>
      <div class="runtime-progress-bar" id="sandboxProgressBar" hidden><div class="runtime-progress-fill" id="sandboxProgressFill"></div></div>

      <div class="sandbox-plot-wrap" id="sandboxPlotWrap" hidden>
        <div class="code-block-lang" style="margin-bottom:6px">Plot</div>
        <canvas id="sandboxPlotCanvas" width="480" height="320"></canvas>
      </div>

      <div id="sandboxOutput"></div>
    </div>
  `;

  const editorHost = container.querySelector('#sandboxEditorHost');
  const autocompleteToggle = container.querySelector('#sandboxAutocompleteToggle');
  const runBtn = container.querySelector('#sandboxRunBtn');
  const clearBtn = container.querySelector('#sandboxClearBtn');
  const reloadBtn = container.querySelector('#sandboxReloadBtn');
  const statusEl = container.querySelector('#sandboxStatus');
  const progressBar = container.querySelector('#sandboxProgressBar');
  const progressFill = container.querySelector('#sandboxProgressFill');
  const outputEl = container.querySelector('#sandboxOutput');
  const plotWrap = container.querySelector('#sandboxPlotWrap');
  const plotCanvas = container.querySelector('#sandboxPlotCanvas');
  const memNote = container.querySelector('#sandboxMemNote');

  if (alreadyLoaded) refreshMemoryNote(memNote);

  let prefill = null;
  try { prefill = sessionStorage.getItem(PREFILL_KEY); sessionStorage.removeItem(PREFILL_KEY); } catch (e) { /* storage unavailable — fall through to the default example */ }
  mountEditor(editorHost, prefill || EXAMPLES[0].code, false);

  container.querySelectorAll('.sandbox-example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editor?.setValue(EXAMPLES[Number(btn.dataset.example)].code);
    });
  });

  autocompleteToggle.addEventListener('change', async () => {
    const turningOn = autocompleteToggle.checked;
    autocompleteToggle.disabled = true;
    const currentCode = editor ? editor.getValue() : '';

    if (turningOn) {
      statusEl.hidden = false;
      statusEl.textContent = LSP_STAGE_LABEL.downloading;
      try {
        const { loadMatlabLsp } = await import('./matlab-lsp.js');
        await loadMatlabLsp(stage => { statusEl.textContent = LSP_STAGE_LABEL[stage] || stage; });
      } catch (e) {
        statusEl.textContent = `Autocomplete failed to load (${e && e.message ? e.message : e}) — continuing without it.`;
        setTimeout(() => { statusEl.hidden = true; }, 3000);
        autocompleteToggle.checked = false;
        autocompleteToggle.disabled = false;
        return;
      }
      statusEl.hidden = true;
    }

    await mountEditor(editorHost, currentCode, turningOn);
    autocompleteToggle.disabled = false;
  });

  clearBtn.addEventListener('click', () => {
    outputEl.innerHTML = '';
    plotWrap.hidden = true;
  });

  reloadBtn.addEventListener('click', async () => {
    reloadBtn.disabled = true;
    runBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = 'Restarting MATLAB runtime…';
    resetMatlabRuntime({ forceFresh: true });
    plotCanvasBound = false;
    plotUnavailableReason = null;
    outputEl.innerHTML = '';
    plotWrap.hidden = true;
    runBtn.textContent = 'Load Runtime & Run';
    try {
      await loadMatlabRuntime((stage, detail) => {
        statusEl.textContent = STAGE_LABEL[stage] || stage;
        updateProgressBar(progressBar, progressFill, stage, detail);
      });
      statusEl.textContent = 'Runtime restarted and ready.';
      setTimeout(() => { statusEl.hidden = true; }, 1500);
      runBtn.textContent = 'Run Code';
      if (memNote) refreshMemoryNote(memNote);
    } catch (e) {
      statusEl.textContent = `Reload failed: ${e && e.message ? e.message : e}`;
    } finally {
      progressBar.hidden = true;
      reloadBtn.disabled = false;
      runBtn.disabled = false;
    }
  });

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    reloadBtn.disabled = true;
    statusEl.hidden = false;

    if (!isMatlabRuntimeLoaded()) {
      statusEl.textContent = STAGE_LABEL.downloading;
    }

    try {
      await loadMatlabRuntime((stage, detail) => {
        statusEl.textContent = STAGE_LABEL[stage] || stage;
        updateProgressBar(progressBar, progressFill, stage, detail);
      });
      runBtn.textContent = 'Run Code';

      if (!plotCanvasBound && !plotUnavailableReason) {
        try {
          const bindResult = await bindPlotCanvas(plotCanvas);
          plotCanvasBound = bindResult.bound && bindResult.rendererReady;
          if (!plotCanvasBound) plotUnavailableReason = describePlotUnavailable(bindResult);
        } catch (bindErr) {
          plotCanvasBound = false;
          plotUnavailableReason = `Plot canvas setup failed: ${bindErr && bindErr.message ? bindErr.message : bindErr}`;
        }
      }

      statusEl.textContent = 'Running your code…';
      const code = editor ? editor.getValue() : '';
      const runStart = performance.now();
      const { stdout, error, plotted, executionTimeMs } = await runMatlabCode(code);
      const wallTimeMs = performance.now() - runStart;
      statusEl.hidden = true;

      const plotNote = !plotted && plotUnavailableReason && codeLooksLikeItPlots(code) ? plotUnavailableReason : null;
      renderResult(outputEl, stdout, error, plotNote, executionTimeMs ?? wallTimeMs);
      plotWrap.hidden = !plotted;

      if (memNote) refreshMemoryNote(memNote);
    } catch (e) {
      statusEl.hidden = true;
      const isInfra = e && e.isInfraError;
      outputEl.innerHTML = `<div class="feedback-banner feedback-incorrect">
        <div class="feedback-headline">✗ ${isInfra ? 'Runtime problem' : 'Error'}</div>
        <p class="feedback-explanation">${escapeHtml(String((e && e.message) || e))}</p>
        ${isInfra ? '<p class="feedback-explanation">Try the <strong>↻ Reload Runtime</strong> button above.</p>' : ''}
      </div>`;
    } finally {
      progressBar.hidden = true;
      runBtn.disabled = false;
      reloadBtn.disabled = false;
    }
  });
}

// Real byte progress (see matlab-worker.js's `wrapWithProgress`) — only
// available during the 'downloading' stage, and only when the CDN response
// includes a Content-Length. Silently hides the bar instead of showing a
// stuck/fake value when detail isn't available (e.g. 'initializing'/'ready',
// or a server that omits Content-Length).
function updateProgressBar(barEl, fillEl, stage, detail) {
  if (stage !== 'downloading' || !detail || !detail.total) {
    barEl.hidden = true;
    return;
  }
  barEl.hidden = false;
  fillEl.style.width = `${Math.min(100, Math.round((detail.loaded / detail.total) * 100))}%`;
}

async function mountEditor(hostEl, code, autocomplete) {
  editor?.destroy();
  editor = null;
  try {
    editor = await createMatlabEditor(hostEl, { initialCode: code, autocomplete });
  } catch (e) {
    hostEl.innerHTML = `<p class="input-hint">Editor failed to load (${escapeHtml(String((e && e.message) || e))}) — try reloading the page.</p>`;
  }
}

async function refreshMemoryNote(memNote) {
  if (!memNote) return;
  const usage = await getMatlabMemoryUsage();
  if (usage && typeof usage.bytes === 'number') {
    const mb = (usage.bytes / (1024 * 1024)).toFixed(1);
    memNote.textContent = `Runtime memory: ~${mb} MB`;
  }
}

// Under a second: whole milliseconds. A second or more: seconds to 2dp —
// matches the precision students actually care about at each scale.
function formatDuration(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return null;
  const rounded = Math.round(ms);
  return rounded < 1000 ? `${rounded} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function renderResult(outputEl, stdout, error, plotNote, elapsedMs) {
  const stdoutHtml = stdout
    ? `<pre class="sandbox-stdout">${escapeHtml(stdout)}</pre>`
    : '<p class="input-hint">(no output)</p>';

  const errorHtml = error
    ? `<div class="feedback-banner feedback-incorrect" style="margin-top:10px">
         <div class="feedback-headline">✗ ${escapeHtml(error.identifier || 'Error')}</div>
         <pre class="sandbox-stdout">${escapeHtml(error.diagnostic || error.message)}</pre>
       </div>`
    : '';

  const plotNoteHtml = plotNote
    ? `<div class="live-run-note live-run-note-warn" style="margin-top:10px">⚠ ${escapeHtml(plotNote)}</div>`
    : '';

  const durationText = formatDuration(elapsedMs);
  const durationHtml = durationText
    ? `<span class="sandbox-run-time" title="Time to execute this code, reported by the MATLAB runtime">⏱ ${escapeHtml(durationText)}</span>`
    : '';

  outputEl.innerHTML = `
    <div class="sandbox-output-block">
      <div class="code-block-lang sandbox-output-header" style="margin-bottom:6px">
        <span>Output</span>
        ${durationHtml}
      </div>
      ${stdoutHtml}
      ${errorHtml}
      ${plotNoteHtml}
    </div>
  `;
}
