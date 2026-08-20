// ─────────────────────────────────────────────────────────────
// "Problem Sets" — the assignment/quiz-style companion to the multiple-
// choice question bank (js/views.js + js/bank.js). See js/problem-bank.js
// for the data shape. Dynamically imported from js/app.js the same way
// js/review-views.js and js/sandbox.js are, so students who never open
// Problem Sets don't pay for this module or its JSON on page load.
// ─────────────────────────────────────────────────────────────

import {
  UNITS, DIFFICULTIES, getUnit, getProblems, countProblems,
  countProblemsByDifficulty, validateProblemBank,
} from './problem-bank.js';
import { escapeHtml, codeBlock, wireCodeCopyButtons, difficultyBadge, errorState } from './render.js';

// Must match the constant of the same name/value read in sandbox.js's
// renderSandbox() — duplicated rather than imported so that visiting
// Problem Sets never pulls sandbox.js (and therefore matlab-runtime.js)
// into this module's graph just for a string.
const SANDBOX_PREFILL_KEY = 'bme2740:sandboxPrefill';

validateProblemBank();

// ─── Problem Sets home ──────────────────────────────────────

export function renderProblemSetsHome(container) {
  const cards = UNITS.filter(u => u.hasContent).map(u => {
    const total = countProblems(u.id);
    return `
      <a class="unit-card ${total ? '' : 'unit-card-soon'}" href="#/problems/${u.id}">
        <div class="unit-card-top"><span class="unit-card-num">Unit ${u.id}</span>${total ? '' : '<span class="soon-badge">Coming Soon</span>'}</div>
        <h3 class="unit-card-title">${escapeHtml(u.title)}</h3>
        <p class="unit-card-desc">${escapeHtml(u.description)}</p>
        <div class="unit-card-meta"><span>${total} problem set${total === 1 ? '' : 's'}</span></div>
      </a>`;
  }).join('');

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Problem Sets</span></nav>
    <div class="section">
      <div class="section-num">Assignment-Style Practice</div>
      <h1 class="section-title" style="font-size:2.1em">Problem Sets</h1>
      <div class="section-body"><p>Multi-part word problems in the style of the actual BME 2740 homework assignments and practice quizzes — work through parts a, b, c… in MATLAB, reveal hints only if you want them, then compare against a fully worked solution with comments. These are ungraded and separate from the multiple-choice Practice quizzes.</p></div>
      <div class="unit-grid">${cards}</div>
    </div>
  `;
}

// ─── Unit → difficulty picker ───────────────────────────────

export function renderProblemSetUnit(container, unitId) {
  const unit = getUnit(unitId);
  if (!unit) { container.innerHTML = errorState('That unit could not be found.'); return; }

  const counts = countProblemsByDifficulty(unit.id);
  const cards = DIFFICULTIES.map(d => {
    const n = counts[d];
    const disabled = n === 0;
    const href = disabled ? '#' : `#/problems/${unit.id}/${d}`;
    return `
      <a class="difficulty-card diff-card-${d} ${disabled ? 'difficulty-card-disabled' : ''}" href="${href}" ${disabled ? 'aria-disabled="true" tabindex="-1"' : ''}>
        ${difficultyBadge(d)}
        <div class="difficulty-card-count">${disabled ? 'Coming soon' : `${n} problem set${n === 1 ? '' : 's'}`}</div>
      </a>`;
  }).join('');

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/problems">Problem Sets</a><span>/</span><span>${escapeHtml(unit.short)}</span></nav>
    <div class="section">
      <div class="section-num">§ Unit ${unit.id}</div>
      <h1 class="section-title" style="font-size:2.1em">${escapeHtml(unit.title)} — Problem Sets</h1>
      <div class="section-body"><p>Choose a difficulty to see this unit's assignment-style problem sets.</p></div>
      <div class="dashboard-actions"><a class="btn btn-outline" href="#/unit/${unit.id}">Back to Unit ${unit.id}</a></div>
    </div>
    <div class="section">
      <h2 class="section-title">Choose a Difficulty</h2>
      <div class="difficulty-grid">${cards}</div>
    </div>
  `;
}

// ─── Problem list (accordion) ───────────────────────────────

export function renderProblemSetList(container, unitId, difficulty) {
  const unit = getUnit(unitId);
  if (!unit || !DIFFICULTIES.includes(difficulty)) { container.innerHTML = errorState('That problem set list could not be found.'); return; }

  const problems = getProblems(unit.id, difficulty);

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/problems">Problem Sets</a><span>/</span><a href="#/problems/${unit.id}">${escapeHtml(unit.short)}</a><span>/</span><span>${difficultyBadge(difficulty)}</span></nav>
    <div class="section">
      <div class="section-num">§ Unit ${unit.id}</div>
      <h1 class="section-title" style="font-size:2.1em">${escapeHtml(unit.title)} — ${difficultyBadge(difficulty)}</h1>
      <div class="section-body"><p>Click a problem to open it: read the scenario, work it in MATLAB (in your own script/Live Script, or the Sandbox), reveal hints one at a time if you get stuck, then check your work against the full worked solution.</p></div>
      <div class="dashboard-actions">
        <a class="btn btn-outline" href="#/problems/${unit.id}">← Other Difficulties</a>
        <a class="btn btn-outline" href="#/unit/${unit.id}">Back to Unit ${unit.id}</a>
      </div>
    </div>
    <div class="section">
      ${problems.length ? `<div class="wb-list" id="wbList"></div>` : `<div class="empty-state"><p>No problem sets at this difficulty yet. Check back soon.</p></div>`}
    </div>
  `;

  if (!problems.length) return;

  const list = container.querySelector('#wbList');
  list.innerHTML = problems.map(p => wbItemHtml(p)).join('');
  wireCodeCopyButtons(list);
  wireProblemItems(list, problems);
}

function wbItemHtml(p) {
  const cid = cssId(p.id);
  const partsHtml = p.parts.map(part => `<li><strong>${escapeHtml(part.label)})</strong> ${escapeHtml(part.prompt)}</li>`).join('');
  const starterHtml = p.starterCode
    ? `<div class="wb-starter"><div class="code-block-lang" style="margin-bottom:6px">Starter — copy into a blank script or Live Script</div>${codeBlock(p.starterCode, { id: `wb-starter-${cid}` })}</div>`
    : '';
  const hintsHtml = (p.hints || []).map((h, idx) => `
    <div class="wb-hint">
      <button type="button" class="hint-btn wb-hint-btn" data-hint-idx="${idx}">Show Hint ${idx + 1}</button>
      <div class="hint-box" hidden>${escapeHtml(h)}</div>
    </div>`).join('');

  return `
    <div class="wb-item" data-problem-id="${escapeHtml(p.id)}">
      <button type="button" class="wb-item-header" aria-expanded="false">
        <span class="wb-item-title">${escapeHtml(p.title)}</span>
        <span class="wb-item-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="wb-item-body" hidden>
        ${p.context ? `<p class="wb-context">${escapeHtml(p.context)}</p>` : ''}
        <ol class="wb-parts">${partsHtml}</ol>
        ${starterHtml}
        <div class="dashboard-actions" style="margin:12px 0 4px">
          ${p.starterCode ? `<button type="button" class="btn btn-outline btn-sm wb-sandbox-btn">🧮 Open in Sandbox</button>
          <button type="button" class="btn btn-outline btn-sm wb-download-btn">⬇ Download as .m</button>` : ''}
        </div>
        ${hintsHtml ? `<div class="wb-hints">${hintsHtml}</div>` : ''}
        <button type="button" class="btn btn-primary wb-solution-btn" style="margin-top:14px">Reveal Worked Solution</button>
        <div class="wb-solution" hidden>
          ${codeBlock(p.solutionCode, { id: `wb-sol-${cid}` })}
          ${p.solutionExplanation ? `<div class="feedback-banner feedback-correct" style="margin-top:10px"><div class="feedback-headline">Walkthrough</div><p class="feedback-explanation">${escapeHtml(p.solutionExplanation)}</p></div>` : ''}
          <div class="feedback-meta">Concept: <strong>${escapeHtml(p.concept || '—')}</strong>${p.references && p.references.length ? ` · Reference: ${p.references.map(escapeHtml).join(', ')}` : ''}</div>
        </div>
      </div>
    </div>`;
}

function wireProblemItems(list, problems) {
  list.querySelectorAll('.wb-item').forEach(itemEl => {
    const p = problems.find(pr => pr.id === itemEl.dataset.problemId);
    if (!p) return;

    const header = itemEl.querySelector('.wb-item-header');
    const body = itemEl.querySelector('.wb-item-body');
    header.addEventListener('click', () => {
      const open = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });

    itemEl.querySelectorAll('.wb-hint').forEach(hintEl => {
      const btn = hintEl.querySelector('.wb-hint-btn');
      const box = hintEl.querySelector('.hint-box');
      btn.addEventListener('click', () => {
        box.hidden = !box.hidden;
        btn.textContent = box.hidden ? btn.textContent.replace('Hide', 'Show') : btn.textContent.replace('Show', 'Hide');
      });
    });

    const solutionBtn = itemEl.querySelector('.wb-solution-btn');
    const solutionBox = itemEl.querySelector('.wb-solution');
    if (solutionBtn) {
      solutionBtn.addEventListener('click', () => {
        solutionBox.hidden = !solutionBox.hidden;
        solutionBtn.textContent = solutionBox.hidden ? 'Reveal Worked Solution' : 'Hide Worked Solution';
      });
    }

    const sandboxBtn = itemEl.querySelector('.wb-sandbox-btn');
    if (sandboxBtn) {
      sandboxBtn.addEventListener('click', () => {
        try { sessionStorage.setItem(SANDBOX_PREFILL_KEY, p.starterCode); } catch (e) { /* storage unavailable — Sandbox just opens with its default example instead */ }
        location.hash = '#/sandbox';
      });
    }

    const downloadBtn = itemEl.querySelector('.wb-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const blob = new Blob([p.starterCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p.id}.m`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }
  });
}

function cssId(id) { return id.replace(/[^a-z0-9]/gi, '-'); }
