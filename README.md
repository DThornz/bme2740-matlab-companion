# BME 2740 MATLAB Companion

**Author:** Asad Mirza, PhD

An interactive, browser-based MATLAB and numerical methods practice tool for **BME 2740 — Biomedical Engineering Modeling and Simulation** at FIU.

Students can choose a unit, topic, and difficulty, complete practice questions, and view explanations for their answers. Progress is stored locally in the browser.

## Current Status

The app is complete, including the quiz engine, progress tracking, search, MATLAB reference, instructor mode, Browse mode, and Review section.

All 7 units have question banks and Review content based on the course lectures, assignments, and quizzes:

* **Unit 0 — MATLAB Overview:** 625 questions
* **Unit 1 — MATLAB, deeper pass:** 511 questions
* **Unit 2 — Linear Systems and Models:** 400 questions
* **Unit 3 — Numerical Quadrature and Interpolation:** 200 questions
* **Unit 4 — Numerical Integration:** 300 questions
* **Unit 5 — Numerical Integration Extended:** 300 questions
* **Unit 6 — Nonlinear Equations and Optimization:** 300 questions

**Total: ~2,600 questions**

The Review section mirrors the question bank, with one chapter for each topic.

## How It Works

The site is a static JavaScript application with no build step or server-side routing. It can be deployed directly to GitHub Pages.

Because it uses native ES modules, it must be served through a web server rather than opened directly with `file://`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Structure

```text
index.html              SPA shell
style.css               Site and application styles
script.js               Accessibility panel

data/
  units.js              Course structure and materials
  functions.js          MATLAB function reference
  questions/
    unit0.json .. unit6.json
  review/
    md-parser.js
    nav.js
    content.js
    content/unit0/ .. unit6/

js/
  app.js                 Hash router and startup
  views.js               Screen renderers
  bank.js                Question bank loading and validation
  quiz.js                Quiz building, grading, and scoring
  store.js               localStorage progress
  session.js             sessionStorage for active quizzes
  render.js              Shared rendering helpers
  sandbox.js             MATLAB Sandbox
  matlab-runtime.js      MATLAB runtime API
  matlab-worker.js       RunMat Web Worker
  matlab-editor.js       CodeMirror editor
  matlab-lsp.js          MATLAB autocomplete/hover
  matlab-lsp-worker.js   RunMat LSP worker
  matlab-scratchpad.js   Quiz scratchpad
  review-views.js        Review pages
  review-tryit.js        Interactive Review examples
  review-store.js        Review progress
```

## Adding a New Unit

1. Add `data/questions/unitN.json`.
2. Add the file to `QUESTION_FILES` in `js/bank.js`.
3. Set `hasContent` to `true` in `data/units.js`.

The rest of the quiz interface updates automatically.

Review chapters are added separately under:

```text
data/review/content/unitN/chapterId.md
```

Then add the chapter to `data/review/nav.js`.

## Question Authoring

Questions are stored as plain objects. The main fields are:

| Field                           | Description                               |
| ------------------------------- | ----------------------------------------- |
| `id`                            | Unique question ID                        |
| `unit`, `topic`, `difficulty`   | Course organization                       |
| `type`                          | Question type                             |
| `cognitiveLevel`                | Bloom-style cognitive level               |
| `question`                      | Question text                             |
| `code`                          | Optional MATLAB code                      |
| `options`                       | Answer choices or matching/ordering items |
| `correctAnswer`                 | Correct answer                            |
| `acceptableAnswers`             | Accepted answers for `code-entry`         |
| `explanation`                   | Feedback shown after answering            |
| `optionExplanations`            | Explanation for each choice               |
| `concept`, `tags`, `references` | Search and instructor metadata            |
| `commonMistakes`                | Common error feedback                     |
| `hint`                          | Optional hint                             |

Supported question types include multiple choice, true/false, output prediction, code debugging, code completion, scenarios, select-all, numeric, matching, ordering, and code entry.

`validateQuestionBank()` checks for duplicate IDs and invalid or missing fields.

## Progress Storage

Quiz progress is stored in browser `localStorage` under:

```text
bme2740_progress
```

No student identity is stored with the progress data.

Students can export their progress as JSON and import it later on another browser or device.

Active quizzes and recent results use `sessionStorage`.

## Browse Mode

Browse mode provides a read-only view of the question bank. Questions can be filtered by unit, topic, difficulty, and keyword.

Answers and explanations are shown immediately. Browse mode does not affect quiz progress.

## MATLAB Sandbox

The experimental MATLAB Sandbox lets students run MATLAB code directly in the browser using [RunMat](https://runmat.com) compiled to WebAssembly.

Execution runs in a Web Worker so an infinite loop cannot freeze the main page.

The runtime is downloaded only when the Sandbox is used and is cached for later visits.

The sandbox also supports plotting through WebGPU when available.

### RunMat Compatibility

The sandbox is intended for practice, not as a full MATLAB replacement.

Known differences include:

* Undefined structs must be initialized with `struct()`.
* Some failed assignments leave a `0` value instead of an undefined variable.
* Anonymous functions with inline ranges may fail; assigning the range first works.
* Cell-array `switch` cases are not supported.
* `fminsearch` is not implemented.
* `plot(M)` does not match MATLAB's column-wise behavior for matrix input.
* `ode15s`, `ode23s`, `ode23tb`, `integral`, `spline`, `ppval`, `quiver`, `pdist2`, and Symbolic Math Toolbox functions have not been fully verified.
* MATLAB Profiler, App Designer, and filesystem-based file I/O are not available in the browser sandbox.

Functions that have been tested, including basic control flow, indexing, cell arrays, structs, plotting, and the course's main numerical methods, generally match MATLAB behavior.

## Review Section

The Review section provides textbook-style material alongside the quizzes.

Each question-bank topic has a corresponding Review chapter written in Markdown.

Review chapters can contain:

* Explanations
* Lists and tables
* MATLAB code
* Interactive "Try it" examples
* Callouts
* Practice links
* Equations and diagrams

Interactive examples use the same MATLAB runtime as the Sandbox.

Students can also mark chapters as reviewed. Review progress is stored separately from quiz progress.

## Live MATLAB Grading

Live MATLAB grading is an experimental option under:

**Display Settings → Live MATLAB grading**

When enabled, `code-entry` answers are executed and compared with the reference solution. Both printed output and resulting variable state are checked.

If the MATLAB runtime cannot load, grading falls back to the normal answer comparison.

Behavioral grading cannot detect every form of hardcoded answer.

## Autocomplete

The Sandbox has an optional CodeMirror 6 editor with RunMat's LSP for autocomplete and hover documentation.

Autocomplete runs in a separate worker and is only downloaded when enabled.

## MATLAB Scratchpad

Quiz questions include an optional MATLAB Scratchpad for testing code without affecting the submitted answer or quiz progress.

It shares the same runtime as the Sandbox and live grading.

## Exam Mode

Exam mode supports optional time limits of:

**10, 20, 30, 45, or 60 minutes**

The timer uses an absolute deadline so it remains accurate across navigation, refreshes, and background tabs.

When time expires, the quiz is submitted automatically.

## Instructor Mode

Instructor mode is available through:

```text
?mode=instructor
```

It provides a searchable table of the question bank and a JSON export.

There is no authentication, so this should not be treated as a security feature.

## Analytics

The site uses Cloudflare Web Analytics for aggregate visit statistics.

No cookies or personally identifiable student tracking are used.

## Deployment

The project can be deployed directly to GitHub Pages.

There is no build step.

## Design

| Setting           | Value            |
| ----------------- | ---------------- |
| Primary colour    | `#0b7a6e`        |
| Warning colour    | `#b45309`        |
| Body font         | DM Sans          |
| Display font      | DM Serif Display |
| Mono font         | DM Mono          |
| Max content width | 1040 px          |
| Dark mode         | `body.dark-mode` |

Review chapters for Units 2–6 use KaTeX for equations.

## License

Research use only. See `LICENSE.md` for full terms.

Copyright © 2026 Asad Mirza. All rights reserved.
