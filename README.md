# BME 2740 MATLAB Companion

**Author:** Asad Mirza (DThornz)

An interactive, 100% client-side MATLAB and numerical-methods practice companion for **BME 2740 — Biomedical Engineering Modeling and Simulation** (FIU). Students pick a unit, a topic, and a difficulty, work through questions, get an immediate explanation of why each answer is right or wrong, and track their own progress locally. There is no backend, no account, and no data ever leaves the browser.

Built on top of the shared [dthornz.github.io](https://dthornz.github.io/website-cv-tools/) page template — nav, hero, typography, accessibility panel, and dark mode all come from that design system.

---

## Current status

The **application skeleton is complete** (router, quiz engine, progress tracking, search, MATLAB reference, instructor mode) and **Unit 0 — MATLAB Overview** has a fully populated question bank (6 topics × 4 difficulties × 25 questions = 600 questions, across every supported question type). Units 1–6 and the future Neural Networks unit exist as metadata (topics, objectives, course materials) with empty question banks — they render as "Coming Soon" until their question files are written. See "Adding a new unit" below.

---

## How it works (no build step)

This is a static site — open `index.html` through any web server (or GitHub Pages) and it runs. It's a single-page app: one `index.html` shell holds the site nav, an empty `<main id="appRoot">`, the accessibility panel, and the footer. Everything inside `#appRoot` is rendered by JavaScript based on the URL hash (`#/unit/2/topic/solving-ax-b`, `#/quiz/active`, etc.) — no server-side routing needed, so it deploys to GitHub Pages as-is.

Because it uses native ES modules (`<script type="module">`), you can't just double-click `index.html` — browsers block module imports over `file://`. Run a static server from the project root instead:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Project structure

```
index.html              SPA shell: nav, #appRoot, accessibility panel, footer
style.css                Template design system + application UI (unit/topic/quiz/results/reference components)
script.js                 Accessibility panel logic (unchanged from the template)

data/
  units.js                 Course structure: units, topics, objectives, course materials (metadata only)
  functions.js              MATLAB function reference entries
  questions/
    unit0.js                 Unit 0 question bank (only unit with content so far)

js/
  app.js                    Hash router + bootstrap
  views.js                   All screen renderers (dashboard, unit, topic, quiz config, quiz, results, review, reference, search, instructor)
  bank.js                    Combines units.js + question modules; counts, lookups, validateQuestionBank()
  quiz.js                    Quiz session builder, answer grading, scoring — no DOM code
  store.js                   localStorage-backed progress tracking (falls back to in-memory if storage is unavailable)
  session.js                 sessionStorage for the in-progress quiz / last results (survives a page refresh)
  render.js                  Small shared DOM helpers (escaping, code blocks with copy button, progress bars, badges)
  sandbox.js                 MATLAB Sandbox view (#/sandbox) — experimental, see "MATLAB Sandbox" below
  matlab-runtime.js           Main-thread API for code execution: spawns/drives the worker, handles timeouts/reset
  matlab-worker.js            Web Worker that loads RunMat (WASM) from a CDN and executes submitted code
  matlab-editor.js            CodeMirror 6 editor wrapper, optionally wired to the LSP for completions/hover
  matlab-lsp.js                Main-thread API for autocomplete/hover — separate worker from execution, see "Autocomplete"
  matlab-lsp-worker.js         Web Worker that loads RunMat's LSP (WASM) from a CDN
  matlab-scratchpad.js         Collapsible MATLAB scratchpad panel embedded in quiz questions, see "MATLAB Scratchpad"
```

## Adding a new unit

1. Write `data/questions/unitN.js`, exporting `unitNQuestions` in the same shape as `unit0Questions` in `data/questions/unit0.js` (topicId → difficulty → `Question[]`).
2. In `js/bank.js`, import it and add it to `QUESTION_MODULES` (`{ 0: unit0Questions, N: unitNQuestions }`).
3. In `data/units.js`, flip that unit's `hasContent: true`.

Nothing else changes — topic cards, difficulty cards, quiz config, counts, search, and instructor mode all read from the bank dynamically.

## Question authoring guide

Every question is a plain object. Not all fields are required for every type — see `validateQuestionBank()` in `js/bank.js` for what's enforced.

| Field | Notes |
|---|---|
| `id` | Unique, e.g. `U0-ENV-B01` (`U{unit}-{topic code}-{B/I/A/X}{number}`) |
| `unit`, `topic`, `difficulty` | Must match an entry in `data/units.js`; difficulty is one of `beginner / intermediate / advanced / expert` |
| `type` | See supported types below |
| `cognitiveLevel` | `remember / understand / apply / analyze / evaluate / create` |
| `question` | The prompt text |
| `code`, `language` | Optional MATLAB snippet, rendered in a copyable code block |
| `options` | Choices (choice types, select-all) or steps to reorder (ordering) or left-hand items (matching) |
| `matchOptions` | Right-hand pool, matching questions only |
| `correctAnswer` | Shape depends on `type` (see below) |
| `acceptableAnswers` | `code-entry` only — array of accepted strings, compared whitespace-insensitively |
| `explanation` | Shown after answering, regardless of correctness |
| `optionExplanations` | Parallel array to `options`, one explanation per choice (choice types only) |
| `concept`, `tags`, `references` | Used by search and instructor mode |
| `commonMistakes` | Array of strings, shown in the feedback panel |
| `hint` | Optional "Show Hint" text, never affects grading |

**Supported `type` values and their `correctAnswer` shape:**

- `multiple-choice`, `true-false`, `output-prediction`, `code-debug`, `code-completion`, `scenario` — all rendered as single-select choice lists; `correctAnswer` is the index into `options`.
- `select-all` — `correctAnswer` is an array of correct indices into `options`.
- `numeric` — `correctAnswer` is `{ value, tolerance }`.
- `matching` — `correctAnswer[i]` is the index into `matchOptions` that pairs with `options[i]`.
- `ordering` — `correctAnswer` is the array of original `options` indices, in the correct order.
- `code-entry` — no `correctAnswer` needed; graded against `acceptableAnswers` after stripping whitespace (case- and semicolon-sensitive, since that reflects real MATLAB behavior).

Option/step display order is shuffled per quiz attempt without ever touching `correctAnswer` — see the comment above `prepareForDisplay()` in `js/quiz.js` if you're modifying the engine.

Run `validateQuestionBank()` (imported automatically on every page load, logs to the browser console) after adding questions — it flags duplicate IDs, invalid units/topics/difficulties/types, and missing required fields per type.

## Progress storage

Everything lives in `localStorage` under `bme2740_progress` — no student identity, nothing sent anywhere. `js/store.js` degrades to an in-memory object if `localStorage` is unavailable (private browsing, disabled storage), so the app still works, it just won't remember anything between reloads. "Reset My Progress" on the dashboard clears it after a confirmation.

The in-progress quiz and most recent results live separately in `sessionStorage` (`js/session.js`) so a refresh mid-quiz doesn't lose your place, but a closed tab doesn't leave stale quiz state behind.

## MATLAB Sandbox (experimental — `#/sandbox`)

A free-play page where students write real MATLAB-syntax code and see it actually run, client-side, via [RunMat](https://runmat.com) (Apache-2.0 open source) compiled to WebAssembly. Nothing loads until a student visits the page and clicks Run.

**Architecture:**
- `js/matlab-worker.js` runs inside a **Web Worker**, not the main thread. This is load-bearing, not a style choice: direct testing showed RunMat's `executeRequest()` blocks synchronously with no yield back to the event loop, so a student's `while true; end` on the main thread would freeze the entire tab with no recovery. A worker lets the main thread call `Worker.terminate()` to hard-kill a runaway run — verified working (an infinite loop was correctly stopped within its timeout, and the sandbox transparently spawned a fresh worker and kept working afterward).
- `js/matlab-runtime.js` is the main-thread API (`loadMatlabRuntime`, `runMatlabCode`, `resetMatlabRuntime`, `getMatlabMemoryUsage`, `bindPlotCanvas`, `workspacesEqual`) — spawns the worker, message-passes to it, and owns timeout/termination logic.
- The WASM module (RunMat's browser/`pkg-web` build) is imported at runtime straight from jsdelivr's CDN (`cdn.jsdelivr.net/npm/runmat@0.6.1/...`) — nothing is committed to this repo. It's a real download (~15 MB compressed, ~52 MB uncompressed), so it's only fetched on first actual use — both `js/sandbox.js` (route-level dynamic `import()`) and the worker itself (spawned lazily on first call, not at module load) are structured so visitors who never touch the sandbox never pay for any of this.
- **Loading, caching, and a real progress bar (`js/matlab-worker.js`):** the `.wasm` binary is fetched through the CacheStorage API rather than a bare `fetch()`, so a repeat page load can skip the network entirely and reuse the persisted copy — the previous behavior only benefited from the browser's *implicit* HTTP cache, which doesn't survive as reliably and gives Chromium no reason to reuse its *compiled* module across reloads. **This persistent-caching change was a real, caught regression the first time around:** the first version `await`ed the CacheStorage write (a full extra 15 MB disk write) *before* returning the response to be compiled, which serialized fetch time + cache-write time + compile time back to back — a load that used to feel instant started taking noticeably longer. Fixed by never blocking the compile step on the cache write: a cache hit returns immediately (no network at all), and a cache miss returns the live streaming fetch response right away for `WebAssembly.instantiateStreaming` to start compiling from as bytes arrive, while a `.clone()` of that same response is written to CacheStorage in the background, unawaited (a stream tee, not a second fetch, so it adds no serial delay). The download progress bar shown in the Sandbox and Scratchpad UIs is real byte-level progress, not simulated — a passthrough `TransformStream` counts bytes as they flow through on their way to being compiled, which is also why it can only appear during the initial network fetch (a cache hit has no bytes to stream, so it resolves as fast as CacheStorage can return the entry, with no progress bar shown at all).
- `session.clearWorkspace()` runs before every execution — verified directly that this isolates runs from each other (a variable set in one run does not leak into the next).

**Why the top-level `runmat` npm package isn't used directly:** its documented entry point (`import { initRunMat } from "runmat"`) is currently broken as published (v0.6.1) — its own `package.json` lists `dist/pkg/*` (the Node/bundler WASM target) as package contents, but that directory is missing from the actual published tarball (confirmed by downloading and inspecting it directly). The browser/ESM target (`dist/pkg-web/*`) **is** correctly published and is what a bundler-free static site wants anyway, so this project imports it directly rather than going through the broken top-level export.

**Recovering from a broken runtime — the "↻ Reload Runtime" button:** the runtime can get stuck (corrupted cached download, a WASM-level panic, a load that failed and left the worker unable to ever succeed again — this last one was a real bug, found and fixed: the worker used to cache the *rejected* load promise forever, so one failed load permanently broke that worker). The Reload button calls `resetMatlabRuntime({ forceFresh: true })`, which terminates the worker, spawns a fresh one, and appends a cache-busting query parameter to the CDN URLs so a corrupted cached response can't be replayed — verified end-to-end (forced a fresh, cache-busted download and confirmed the runtime worked immediately afterward).

**Memory:** the WASM linear memory (several MB, grows with use) stays resident in the worker for as long as the page is open, even after navigating away from the sandbox — an SPA route change doesn't destroy the worker, and live grading (below) intentionally reuses the same runtime rather than re-downloading it. The sandbox shows a live "Runtime memory: ~N MB" readout (via `session.memoryUsage()`) so this is visible rather than silent, and the Reload button doubles as a way to release it.

**Plotting — implemented, but *not* verified end-to-end:** `plot()` etc. render through RunMat's WebGPU-backed pipeline. The naive approach (call its image-export function directly) was tested and caused a **hard, uncatchable WASM panic** when no plot surface had been established first — confirmed this bypasses normal `try`/`catch` entirely. The implementation here instead follows RunMat's actual intended flow: transfer the sandbox's `<canvas>` to the worker via `OffscreenCanvas` (`canvas.transferControlToOffscreen()`), call `createPlotSurface()` once to bind it, then `presentFigureOnSurface()` after each run to draw directly onto it. This could not be exercised against a real GPU/browser in the environment this was built in, so **it may not actually render a visible plot yet** — the sandbox's disclaimer says so explicitly, and this is the one piece that most needs a hands-on check.

**Known MATLAB-compatibility gaps** (found by direct testing, not exhaustive — treat this as a practice sandbox, not a certified MATLAB clone). A broad battery of ~60 functions and constructs across arrays, strings, structs, linear algebra, control flow, and numerical methods (`fzero`, `fminbnd`, `ode45`, `polyfit`, `trapz`, `interp1`, ...) was run against this build — 46/48 and then 14/15 passed across two rounds; these are the specific exceptions found:
- `s.field = value` on an undefined `s` does not auto-create a struct the way real MATLAB does (throws "Undefined variable" instead). **Workaround, verified working:** write `s = struct();` first.
- On a failed assignment (e.g. adding two arrays of mismatched size), the target variable is left set to `0` and echoed ("`z = 0`") instead of staying undefined with no output, as real MATLAB does.
- An anonymous function applying `.^` to a range argument failed in testing (`f = @(x) x.^2 + 1; f(1:5)` → "Slicing only supported on tensors") — re-verify before relying on this pattern.
- `switch`/`case` with a cell-array case value for OR-matching multiple values at once (`case {'a','b'}`, valid real MATLAB) errors instead ("cannot convert Cell ... to f64") — use separate `case` lines, or `if`/`elseif` with `||`.
- `fminsearch` is entirely undefined in this build ("Undefined function: fminsearch") despite being a real MATLAB function — `fzero` and `fminbnd` were both verified working correctly with mathematically correct results (e.g. `fzero(@(x) x^2-2, 1)` → `1.4142`).
- Default numeric display (`format short`, e.g. `z = 2.5000`), control flow, indexing, `switch`/`case` (single-value), `disp`/`fprintf`, cell arrays, structs (once initialized), string functions, and every linear-algebra/numerical-methods function tested all matched real MATLAB exactly.
- **Performance** (measured, not estimated): first load (download + WASM init) took ~5.5s on a cold cache; individual code executions after that averaged ~16ms (range 3–166ms across ~60 varied test snippets) — fast enough that execution time is a non-issue once the runtime is loaded.

## Live MATLAB grading (experimental, opt-in)

An optional toggle — **Display Settings (⚙) → "Live MATLAB grading"**, off by default, persisted in `localStorage` (`js/store.js`) — that changes how `code-entry` quiz questions are graded. Off (default): the existing safe string comparison against `acceptableAnswers`, unchanged. On: clicking Check Answer actually *runs* the student's code and the question's reference answer (`acceptableAnswers[0]`) through the sandbox runtime and compares what actually happened, live, with the run shown transparently in the feedback panel ("⚡ Live-graded by running your code in a real MATLAB interpreter").

This required no changes to any of the 600 existing questions — the "expected" output/state is computed on the fly from the reference answer every time, not hand-authored.

**Grading compares two things, not one — this was a real bug, found and fixed:** an early version compared only *printed output* (stdout) between the student's run and the reference run. Testing surfaced that this is not enough: `x = 42;` and `x = 41;` produce **identical** (empty, suppressed) output, so a student who assigned the wrong value was graded correct. The fix compares stdout *and* the actual post-run variable state via RunMat's `session.workspaceSnapshot()` (stripping `previewToken`, a random id assigned fresh on every call that isn't part of the real state) — verified this correctly catches the wrong-value case while still correctly grading the output-only cases (like a forgotten semicolon) that workspace state alone wouldn't catch. The two live-grading requests run sequentially, not concurrently, since both share one worker/session and running them via `Promise.all` was not something this project could fully verify as safe against RunMat's internal (undocumented) message handling.

**Inherent limitation, not a bug:** output/state comparison can't detect a student special-casing the expected answer (e.g. a question asking them to compute `mod(17,5)` and display it — hardcoding `disp(2)` grades as correct, since the visible behavior is identical). This is a known limitation of behavioral grading in general, not something specific to this implementation.

Falls back automatically to the normal string-comparison grading if the runtime fails to load for any reason — a live-grading failure never blocks a student from answering.

## Autocomplete (experimental, opt-in — Sandbox only)

A separate toggle inside the Sandbox page itself ("Autocomplete") swaps the plain textarea for a [CodeMirror 6](https://codemirror.net) editor and, when turned on, backs it with real completions and hover docs from RunMat's own LSP (Language Server Protocol) WASM module (`js/matlab-lsp.js` + `js/matlab-lsp-worker.js`) — verified directly: typing `disp` and similar prefixes returns properly-shaped completion items with markdown documentation pulled from RunMat's real builtin docs, and hovering a function name returns its full reference entry.

This runs in its **own separate Web Worker** from code execution (`js/matlab-worker.js`) — deliberately, so a slow or hung run never blocks completions, and so this large download only happens for students who explicitly opt in.

**Cost:** this is a genuinely large addition — another ~47 MB (uncompressed) WASM module, measured at ~11.2s to download and initialize over a real network connection in testing. The toggle's label says so before it downloads anything. CodeMirror itself (the editor UI, used whenever the Sandbox loads, autocomplete on or off) is a trivial ~100–200 KB by comparison.

**A verification gap worth being explicit about:** everything MATLAB-execution-related in this project (interpreter, grading, LSP completions/hover) was tested directly against the real running WASM modules via a standalone script. `js/matlab-editor.js` — the CodeMirror wiring itself — could not be, since it needs a real DOM/browser that wasn't available while building it. The patterns used are standard, well-established CodeMirror 6 usage, but the editor UI specifically (not the MATLAB logic underneath it) should be checked by hand before being trusted.

**CodeMirror's CDN loading needed careful, non-obvious version pinning — two separate bugs found this way, both by hand-testing in a real browser.** jsdelivr's `+esm` resolves each npm package's bundle independently, so `codemirror` and `@codemirror/autocomplete` — fetched as separate imports — silently pulled in two *different* concrete builds of `@codemirror/view` internally, which broke CodeMirror's identity-based extension system ("Unrecognized extension value in extension set"). Switching to `esm.sh` with an explicit `?deps=` pin fixed that, but surfaced a second, subtler failure: the pinned `@codemirror/view` version was old enough that `@codemirror/lint` (pulled in transitively by `basicSetup`) couldn't find an export (`activateHover`) it needed, because esm.sh resolves a package's *own* transitive dependencies by loose semver range regardless of what version you've pinned elsewhere — it doesn't error at fetch time on an incompatible combination, it just silently serves a bundle missing the export, so the break only surfaces at runtime. The exact pinned versions and the reasoning for each are documented in `js/matlab-editor.js`'s header comment — re-read it (and re-verify with curl against the npm registry's declared peer-dependency ranges, not just checking that URLs resolve identically) before ever bumping these versions.

## MATLAB Scratchpad (in quiz questions, experimental)

A small "🧮 Scratchpad" toggle appears on every quiz question (`js/matlab-scratchpad.js`), opening a collapsible, ungraded MATLAB editor + Run button + output panel as a **right-side panel** next to the question card (`.quiz-layout` in `style.css`; stacks full-width below the question on screens under 900px) — for trying something out without it touching your answer, grading, or progress. It shares the same runtime as the Sandbox and live grading, so opening it doesn't trigger a second download if either of those already loaded this session.

The panel's code and open/closed state are kept in module-level state (not the DOM), specifically so they survive the quiz view's full re-render on every Next/Previous/Check Answer click — the editor instance itself is torn down and recreated against the fresh DOM each time, seeded with the preserved text, so it feels persistent across question navigation even though the underlying DOM node is new every time.

**A real bug found and fixed here:** the panel's Run/Clear buttons are *not* replaced when the panel is merely toggled closed and reopened within the same question (only the full quiz re-render replaces them) — an earlier version re-attached click listeners to those same button nodes on every reopen, so opening the panel three times stacked three listeners and clicking Run fired three concurrent runs. Fixed with a `dataset.wired` guard so each button's listeners attach exactly once per DOM node.

## Instructor mode

Visit the site with `?mode=instructor` in the URL (e.g. `index.html?mode=instructor#/instructor`) to see a full table of every question in the bank (ID, unit, topic, difficulty, cognitive level, type, tags, references) and an "Export Question Bank (JSON)" button. There's no authentication and no link to it from student-facing navigation — it's a course-maintenance convenience, not a security boundary.

## Deploying

Push to GitHub Pages as-is — it's a static site with relative paths and no build step.

## Design system at a glance

| Token | Value |
|---|---|
| Primary colour | `#0b7a6e` (teal) |
| Warning colour | `#b45309` (amber) |
| Body font | DM Sans |
| Display font | DM Serif Display |
| Mono font | DM Mono |
| Max content width | 1040 px |
| Dark mode | `body.dark-mode` class, toggled via localStorage (`js/store.js`'s progress key is unrelated — display prefs are handled entirely by `script.js`) |

Math rendering (KaTeX) is pre-wired for when later units need equations — `window.renderMath()` is called after every route render in `js/app.js`. No Unit 0 questions use math yet.

## License

Research use only. See [LICENSE.md](LICENSE.md) for full terms.
Copyright © 2026 Asad Mirza. All rights reserved.
