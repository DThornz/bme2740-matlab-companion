// ─────────────────────────────────────────────────────────────
// "Try it yourself" — the interactive (Level 3) tier of Review code
// examples, alongside static Read (Level 1) and Copy (Level 2) blocks
// rendered by render.js's codeBlock(). Reuses the same RunMat-backed
// runtime as the MATLAB Sandbox (js/matlab-runtime.js) — see that
// file's header for what RunMat is, why it runs in a Web Worker, and
// its known MATLAB-compatibility gaps.
//
// Deliberately lighter than the full Sandbox: a plain <textarea>
// instead of the CodeMirror editor (js/matlab-editor.js) — avoids
// pulling in the editor/autocomplete bundle just to render a chapter
// page — and no example picker or memory readout. Every block still
// works with zero JavaScript beyond this: the static code + Copy
// button are always shown first (see review-render.js), and RunMat
// loads only when a student actually clicks "Try it" (per spec §27:
// "The Review section must remain useful if RunMat is unavailable").
// ─────────────────────────────────────────────────────────────

import { loadMatlabRuntime, runMatlabCode, bindPlotCanvas } from './matlab-runtime.js';
import { escapeHtml } from './render.js';

const STAGE_LABEL = {
  downloading: 'Downloading MATLAB runtime (~15 MB, one-time — cached after this)…',
  initializing: 'Starting MATLAB runtime…',
  ready: 'Running…',
};

function codeLooksLikeItPlots(code) {
  return /\b(plot|scatter|bar|histogram|surf|mesh|contour|stem|stairs|pie|imagesc)\s*\(/.test(code || '');
}

let idCounter = 0;

/** Static markup for one Try-it block: a normal code block that becomes an editor on click. */
export function tryItBlockHtml(code, caption = '') {
  const id = `tryit-${++idCounter}`;
  return `
    <div class="code-block tryit-block" data-tryit-id="${id}">
      <div class="code-block-bar">
        <span class="code-block-lang">MATLAB${caption ? ' · ' + escapeHtml(caption) : ''}</span>
        <div class="tryit-bar-actions">
          <button type="button" class="code-copy-btn" data-copy-target="${id}-src">Copy</button>
          <button type="button" class="btn btn-outline btn-sm tryit-launch-btn" data-tryit-run="${id}">▶ Try it</button>
        </div>
      </div>
      <pre class="code-block-pre"><code id="${id}-src">${escapeHtml(code)}</code></pre>
      <div class="tryit-live" id="${id}-live" hidden></div>
    </div>`;
}

/** Call once after inserting chapter HTML into the DOM (alongside wireCodeCopyButtons). */
export function wireTryItBlocks(root) {
  root.querySelectorAll('[data-tryit-run]').forEach(btn => {
    btn.addEventListener('click', () => mountTryIt(root, btn.dataset.tryitRun), { once: true });
  });
}

async function mountTryIt(root, id) {
  const block = root.querySelector(`[data-tryit-id="${id}"]`);
  if (!block) return;
  const srcEl = block.querySelector(`#${id}-src`);
  const liveEl = block.querySelector(`#${id}-live`);
  const originalCode = srcEl.textContent;
  const lineCount = originalCode.split('\n').length;

  block.querySelector('.code-block-bar').hidden = true;
  block.querySelector('.code-block-pre').hidden = true;
  liveEl.hidden = false;
  liveEl.innerHTML = `
    <div class="code-block-bar">
      <span class="code-block-lang">MATLAB · editable</span>
      <div class="tryit-bar-actions">
        <button type="button" class="btn btn-primary btn-sm tryit-run-btn">▶ Run</button>
      </div>
    </div>
    <div class="tryit-body">
      <textarea class="code-entry-input tryit-editor" rows="${Math.min(14, Math.max(3, lineCount + 1))}" spellcheck="false">${escapeHtml(originalCode)}</textarea>
      <div class="tryit-status" hidden></div>
      <div class="tryit-plot-wrap" hidden><canvas class="tryit-plot-canvas" width="440" height="300"></canvas></div>
      <div class="tryit-output"></div>
    </div>
  `;

  const textarea = liveEl.querySelector('.tryit-editor');
  const runBtn = liveEl.querySelector('.tryit-run-btn');
  const statusEl = liveEl.querySelector('.tryit-status');
  const plotWrap = liveEl.querySelector('.tryit-plot-wrap');
  const plotCanvas = liveEl.querySelector('.tryit-plot-canvas');
  const outputEl = liveEl.querySelector('.tryit-output');

  let plotBound = false;
  let plotUnavailableReason = null;

  async function run() {
    runBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.textContent = 'Loading MATLAB runtime…';
    try {
      await loadMatlabRuntime(stage => { statusEl.textContent = STAGE_LABEL[stage] || stage; });

      if (!plotBound && !plotUnavailableReason) {
        try {
          const bindResult = await bindPlotCanvas(plotCanvas);
          plotBound = bindResult.bound && bindResult.rendererReady;
          if (!plotBound) {
            plotUnavailableReason = bindResult.reason
              || (bindResult.gpuStatus && bindResult.gpuStatus.error)
              || 'Plotting isn’t available in this browser.';
          }
        } catch (bindErr) {
          plotUnavailableReason = `Plot setup failed: ${bindErr && bindErr.message ? bindErr.message : bindErr}`;
        }
      }

      statusEl.textContent = 'Running your code…';
      const code = textarea.value;
      const { stdout, error, plotted } = await runMatlabCode(code);
      statusEl.hidden = true;
      plotWrap.hidden = !plotted;

      const stdoutHtml = stdout ? `<pre class="sandbox-stdout">${escapeHtml(stdout)}</pre>` : '<p class="input-hint">(no output)</p>';
      const errorHtml = error
        ? `<div class="feedback-banner feedback-incorrect" style="margin-top:10px">
             <div class="feedback-headline">✗ ${escapeHtml(error.identifier || 'Error')}</div>
             <pre class="sandbox-stdout">${escapeHtml(error.diagnostic || error.message)}</pre>
           </div>`
        : '';
      const plotNoteHtml = (!plotted && plotUnavailableReason && codeLooksLikeItPlots(code))
        ? `<div class="live-run-note live-run-note-warn" style="margin-top:10px">⚠ ${escapeHtml(plotUnavailableReason)}</div>`
        : '';
      outputEl.innerHTML = stdoutHtml + errorHtml + plotNoteHtml;
    } catch (e) {
      statusEl.hidden = true;
      outputEl.innerHTML = `<div class="feedback-banner feedback-incorrect">
        <div class="feedback-headline">✗ Runtime problem</div>
        <p class="feedback-explanation">${escapeHtml(String((e && e.message) || e))}</p>
      </div>`;
    } finally {
      runBtn.disabled = false;
    }
  }

  runBtn.addEventListener('click', run);
  run(); // the student already clicked "Try it" once — running immediately shows the example working before they change anything
}
