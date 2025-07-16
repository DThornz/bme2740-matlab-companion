# BME 2740 MATLAB Companion

**Author:** Asad Mirza (DThornz)

An interactive, browser-only MATLAB and numerical-methods practice tool for **BME 2740 — Biomedical Engineering Modeling and Simulation** (FIU). Students pick a unit, a topic, and a difficulty, work through questions, and get an explanation for every answer — right or wrong. Progress is tracked locally in the browser. There's no backend, no account, and no student data ever leaves the machine it's running on.

Built on the shared [dthornz.github.io](https://dthornz.github.io/website-cv-tools/) page template — nav, hero, typography, accessibility panel, and dark mode all come from that design system.

---

## Current status

The app itself — router, quiz engine, progress tracking, search, MATLAB reference, instructor mode, browse mode — is done. Two units have full question banks:

- **Unit 0 — MATLAB Overview:** 600 questions (6 topics × 4 difficulties × 25 each), fact-checked topic by topic.
- **Unit 1 — MATLAB, deeper pass:** 400 questions (4 topics × 4 difficulties × 25 each) covering functions/multiple I/O, logical indexing, plotting patterns, and reading/predicting output.

Units 2–6 exist as metadata only (topics, objectives, course materials) and show "Coming Soon" until I get around to adding them. See "Adding a new unit" below.

---

## How it works (no build step)

This is a static site — point a web server at `index.html` and it runs. One shell page holds the nav, an empty `#appRoot`, the accessibility panel, and the footer; everything else is rendered by JavaScript based on the URL hash (`#/unit/2/topic/solving-ax-b`, `#/quiz/active`, ...). No server-side routing, so it deploys to GitHub Pages as-is.

It uses native ES modules, so you can't just double-click `index.html` — browsers won't load module scripts over `file://`. Serve it locally instead:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Project structure

```
index.html              SPA shell: nav, #appRoot, accessibility panel, footer
style.css                Template design system + application UI
script.js                 Accessibility panel logic (unchanged from the template)

data/
  units.js                 Course structure: units, topics, objectives, course materials
  functions.js              MATLAB function reference entries
  questions/
    unit0.js                 Unit 0 question bank (600 questions)
    unit1.js                 Unit 1 question bank (400 questions)

js/
  app.js                    Hash router + bootstrap
  views.js                   All screen renderers (dashboard, unit, topic, quiz config, quiz, results, review, reference, browse, search, instructor)
  bank.js                    Combines units.js + question modules; counts, lookups, validateQuestionBank()
  quiz.js                    Quiz session builder, answer grading, scoring — no DOM code
  store.js                   localStorage-backed progress tracking (falls back to in-memory if storage is unavailable)
  session.js                 sessionStorage for the in-progress quiz / last results (survives a refresh)
  render.js                  Shared DOM helpers (escaping, code blocks with copy button, progress bars, badges)
  sandbox.js                 MATLAB Sandbox view (#/sandbox) — see "MATLAB Sandbox" below
  matlab-runtime.js           Main-thread API for code execution: spawns/drives the worker, handles timeouts/reset
  matlab-worker.js            Web Worker that loads RunMat (WASM) from a CDN and executes submitted code
  matlab-editor.js            CodeMirror 6 editor wrapper, optionally wired to the LSP for completions/hover
  matlab-lsp.js                Main-thread API for autocomplete/hover — separate worker from execution
  matlab-lsp-worker.js         Web Worker that loads RunMat's LSP (WASM) from a CDN
  matlab-scratchpad.js         Collapsible MATLAB scratchpad panel embedded in quiz questions
```

## Adding a new unit

1. Write `data/questions/unitN.js`, exporting `unitNQuestions` in the same shape as `unit0Questions` (topicId → difficulty → `Question[]`).
2. In `js/bank.js`, import it and add it to `QUESTION_MODULES`.
3. In `data/units.js`, flip that unit's `hasContent` to `true`.

That's it — topic cards, difficulty cards, quiz config, counts, search, and instructor mode all read from the bank dynamically.

## Question authoring guide

Every question is a plain object. Not every field is required for every type — see `validateQuestionBank()` in `js/bank.js` for what's actually enforced.

| Field | Notes |
|---|---|
| `id` | Unique, e.g. `U0-ENV-B01` (`U{unit}-{topic code}-{B/I/A/X}{number}`) |
| `unit`, `topic`, `difficulty` | Must match an entry in `data/units.js`; difficulty is `beginner / intermediate / advanced / expert` |
| `type` | See supported types below |
| `cognitiveLevel` | `remember / understand / apply / analyze / evaluate / create` |
| `question` | The prompt text |
| `code`, `language` | Optional MATLAB snippet, rendered in a copyable code block |
| `options` | Choices (choice types, select-all), steps to reorder (ordering), or left-hand items (matching) |
| `matchOptions` | Right-hand pool, matching questions only |
| `correctAnswer` | Shape depends on `type` (see below) |
| `acceptableAnswers` | `code-entry` only — accepted strings, compared whitespace-insensitively |
| `explanation` | Shown after answering, right or wrong |
| `optionExplanations` | Parallel to `options`, one explanation per choice (choice types only) |
| `concept`, `tags`, `references` | Used by search and instructor mode |
| `commonMistakes` | Shown in the feedback panel |
| `hint` | Optional "Show Hint" text, never affects grading |

**`type` values and their `correctAnswer` shape:**

- `multiple-choice`, `true-false`, `output-prediction`, `code-debug`, `code-completion`, `scenario` — single-select; `correctAnswer` is the index into `options`.
- `select-all` — `correctAnswer` is an array of correct indices into `options`.
- `numeric` — `correctAnswer` is `{ value, tolerance }`.
- `matching` — `correctAnswer[i]` is the index into `matchOptions` that pairs with `options[i]`.
- `ordering` — `correctAnswer` is the array of `options` indices, in correct order.
- `code-entry` — no `correctAnswer`; graded against `acceptableAnswers` after stripping whitespace (case- and semicolon-sensitive, matching real MATLAB).

Display order for options/steps is shuffled per attempt without touching `correctAnswer` — see `prepareForDisplay()` in `js/quiz.js` before changing the engine.

Run `validateQuestionBank()` (runs automatically, logs to the console) after adding questions — it catches duplicate IDs, bad unit/topic/difficulty/type references, and missing required fields.

## Progress storage

Progress lives in `localStorage` under `bme2740_progress` — no identity attached, nothing sent anywhere. If `localStorage` is unavailable (private browsing, disabled storage), `js/store.js` falls back to an in-memory object, so the app still works, it just won't remember anything after a reload. "Reset My Progress" on the dashboard clears it after a confirmation prompt.

**Export / Import** — since progress lives only in one browser's storage, it's one "clear site data" away from gone, and doesn't follow a student to a new device. Export downloads a JSON snapshot; Import replaces current progress with a chosen file (with a confirmation prompt, same as Reset). The format is versioned on purpose so old exports keep working as the app changes: `sanitizeProgress()` in `js/store.js` rebuilds a valid progress object field by field from whatever an import file actually contains, defaulting anything missing or malformed rather than trusting it.

The in-progress quiz and most recent results live separately in `sessionStorage` (`js/session.js`), so a mid-quiz refresh doesn't lose your place, but a closed tab doesn't leave stale state behind.

## Browse mode (`#/browse`)

A read-only way to page through the question bank — filterable by unit/topic/difficulty/keyword — with the answer and explanation shown immediately, no "answer to continue" gate. Reach it from "Browse All Questions" on the dashboard, or "Browse Questions" on any unit/topic page (pre-scoped to that unit/topic). It never touches progress or grading — it's for previewing content, not self-testing.

## MATLAB Sandbox (experimental — `#/sandbox`)

A free-play page where students write real MATLAB syntax and see it run, client-side, via [RunMat](https://runmat.com) (open source, Apache-2.0) compiled to WebAssembly. Nothing downloads until a student visits the page and clicks Run.

**How it's wired:**
- `js/matlab-worker.js` runs the interpreter in a **Web Worker**, not the main thread — required, not optional. RunMat's `executeRequest()` blocks synchronously with no yield to the event loop, so a student's `while true; end` on the main thread would freeze the whole tab. Running it in a worker means the main thread can hard-kill a runaway loop with `Worker.terminate()` and keep going.
- `js/matlab-runtime.js` is the main-thread API — spawns the worker, message-passes to it, owns timeout and reset logic.
- The WASM module is pulled at runtime from jsdelivr's CDN, not bundled into this repo. It's a real download (~15 MB compressed), fetched only the first time a student actually uses the page.
- The `.wasm` binary is cached through the CacheStorage API so a repeat visit skips the network entirely. The download progress bar shown in the UI reflects real bytes transferred, not a fake animation.
- `session.clearWorkspace()` runs before every execution so one run's variables can't leak into the next.

**Why the top-level `runmat` npm package isn't used directly:** its published entry point is currently broken (v0.6.1's `package.json` points at a build directory missing from the actual tarball). The browser build (`dist/pkg-web/*`) is published correctly and is what a no-build-step static site wants anyway, so this project imports it directly.

**"↻ Reload Runtime"** terminates the worker, spawns a fresh one, and cache-busts the CDN URL — the fix for a stuck runtime (corrupted cache, a WASM panic, or a load that failed and needs a clean retry).

**Memory:** the WASM heap stays resident in the worker for as long as the page is open, even after navigating away from the sandbox — live grading (below) intentionally reuses the same runtime instead of re-downloading it. The sandbox shows a live memory readout, and Reload also frees it.

**Plotting** goes through RunMat's WebGPU pipeline: transfer the sandbox's canvas to the worker (`OffscreenCanvas`), bind a plot surface once, then present the current figure onto it after each run. Earlier drafts of this had a real bug — figuring out whether a run actually produced a plot by comparing a "current figure handle" before and after execution, which turned out to be a stable, reused value that doesn't change between runs, so plots that succeeded internally never got drawn. It now checks the execution result's own `figuresTouched` list, which correctly reflects what a given run actually did. What can't be guaranteed is whether WebGPU is available in a given student's browser — if it isn't, the output panel says so explicitly instead of just showing a blank canvas.

**Known MATLAB-compatibility gaps** (found by testing, not exhaustive — this is a practice sandbox, not a certified MATLAB clone):
- `s.field = value` on an undefined `s` does not auto-create a struct the way real MATLAB does. Write `s = struct();` first.
- If an assignment's right side errors (e.g. mismatched array sizes), the target variable ends up `0` and gets echoed, instead of staying undefined with no output.
- Calling an anonymous function with an inline range at the call site fails: `f = @(x) x.^2 + 1; f(1:5)` errors with "Slicing only supported on tensors." Assign the range to a variable first — `r = 1:5; f(r)` — and it works fine.
- `switch`/`case` with a cell-array case (`case {'a','b'}`) for OR-matching multiple values isn't supported — use separate `case` lines, or `if`/`elseif` with `||`.
- `fminsearch` isn't implemented in this build; `fzero` and `fminbnd` both work correctly.
- Everything else tested — default numeric display, control flow, indexing, single-value `switch`/`case`, `disp`/`fprintf`, cell arrays, structs once initialized, string functions, and the linear-algebra/numerical-methods functions in the course — matched real MATLAB.

## Live MATLAB grading (experimental, opt-in)

A toggle under **Display Settings (⚙) → "Live MATLAB grading"**, off by default. Off: `code-entry` questions are graded by string comparison against `acceptableAnswers`, as before. On: Check Answer actually runs the student's code *and* the question's reference answer through the sandbox runtime and compares what happened, shown transparently in the feedback panel. No existing questions needed to change — the expected result is computed from the reference answer at grading time.

Grading compares both printed output and post-run variable state, not just stdout — `x = 42;` and `x = 41;` produce identical (empty) output, so output alone isn't enough to catch a wrong value.

**Known limitation:** this can't catch a student special-casing the expected answer (hardcoding `disp(2)` for a question that expects `mod(17,5)`) — behavioral grading in general can't tell the difference. Falls back to string-comparison grading automatically if the runtime fails to load, so a sandbox problem never blocks a student from answering.

## Autocomplete (experimental, opt-in — Sandbox only)

A toggle inside the Sandbox swaps the plain textarea for a [CodeMirror 6](https://codemirror.net) editor backed by real completions and hover docs from RunMat's LSP module. Runs in its own worker, separate from code execution, so a hung run never blocks completions and the download only happens for students who opt in.

**Cost:** another ~47 MB WASM module, roughly 10 seconds to download and initialize on a normal connection — the toggle says so before downloading anything. CodeMirror itself (loaded whenever the Sandbox opens, autocomplete on or off) is a trivial ~100–200 KB.

**Version pinning matters here.** CodeMirror's packages need to resolve to a single consistent build across `codemirror`, `@codemirror/autocomplete`, `@codemirror/view`, etc. — pulling them from a CDN naively can silently mix incompatible builds and break at runtime with cryptic errors. The pinned versions and reasoning are documented in `js/matlab-editor.js`'s header — read that before bumping any of them.

## MATLAB Scratchpad (in quiz questions, experimental)

A "🧮 Scratchpad" toggle on every quiz question (`js/matlab-scratchpad.js`) opens a collapsible, ungraded editor + Run button + output panel as a side panel next to the question (stacks below it on narrow screens) — for trying something out without touching your answer or progress. Shares the same runtime as the Sandbox and live grading, so it doesn't trigger a second download if either already loaded this session.

## Exam mode timer

Choosing Exam mode in the quiz config reveals an optional time limit (10/20/30/45/60 minutes, or none). The countdown is anchored to an absolute deadline rather than a locally-decremented counter, so it can't drift or reset across question navigation, a page refresh, or the tab being backgrounded. Hitting zero auto-submits the quiz through the normal results path — anything unanswered is graded as skipped.

## Instructor mode

Visit with `?mode=instructor` in the URL (e.g. `index.html?mode=instructor#/instructor`) for a full table of every question in the bank and a JSON export button. There's no authentication and no link to it from student-facing navigation — it's a course-maintenance convenience, not a security boundary.

## Deploying

Push to GitHub Pages as-is — static site, relative paths, no build step. Pages is already enabled on this repo (serving `main` at the root).

**Mobile note:** an earlier version rendered "left-justified with a blank strip on the right" on phones. The cause was an invisible dropdown menu in the shared nav that was still contributing to the page's layout width even while hidden. Fixed with `overflow-x:hidden` on the page body plus a mobile-specific fix to the dropdown's positioning.

## Design system at a glance

| Token | Value |
|---|---|
| Primary colour | `#0b7a6e` (teal) |
| Warning colour | `#b45309` (amber) |
| Body font | DM Sans |
| Display font | DM Serif Display |
| Mono font | DM Mono |
| Max content width | 1040 px |
| Dark mode | `body.dark-mode` class, toggled via localStorage (separate from progress storage) |

Math rendering (KaTeX) is pre-wired for when later units need equations — no Unit 0/1 questions use math yet.

## License

Research use only. See [LICENSE.md](LICENSE.md) for full terms.
Copyright © 2026 Asad Mirza. All rights reserved.
