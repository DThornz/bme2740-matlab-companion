// ─────────────────────────────────────────────────────────────
// A small, persistent MATLAB scratchpad panel usable alongside quiz
// questions — students can try things out without it affecting
// grading or progress. Wired into the quiz view (js/views.js), whose
// question card re-renders on every Next/Prev/etc; this module keeps
// the scratchpad's open/closed state and code text in module-level
// state (not the DOM) specifically so it survives those re-renders,
// tearing down and recreating the CodeMirror instance against the
// fresh DOM node each time only when the panel is actually open.
// Uses the SAME shared MATLAB runtime as the Sandbox and live
// grading — opening this doesn't trigger a second download if either
// of those already loaded it this session.
// ─────────────────────────────────────────────────────────────

import { loadMatlabRuntime, runMatlabCode, isMatlabRuntimeLoaded } from './matlab-runtime.js';
import { createMatlabEditor } from './matlab-editor.js';
import { escapeHtml } from './render.js';

const STAGE_LABEL = {
  downloading: 'Downloading MATLAB runtime (~15 MB, one-time)…',
  initializing: 'Starting…',
  ready: 'Ready.',
};

const state = {
  open: false,
  code: "% Try things out here — this doesn't affect your answer or progress.\n",
  editor: null,
};

/**
 * Wires up the toggle button + panel markup that must already exist in
 * `container` (see scratchpadMarkup() below — call it from the quiz view's
 * template). Safe to call on every question re-render.
 */
export function wireScratchpad(container) {
  const toggleBtn = container.querySelector('#scratchpadToggleBtn');
  const panel = container.querySelector('#scratchpadPanel');
  if (!toggleBtn || !panel) return;

  panel.hidden = !state.open;
  toggleBtn.setAttribute('aria-expanded', String(state.open));
  toggleBtn.classList.toggle('scratchpad-toggle-active', state.open);

  if (state.open) mountScratchpadEditor(panel);

  toggleBtn.addEventListener('click', () => {
    state.open = !state.open;
    panel.hidden = !state.open;
    toggleBtn.setAttribute('aria-expanded', String(state.open));
    toggleBtn.classList.toggle('scratchpad-toggle-active', state.open);
    if (state.open) mountScratchpadEditor(panel);
    else { state.editor?.destroy(); state.editor = null; }
  });
}

/** Small toggle button — embed inside the question card's header row. */
export function scratchpadToggleMarkup() {
  return `<button type="button" class="scratchpad-toggle" id="scratchpadToggleBtn" aria-expanded="false" title="A free-form MATLAB scratchpad — doesn't affect your answer">🧮 Scratchpad</button>`;
}

/** The panel itself — embed as a SIBLING of the question card (not nested
 *  inside it), so it can lay out as a right-side panel next to the question
 *  rather than inline within it. See .quiz-layout in style.css. */
export function scratchpadPanelMarkup() {
  return `
    <aside class="scratchpad-panel" id="scratchpadPanel" hidden aria-label="MATLAB scratchpad">
      <div class="scratchpad-panel-header">
        <span class="code-block-lang">MATLAB Scratchpad</span>
        <span class="input-hint">Not graded — just for trying things out.</span>
      </div>
      <div id="scratchpadEditorHost" class="sandbox-editor-host scratchpad-editor-host"></div>
      <div class="dashboard-actions" style="margin-top:10px">
        <button type="button" class="btn btn-primary" id="scratchpadRunBtn">${isMatlabRuntimeLoaded() ? 'Run' : 'Load & Run'}</button>
        <button type="button" class="btn btn-outline" id="scratchpadClearBtn">Clear Output</button>
      </div>
      <div id="scratchpadStatus" class="sandbox-status" hidden></div>
      <div class="runtime-progress-bar" id="scratchpadProgressBar" hidden><div class="runtime-progress-fill" id="scratchpadProgressFill"></div></div>
      <div id="scratchpadOutput"></div>
    </aside>
  `;
}

// Real byte progress (see matlab-worker.js's `wrapWithProgress`) — only
// available during the 'downloading' stage, and only when the CDN response
// includes a Content-Length. Mirrors the identical helper in sandbox.js;
// kept duplicated rather than shared since it's four lines and pulling in
// a new shared module for it isn't worth the indirection.
function updateProgressBar(barEl, fillEl, stage, detail) {
  if (stage !== 'downloading' || !detail || !detail.total) {
    barEl.hidden = true;
    return;
  }
  barEl.hidden = false;
  fillEl.style.width = `${Math.min(100, Math.round((detail.loaded / detail.total) * 100))}%`;
}

async function mountScratchpadEditor(panel) {
  const host = panel.querySelector('#scratchpadEditorHost');
  const runBtn = panel.querySelector('#scratchpadRunBtn');
  const clearBtn = panel.querySelector('#scratchpadClearBtn');
  const statusEl = panel.querySelector('#scratchpadStatus');
  const progressBar = panel.querySelector('#scratchpadProgressBar');
  const progressFill = panel.querySelector('#scratchpadProgressFill');
  const outputEl = panel.querySelector('#scratchpadOutput');

  state.editor?.destroy();
  try {
    state.editor = await createMatlabEditor(host, {
      initialCode: state.code,
      onChange: (code) => { state.code = code; },
    });
  } catch (e) {
    host.innerHTML = `<p class="input-hint">Editor failed to load (${escapeHtml(String((e && e.message) || e))}).</p>`;
    return;
  }

  // mountScratchpadEditor() re-runs every time the panel is opened, but the
  // toggle button only hides/shows the panel — it doesn't replace its DOM —
  // so runBtn/clearBtn are the SAME nodes across repeated open/close cycles
  // within one question view. Without this guard, each reopen stacked
  // another click listener onto them, so clicking Run after opening the
  // panel 3 times fired the handler 3 times at once (three concurrent runs,
  // triple-rendered output). Wire the listeners exactly once per node.
  if (!runBtn.dataset.wired) {
    runBtn.dataset.wired = '1';
    clearBtn.dataset.wired = '1';
    clearBtn.addEventListener('click', () => { outputEl.innerHTML = ''; });

    runBtn.addEventListener('click', async () => {
      runBtn.disabled = true;
      statusEl.hidden = false;
      if (!isMatlabRuntimeLoaded()) statusEl.textContent = STAGE_LABEL.downloading;
      try {
        await loadMatlabRuntime((stage, detail) => {
          statusEl.textContent = STAGE_LABEL[stage] || stage;
          updateProgressBar(progressBar, progressFill, stage, detail);
        });
        runBtn.textContent = 'Run';
        statusEl.textContent = 'Running…';
        const { stdout, error } = await runMatlabCode(state.editor.getValue(), { timeoutMs: 6000 });
        statusEl.hidden = true;
        outputEl.innerHTML = stdout || error
          ? `<pre class="sandbox-stdout">${escapeHtml(stdout || '')}</pre>${error ? `<div class="feedback-banner feedback-incorrect" style="margin-top:8px"><pre class="sandbox-stdout">${escapeHtml(error.diagnostic || error.message)}</pre></div>` : ''}`
          : '<p class="input-hint">(no output)</p>';
      } catch (e) {
        statusEl.hidden = true;
        outputEl.innerHTML = `<div class="feedback-banner feedback-incorrect"><p class="feedback-explanation">${escapeHtml(String((e && e.message) || e))}</p></div>`;
      } finally {
        progressBar.hidden = true;
        runBtn.disabled = false;
      }
    });
  }
}
