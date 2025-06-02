// ─────────────────────────────────────────────────────────────
// CodeMirror 6-backed code editor for MATLAB code, used by both the
// Sandbox and the quiz scratchpad panel.
//
// WHY esm.sh, not jsdelivr's `+esm` (used everywhere else in this
// project): verified directly that it causes a real bug. jsdelivr
// resolves each npm package's `+esm` bundle independently, so
// `codemirror@6.0.2` and `@codemirror/autocomplete@6.18.6` — fetched
// as separate top-level imports — pulled in two DIFFERENT concrete
// versions of `@codemirror/view` internally (6.37.2 vs 6.36.2, confirmed
// by inspecting both bundles directly). CodeMirror's extension system
// uses object identity for its Facets, so two instances of the "same"
// class from two different module loads broke with exactly the error
// this produced: "Unrecognized extension value in extension set
// ([object Object])". esm.sh's `?deps=` parameter forces a set of
// packages to all resolve their shared sub-dependencies to identical,
// explicitly pinned concrete versions — verified directly that with it,
// codemirror's own bundle and the separately-imported autocomplete
// package both resolve `@codemirror/view` to the exact same final URL,
// meaning the exact same module instance. Without this, the editor does
// not work at all — this is not a style preference.
//
// SECOND BUG, caught by hand-testing in a real browser after the above
// fix: pinning `@codemirror/view` to 6.37.2 fixed the identity problem
// but broke a DIFFERENT way — "The requested module '.../view.mjs'
// doesn't provide an export named: 'activateHover'". Root cause: this
// project's `codemirror` meta-package pulls in `@codemirror/lint` (for
// basicSetup's lint keymap) via a loose `^6.0.0` range, which floats to
// whatever the latest published lint is — currently 6.9.7 — regardless
// of which view version we pin. lint@6.9.7 declares a peer dependency
// of `@codemirror/view@^6.42.0` (it uses `activateHover`, an export
// view only added in 6.42.0), so pinning view to anything older than
// 6.42.0 breaks lint even though view/autocomplete/codemirror's OWN
// direct requirements were satisfied. Fixed by bumping CM_VIEW_VERSION
// to 6.43.9 (current latest, exports `activateHover`) and CM_STATE_VERSION
// to 6.7.1 to match (view@6.43.9 itself declares `@codemirror/state@^6.7.0`
// as a peer — leaving state pinned at the old 6.5.2 would reintroduce the
// same class of bug one dependency level down). Moral: when bumping any
// of these three versions, don't just check that codemirror/autocomplete/
// view resolve to identical URLs (the FIRST bug) — also check every
// package's own declared peer-dependency ranges on npm (`registry.npmjs.org/
// <pkg>/<version>`) to make sure the pinned versions actually satisfy them,
// since esm.sh will silently resolve a technically-incompatible version
// rather than erroring at fetch time; the break only surfaces at runtime
// as a missing export.
//
// IMPORTANT VERIFICATION GAP: everything in js/matlab-runtime.js,
// js/matlab-worker.js, js/matlab-lsp.js, and js/matlab-lsp-worker.js
// was tested directly against the real, running WASM modules (see
// README "MATLAB Sandbox"). This file requires a real DOM/browser,
// which still isn't available while maintaining it — both bugs above
// were caught by hand-testing in an actual browser (not by anything in
// this repo's own tooling), and the fix here was verified only at the
// level of "do these URLs resolve to byte-identical underlying files
// and do the expected named exports exist at them" (via curl) — NOT by
// actually constructing an EditorView and confirming it renders. Treat
// this file as unverified end-to-end until checked by hand in a real
// browser.
//
// There is no official MATLAB language package for CodeMirror, so
// this doesn't provide syntax highlighting — just a real editing
// experience (line numbers, bracket matching, undo/redo) plus,
// optionally, live autocomplete/hover backed by js/matlab-lsp.js.
// ─────────────────────────────────────────────────────────────

const CM_VERSION = '6.0.2';
const CM_STATE_VERSION = '6.7.1';
const CM_VIEW_VERSION = '6.43.9';
const CM_AUTOCOMPLETE_VERSION = '6.18.6';

// `codemirror`, `@codemirror/autocomplete`, and `@codemirror/view` (fetched
// separately below, for hoverTooltip) all get this SAME deps string — that's
// what forces them to share module instances instead of pulling in slightly
// different internal versions of @codemirror/view. `@codemirror/state` is
// deliberately fetched with NO deps param — verified directly that adding
// one (even listing state/view themselves) changes its resolved URL to a
// DIFFERENT hash than the plain, undecorated path codemirror/autocomplete
// resolve internally for state, breaking the exact same way. If any of these
// versions get bumped, re-verify with curl (see README "Autocomplete") that
// codemirror's own bundle, autocomplete's own bundle, and these direct
// fetches all resolve @codemirror/view and @codemirror/state to identical
// final URLs before shipping the change — this is not just "should work",
// it silently breaks in a way this project's own tests can't catch (no DOM
// available here — see the file header).
const CM_DEPS = `@codemirror/state@${CM_STATE_VERSION},@codemirror/view@${CM_VIEW_VERSION}`;

const CM_URL = `https://esm.sh/codemirror@${CM_VERSION}?deps=${CM_DEPS}`;
const CM_STATE_URL = `https://esm.sh/@codemirror/state@${CM_STATE_VERSION}`;
const CM_VIEW_URL = `https://esm.sh/@codemirror/view@${CM_VIEW_VERSION}?deps=${CM_DEPS}`;
const CM_AUTOCOMPLETE_URL = `https://esm.sh/@codemirror/autocomplete@${CM_AUTOCOMPLETE_VERSION}?deps=${CM_DEPS}`;

let modulesPromise = null;

function loadEditorModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import(/* webpackIgnore: true */ CM_URL),
      import(/* webpackIgnore: true */ CM_STATE_URL),
      import(/* webpackIgnore: true */ CM_AUTOCOMPLETE_URL),
      import(/* webpackIgnore: true */ CM_VIEW_URL),
    ]);
  }
  return modulesPromise;
}

/** Converts a flat character offset into 0-indexed {line, character}, LSP-style. */
function offsetToPosition(doc, offset) {
  const line = doc.lineAt(offset);
  return { line: line.number - 1, character: offset - line.from };
}

/**
 * Creates a MATLAB code editor inside `parentEl`, replacing its contents.
 *
 * @param {HTMLElement} parentEl
 * @param {{
 *   initialCode?: string,
 *   onChange?: (code: string) => void,
 *   autocomplete?: boolean,   // pulls in js/matlab-lsp.js and enables live completions + hover
 * }} options
 * @returns {Promise<{ getValue: () => string, setValue: (code: string) => void, focus: () => void, destroy: () => void }>}
 */
export async function createMatlabEditor(parentEl, options = {}) {
  const { initialCode = '', onChange, autocomplete = false } = options;
  const [cmCore, cmState, cmAutocomplete, cmView] = await loadEditorModules();
  const { EditorView, basicSetup } = cmCore;
  const { EditorState } = cmState;
  const { autocompletion } = cmAutocomplete;
  const { hoverTooltip } = cmView;

  const extensions = [
    basicSetup,
    EditorView.lineWrapping,
    EditorView.theme({
      '&': { fontSize: '0.85em' },
      '.cm-content': { fontFamily: "'DM Mono', monospace" },
      '.cm-gutters': { fontFamily: "'DM Mono', monospace" },
    }),
  ];

  if (onChange) {
    extensions.push(EditorView.updateListener.of(update => {
      if (update.docChanged) onChange(update.state.doc.toString());
    }));
  }

  if (autocomplete) {
    const { getMatlabCompletions, getMatlabHover } = await import('./matlab-lsp.js');

    extensions.push(autocompletion({
      override: [async (context) => {
        const word = context.matchBefore(/[A-Za-z_]\w*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;
        const text = context.state.doc.toString();
        const pos = offsetToPosition(context.state.doc, context.pos);
        let items;
        try {
          items = await getMatlabCompletions(text, pos.line, pos.character);
        } catch {
          return null; // autocomplete failing shouldn't block typing
        }
        return {
          from: word.from,
          options: items.slice(0, 200).map(item => ({
            label: item.label,
            type: item.kind === 3 ? 'function' : item.kind === 6 ? 'variable' : 'keyword',
            detail: item.detail || undefined,
            info: item.documentation?.value || undefined,
          })),
        };
      }],
    }));

    extensions.push(hoverTooltip(async (view, pos) => {
      const text = view.state.doc.toString();
      const p = offsetToPosition(view.state.doc, pos);
      let contents;
      try {
        contents = await getMatlabHover(text, p.line, p.character);
      } catch {
        return null;
      }
      if (!contents) return null;
      return {
        pos,
        create() {
          const dom = document.createElement('div');
          dom.className = 'cm-matlab-hover';
          dom.textContent = contents;
          return { dom };
        },
      };
    }));
  }

  const state = EditorState.create({ doc: initialCode, extensions });
  parentEl.innerHTML = '';
  const view = new EditorView({ state, parent: parentEl });

  return {
    getValue: () => view.state.doc.toString(),
    setValue: (code) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
