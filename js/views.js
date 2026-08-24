// ─────────────────────────────────────────────────────────────
// View renderers. Each render* function fully replaces the
// contents of `container` and wires up its own event handlers.
// Internal navigation uses real <a href="#/..."> anchors, which
// the browser's own hash handling + our hashchange listener
// (see app.js) picks up — no click-interception needed.
// ─────────────────────────────────────────────────────────────

import { UNITS, DIFFICULTIES, getUnit, getTopic, countQuestions, countByDifficulty, getAllQuestions, getQuestions, getUnitQuestions } from './bank.js';
import { FUNCTION_REFERENCE } from '../data/functions.js';
// Lightweight, always-loaded Review index (see that file's header) — used
// here only to show "Review this topic →" cross-links and search hits.
// The actual chapter content is dynamically imported by review-views.js.
import { REVIEW_CHAPTERS, findChapterForTopic, chaptersForUnit, reviewChapterHref, reviewUnitHref } from '../data/review/nav.js';
import * as store from './store.js';
import * as quiz from './quiz.js';
import * as sessionStore from './session.js';
import { escapeHtml, codeBlock, wireCodeCopyButtons, progressBar, difficultyBadge, emptyState, errorState } from './render.js';
// Safe to import eagerly — this pulls in matlab-runtime.js and matlab-editor.js,
// but neither does any heavy work (spawning a worker, downloading CodeMirror)
// until the scratchpad panel is actually opened by a student.
import { scratchpadToggleMarkup, scratchpadPanelMarkup, wireScratchpad } from './matlab-scratchpad.js';

// ─── Dashboard ──────────────────────────────────────────────

export function renderDashboard(container) {
  const stats = store.getOverallStats();
  const weakest = store.getWeakestTopics(3);
  const recent = store.getRecentTopics(4);

  const statCards = [
    { label: 'Questions Answered', value: stats.questionsAnswered },
    { label: 'Accuracy', value: stats.accuracy === null ? '—' : `${stats.accuracy}%` },
    { label: 'Current Streak', value: stats.currentStreak },
    { label: 'Best Streak', value: stats.bestStreak },
  ].map(s => `<div class="stat-card"><div class="stat-num">${s.value}</div><div class="stat-label">${escapeHtml(s.label)}</div></div>`).join('');

  const weakestHtml = weakest.length
    ? weakest.map(w => {
        const topic = getTopic(w.unit, w.topic);
        return `<li><a href="#/unit/${w.unit}/topic/${w.topic}">${escapeHtml(topic ? topic.title : w.topic)}</a> — ${w.accuracy}%</li>`;
      }).join('')
    : '<li class="dim-item">Answer a few questions to see your weak topics here.</li>';

  const recentHtml = recent.length
    ? recent.map(r => {
        const topic = getTopic(r.unit, r.topic);
        return `<li><a href="#/unit/${r.unit}/topic/${r.topic}">${escapeHtml(topic ? topic.title : r.topic)}</a></li>`;
      }).join('')
    : '<li class="dim-item">No practice sessions yet.</li>';

  const unitCards = UNITS.map(unit => unitCardHtml(unit)).join('');

  container.innerHTML = `
    <div class="hero app-hero">
      <div class="hero-kicker">BME 2740 · Biomedical Engineering Modeling and Simulation</div>
      <h1 class="hero-title">MATLAB Practice &amp; Modeling Companion</h1>
      <p class="hero-sub">Build fluency in MATLAB, numerical methods, and computational modeling through progressive, self-paced practice aligned with BME 2740. This is a practice companion, not a replacement for course instruction.</p>
      <div class="hero-actions">
        <a href="#/unit/0" class="btn btn-primary">Start Practicing</a>
        <a href="#/learn" class="btn btn-primary">Review the Material</a>
        <a href="#/problems" class="btn btn-primary">Problem Sets</a>
        <a href="#units" class="btn btn-ghost">Explore Course Topics</a>
      </div>
    </div>

    <div class="callout" style="margin-bottom:40px">
      <div class="callout-title">Review vs. Practice</div>
      <strong>Review</strong> teaches the material: read explanations and run examples. <strong>Practice</strong> (the quizzes below) tests it and is <strong>not</strong> official graded assessment. Results shown here are a <strong>Practice Score</strong>, not a course grade.
    </div>

    <div class="section">
      <div class="section-num">Your Progress</div>
      <h2 class="section-title">Dashboard</h2>
      <div class="stat-grid">${statCards}</div>
      <div class="dashboard-columns">
        <div>
          <h3 class="mini-heading">Needs Practice</h3>
          <ul class="mini-list">${weakestHtml}</ul>
        </div>
        <div>
          <h3 class="mini-heading">Recently Practiced</h3>
          <ul class="mini-list">${recentHtml}</ul>
        </div>
      </div>
      <div class="dashboard-actions">
        <a href="#/quiz/config?unit=all&topic=weak&difficulty=mixed" class="btn btn-outline">Practice Weak Topics</a>
        <a href="#/browse" class="btn btn-outline">Browse All Questions</a>
        <a href="#/reference" class="btn btn-outline">MATLAB Function Reference</a>
        <a href="#/sandbox" class="btn btn-outline">MATLAB Sandbox <span class="soon-badge" style="margin-left:6px">Experimental</span></a>
        <button type="button" class="btn btn-outline" id="exportProgressBtn">Export Progress</button>
        <button type="button" class="btn btn-outline" id="importProgressBtn">Import Progress</button>
        <input type="file" id="importProgressInput" accept="application/json,.json" hidden>
        <button type="button" class="btn btn-outline" id="resetProgressBtn">Reset My Progress</button>
      </div>
      <div id="progressIoMsg" class="input-hint" style="margin-top:10px"></div>
    </div>

    <div class="section" id="units">
      <div class="section-num">§ Units</div>
      <h2 class="section-title">Course Units</h2>
      <div class="unit-grid">${unitCards}</div>
    </div>
  `;

  const resetBtn = container.querySelector('#resetProgressBtn');
  resetBtn.addEventListener('click', () => {
    const ok = window.confirm('This will erase all locally stored practice progress on this device. This cannot be undone.\n\nContinue?');
    if (!ok) return;
    store.resetProgress();
    renderDashboard(container);
  });

  const ioMsg = container.querySelector('#progressIoMsg');
  container.querySelector('#exportProgressBtn').addEventListener('click', () => {
    const json = store.exportProgressJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bme2740-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    ioMsg.textContent = 'Progress exported.';
  });

  const importInput = container.querySelector('#importProgressInput');
  container.querySelector('#importProgressBtn').addEventListener('click', () => {
    const ok = window.confirm('Importing will REPLACE all locally stored practice progress on this device with the contents of the file you pick. This cannot be undone.\n\nContinue?');
    if (!ok) return;
    importInput.value = '';
    importInput.click();
  });
  importInput.addEventListener('change', async () => {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { warnings } = store.importProgressJSON(text);
      // renderDashboard() below rebuilds the whole container (including a
      // fresh #progressIoMsg), so the message has to be set on that new
      // element afterward — setting it on the pre-rerender `ioMsg` reference
      // here would just get immediately thrown away.
      renderDashboard(container);
      container.querySelector('#progressIoMsg').textContent = warnings.length ? `Progress imported. ${warnings.join(' ')}` : 'Progress imported.';
    } catch (e) {
      ioMsg.textContent = `Import failed: ${e && e.message ? e.message : e}`;
    }
  });
}

function unitCardHtml(unit) {
  const total = countQuestions(unit.id);
  const accuracy = store.getUnitAccuracy(unit.id);
  const attempted = store.getUnitAttemptedCount(unit.id);
  const comingSoon = !unit.hasContent;
  const progressPct = total ? Math.min(100, Math.round((attempted / total) * 100)) : 0;
  const hasReview = chaptersForUnit(unit.id).length > 0;

  return `
    <a class="unit-card ${comingSoon ? 'unit-card-soon' : ''}" href="#/unit/${unit.id}">
      <div class="unit-card-top">
        <span class="unit-card-num">Unit ${unit.id}</span>
        ${comingSoon ? '<span class="soon-badge">Coming Soon</span>' : ''}
      </div>
      <h3 class="unit-card-title">${escapeHtml(unit.title)}</h3>
      <p class="unit-card-desc">${escapeHtml(unit.description)}</p>
      <div class="unit-card-meta">
        <span>${unit.topics.length} topic${unit.topics.length === 1 ? '' : 's'}</span>
        <span>${total} question${total === 1 ? '' : 's'}</span>
        ${accuracy !== null ? `<span>${accuracy}% accuracy</span>` : ''}
        ${hasReview ? '<span>📖 Review available</span>' : ''}
      </div>
      ${total ? `<div class="unit-card-progress">
        ${progressBar(progressPct, { label: `${unit.title} progress` })}
        <span class="unit-card-pct">${progressPct}% complete</span>
      </div>` : ''}
    </a>`;
}

// ─── Unit view ──────────────────────────────────────────────

export function renderUnit(container, unitId) {
  const unit = getUnit(unitId);
  if (!unit) { container.innerHTML = errorState('That unit could not be found.'); return; }

  const objectives = unit.objectives.length
    ? `<ul class="obj-list">${unit.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul>`
    : '';
  const materials = unit.materials.length
    ? `<div class="pill-row">${unit.materials.map(m => `<span class="pill">${escapeHtml(m)}</span>`).join('')}</div>`
    : '';

  const topicsHtml = unit.topics.length
    ? `<div class="topic-grid">${unit.topics.map(t => topicCardHtml(unit, t)).join('')}</div>`
    : emptyState('Topics for this unit haven’t been added yet. Check back soon.');

  const total = countQuestions(unit.id);
  const hasReview = chaptersForUnit(unit.id).length > 0;

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><span>${escapeHtml(unit.title)}</span></nav>
    <div class="section">
      <div class="section-num">§ Unit ${unit.id}</div>
      <h1 class="section-title" style="font-size:2.1em">${escapeHtml(unit.title)}</h1>
      <div class="section-body"><p>${escapeHtml(unit.description)}</p></div>
      ${objectives ? `<h3 class="mini-heading">Learning Objectives</h3>${objectives}` : ''}
      ${materials ? `<h3 class="mini-heading">Course Material</h3>${materials}` : ''}
      <div class="dashboard-actions">
        ${hasReview ? `<a class="btn btn-primary" href="${reviewUnitHref(unit.id)}">📖 Review This Unit</a>` : ''}
        ${total ? `<a class="btn btn-outline" href="#/quiz/config?unit=${unit.id}&topic=all&difficulty=mixed">Random Quiz — Whole Unit (${total} questions)</a><a class="btn btn-outline" href="#/browse?unit=${unit.id}">Browse Questions</a>` : ''}
        <a class="btn btn-outline" href="#/problems/${unit.id}">📝 Problem Sets (assignment-style)</a>
      </div>
    </div>
    <div class="section">
      <h2 class="section-title">Topics</h2>
      ${topicsHtml}
    </div>
  `;
}

function topicCardHtml(unit, topic) {
  const total = countQuestions(unit.id, topic.id);
  const accuracy = store.getTopicAccuracy(unit.id, topic.id);
  const pct = accuracy === null ? 0 : accuracy;
  const soon = total === 0;
  return `
    <a class="topic-card ${soon ? 'topic-card-soon' : ''}" href="#/unit/${unit.id}/topic/${topic.id}">
      <h3 class="topic-card-title">${escapeHtml(topic.title)}</h3>
      <p class="topic-card-desc">${escapeHtml(topic.description)}</p>
      ${soon
        ? '<span class="soon-badge">Coming Soon</span>'
        : `<div class="topic-card-progress">
             ${progressBar(pct, { label: `${topic.title} accuracy` })}
             <span class="topic-card-pct">${accuracy === null ? `${total} q` : `${accuracy}%`}</span>
           </div>`
      }
    </a>`;
}

// ─── Topic view (difficulty selection) ─────────────────────

export function renderTopic(container, unitId, topicId) {
  const unit = getUnit(unitId);
  const topic = getTopic(unitId, topicId);
  if (!unit || !topic) { container.innerHTML = errorState('That topic could not be found.'); return; }

  const counts = countByDifficulty(unitId, topicId);
  const cards = DIFFICULTIES.map(d => {
    const n = counts[d];
    const disabled = n === 0;
    const href = disabled ? '#' : `#/quiz/config?unit=${unitId}&topic=${topicId}&difficulty=${d}`;
    return `
      <a class="difficulty-card diff-card-${d} ${disabled ? 'difficulty-card-disabled' : ''}" href="${href}" ${disabled ? 'aria-disabled="true" tabindex="-1"' : ''}>
        ${difficultyBadge(d)}
        <div class="difficulty-card-count">${disabled ? 'Coming soon' : `${n} question${n === 1 ? '' : 's'}`}</div>
      </a>`;
  }).join('');

  const total = countQuestions(unitId, topicId);
  const reviewChapter = findChapterForTopic(unitId, topicId);

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/unit/${unitId}">${escapeHtml(unit.title)}</a><span>/</span><span>${escapeHtml(topic.title)}</span></nav>
    <div class="section">
      <div class="section-num">Topic</div>
      <h1 class="section-title" style="font-size:2.1em">${escapeHtml(topic.title)}</h1>
      <div class="section-body"><p>${escapeHtml(topic.description)}</p></div>
      <div class="dashboard-actions">
        ${reviewChapter ? `<a class="btn btn-primary" href="${reviewChapterHref(unitId, reviewChapter.id)}">📖 Review this topic →</a>` : ''}
        ${total ? `<a class="btn btn-outline" href="#/quiz/config?unit=${unitId}&topic=${topicId}&difficulty=mixed">Mixed-Difficulty Quiz (${total} questions)</a><a class="btn btn-outline" href="#/browse?unit=${unitId}&topic=${topicId}">Browse Questions</a>` : ''}
      </div>
    </div>
    <div class="section">
      <h2 class="section-title">Choose a Difficulty</h2>
      <div class="difficulty-grid">${cards}</div>
    </div>
  `;
}

// ─── Quiz configuration ─────────────────────────────────────

export function renderQuizConfig(container, params) {
  const unitId = params.get('unit');
  const topicId = params.get('topic') || 'all';
  const difficulty = params.get('difficulty') || 'mixed';

  let heading, available;
  if (topicId === 'weak') {
    heading = 'Weak Topics Practice';
    available = null;
  } else if (topicId === 'all') {
    const unit = getUnit(unitId);
    heading = unit ? `Unit ${unit.id} — ${escapeHtml(unit.title)} (all topics)` : 'All Units';
    available = countQuestions(unitId);
  } else {
    const unit = getUnit(unitId);
    const topic = getTopic(unitId, topicId);
    heading = unit && topic ? `${escapeHtml(unit.title)} — ${escapeHtml(topic.title)}` : 'Practice Quiz';
    available = countQuestions(unitId, topicId, difficulty);
  }

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Configure Quiz</span></nav>
    <div class="section">
      <div class="section-num">Quiz Setup</div>
      <h1 class="section-title" style="font-size:2.1em">${heading}</h1>
      ${available !== null ? `<div class="section-body"><p>${available} question${available === 1 ? '' : 's'} available for this selection.</p></div>` : ''}
      <form class="quiz-config-form" id="quizConfigForm">
        <div class="qc-row">
          <label for="qcDifficulty">Difficulty</label>
          <select id="qcDifficulty" name="difficulty">
            ${['mixed', ...DIFFICULTIES].map(d => `<option value="${d}" ${d === difficulty ? 'selected' : ''}>${d === 'mixed' ? 'Mixed' : d[0].toUpperCase() + d.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="qc-row">
          <label for="qcCount">Number of Questions</label>
          <select id="qcCount" name="count">
            ${[5, 10, 20, 30, 'all'].map(c => `<option value="${c}">${c === 'all' ? 'All available' : c}</option>`).join('')}
          </select>
        </div>
        <div class="qc-row">
          <label for="qcSelection">Question Selection</label>
          <select id="qcSelection" name="selection">
            <option value="random">Random</option>
            <option value="unseen">Unseen questions</option>
            <option value="incorrect">Previously incorrect</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div class="qc-row">
          <label>Mode</label>
          <div class="qc-radio-group">
            <label class="qc-radio"><input type="radio" name="mode" value="practice" checked> Practice <span class="qc-radio-hint">Feedback after each question</span></label>
            <label class="qc-radio"><input type="radio" name="mode" value="exam"> Exam <span class="qc-radio-hint">Feedback only at the end</span></label>
          </div>
        </div>
        <div class="qc-row" id="qcTimeLimitRow" hidden>
          <label for="qcTimeLimit">Time Limit</label>
          <select id="qcTimeLimit" name="timeLimitMinutes">
            <option value="">No limit</option>
            <option value="10">10 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
          <p class="input-hint">The quiz auto-submits when time runs out. Anything not yet answered is graded as skipped, same as ending the quiz manually.</p>
        </div>
        <button type="submit" class="btn btn-primary">Start Quiz</button>
      </form>
    </div>
  `;

  const form = container.querySelector('#quizConfigForm');
  const timeLimitRow = form.querySelector('#qcTimeLimitRow');
  form.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => { timeLimitRow.hidden = radio.value !== 'exam' || !radio.checked; });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const mode = fd.get('mode');
    const config = {
      unitId, topicId,
      difficulty: fd.get('difficulty'),
      count: fd.get('count') === 'all' ? 'all' : Number(fd.get('count')),
      selection: fd.get('selection'),
      mode,
      timeLimitMinutes: mode === 'exam' && fd.get('timeLimitMinutes') ? Number(fd.get('timeLimitMinutes')) : null,
    };
    const session = quiz.buildQuizSession(config);
    if (!session.questions.length) {
      window.alert('No questions match this selection yet. Try a different difficulty or selection mode.');
      return;
    }
    sessionStore.saveActiveSession(session);
    location.hash = '#/quiz/active';
  });
}

// ─── Active quiz ────────────────────────────────────────────

const CHOICE_TYPES = ['multiple-choice', 'true-false', 'output-prediction', 'code-debug', 'code-completion', 'scenario'];

export function renderQuiz(container) {
  const session = sessionStore.loadActiveSession();
  if (!session || !session.questions.length) {
    container.innerHTML = errorState('No active quiz. Start one from the dashboard.') + `<div class="dashboard-actions"><a class="btn btn-outline" href="#/">Back to Dashboard</a></div>`;
    return;
  }
  renderQuizQuestion(container, session);
}

function bubbleStatus(session, i) {
  const a = session.answers[i];
  if (a && a.checked) return a.correct ? 'correct' : 'incorrect';
  return 'unanswered';
}

function renderQuizQuestion(container, session) {
  const i = session.currentIndex;
  const q = session.questions[i];
  const unit = getUnit(q.unit);
  const topic = getTopic(q.unit, q.topic);
  const total = session.questions.length;
  const a = session.answers[i] || {};
  const isLast = i === total - 1;

  const bubbles = session.questions.map((_, idx) => {
    const status = bubbleStatus(session, idx);
    const marked = session.marked[idx];
    const symbol = status === 'correct' ? '✓' : status === 'incorrect' ? '✗' : marked ? '?' : '–';
    const isCurrent = idx === i;
    return `<button type="button" class="qnav-bubble qnav-${status} ${marked ? 'qnav-marked' : ''} ${isCurrent ? 'qnav-current' : ''}"
              data-goto="${idx}" aria-current="${isCurrent}" aria-label="Question ${idx + 1}${status !== 'unanswered' ? ', ' + status : ''}${marked ? ', marked for review' : ''}">${idx + 1}<span class="qnav-symbol">${symbol}</span></button>`;
  }).join('');

  const inputHtml = renderQuestionInput(q, a);

  let feedbackHtml = '';
  if (session.mode === 'practice' && a.checked) {
    feedbackHtml = renderFeedback(q, a);
  }

  const showCheckButton = session.mode === 'practice' && !a.checked;
  const showNextButton = session.mode === 'practice' && a.checked;
  const showSaveButton = session.mode === 'exam';

  container.innerHTML = `
    ${session.fallbackNotice && !session._fallbackShown ? `<div class="callout callout-amber" style="margin-bottom:20px"><div class="callout-title">Note</div>${escapeHtml(session.fallbackNotice)}</div>` : ''}
    <div class="quiz-header">
      <div class="quiz-header-top">
        <div>
          <div class="quiz-header-unit">${unit ? escapeHtml(unit.title) : ''}${topic ? ' · ' + escapeHtml(topic.title) : ''}</div>
          ${difficultyBadge(q.difficulty)}
        </div>
        <div style="text-align:right">
          <div class="quiz-header-progress">Question ${i + 1} of ${total} · ${session.mode === 'practice' ? 'Practice' : 'Exam'} mode</div>
          ${session.timeLimitMs ? '<div class="exam-timer" id="examTimer"></div>' : ''}
        </div>
      </div>
      <div class="qnav-strip" role="tablist" aria-label="Question navigator">${bubbles}</div>
    </div>

    <div class="quiz-layout">
    <div class="question-card">
      <div class="question-card-top-row">
        <div class="question-type-tag">${questionTypeLabel(q.type)}</div>
        ${scratchpadToggleMarkup()}
      </div>
      <p class="question-text">${escapeHtml(q.question)}</p>
      ${q.code ? codeBlock(q.code) : ''}
      ${q.hint ? `
        <button type="button" class="hint-btn" id="hintBtn">Show Hint</button>
        <div class="hint-box" id="hintBox" hidden>${escapeHtml(q.hint)}</div>` : ''}

      <div class="answer-area">${inputHtml}</div>

      ${feedbackHtml}

      <div class="quiz-controls">
        <button type="button" class="btn btn-ghost" id="prevBtn" ${i === 0 ? 'disabled' : ''}>← Previous</button>
        <button type="button" class="btn btn-ghost" id="markBtn">${session.marked[i] ? 'Unmark' : 'Mark for Review'}</button>
        <button type="button" class="btn btn-ghost" id="skipBtn" ${isLast ? 'disabled' : ''}>Skip</button>
        ${showCheckButton ? `<button type="button" class="btn btn-primary" id="checkBtn" disabled>Check Answer</button>` : ''}
        ${showSaveButton ? `<button type="button" class="btn btn-primary" id="saveBtn">${isLast ? 'Finish Quiz' : 'Save & Next'}</button>` : ''}
        ${showNextButton ? `<button type="button" class="btn btn-primary" id="nextBtn">${isLast ? 'Finish Quiz' : 'Next Question →'}</button>` : ''}
        <button type="button" class="btn btn-outline" id="endBtn">End Quiz</button>
      </div>
    </div>
    ${scratchpadPanelMarkup()}
    </div>
  `;
  session._fallbackShown = true;

  wireCodeCopyButtons(container);
  wireScratchpad(container);
  wireQuizInteractions(container, session, q, i);
  wireExamTimer(container, session);
}

// Module-level, not per-call — renderQuizQuestion() runs again on every
// question navigation, and each run must replace the previous interval
// rather than stack another one alongside it (same class of bug as the
// scratchpad's listener-stacking issue — see matlab-scratchpad.js).
let examTimerInterval = null;

function clearExamTimer() {
  if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; }
}

function wireExamTimer(container, session) {
  clearExamTimer();
  if (!session.timeLimitMs) return;
  const el = container.querySelector('#examTimer');
  if (!el) return;

  // Anchored to an absolute deadline (startedAt + timeLimitMs), never to a
  // locally-decremented counter — so it self-corrects across page
  // refreshes, tab backgrounding (where setInterval throttles/pauses), and
  // renders triggered by question navigation, instead of drifting or
  // resetting.
  function tick() {
    const remaining = session.startedAt + session.timeLimitMs - Date.now();
    if (remaining <= 0) {
      clearExamTimer();
      el.textContent = 'Time’s up — submitting…';
      finishAndShowResults(session);
      return;
    }
    const totalSec = Math.ceil(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    el.textContent = `⏱ ${m}:${String(s).padStart(2, '0')} remaining`;
    el.classList.toggle('exam-timer-warn', remaining <= 60000);
  }

  tick();
  examTimerInterval = setInterval(tick, 1000);
}

function questionTypeLabel(type) {
  const labels = {
    'multiple-choice': 'Multiple Choice', 'true-false': 'True / False', 'output-prediction': 'Output Prediction',
    'code-debug': 'Code Debugging', 'code-completion': 'Code Completion', 'scenario': 'Scenario', 'numeric': 'Numeric Answer',
    'select-all': 'Select All That Apply', 'matching': 'Matching', 'ordering': 'Ordering', 'code-entry': 'Short MATLAB Code',
  };
  return labels[type] || type;
}

function renderQuestionInput(q, a) {
  if (CHOICE_TYPES.includes(q.type)) {
    const selected = a.response;
    const opts = q._displayOrder.map(origIdx => {
      const checked = Number(selected) === origIdx;
      return `<label class="choice-option ${checked ? 'choice-option-selected' : ''}">
        <input type="radio" name="choice" value="${origIdx}" ${checked ? 'checked' : ''} ${a.checked ? 'disabled' : ''}>
        <span>${escapeHtml(q.options[origIdx])}</span>
      </label>`;
    }).join('');
    return `<div class="choice-list" data-input="choice">${opts}</div>`;
  }

  if (q.type === 'select-all') {
    const selected = Array.isArray(a.response) ? a.response.map(Number) : [];
    const opts = q._displayOrder.map(origIdx => {
      const checked = selected.includes(origIdx);
      return `<label class="choice-option choice-option-check ${checked ? 'choice-option-selected' : ''}">
        <input type="checkbox" name="choice" value="${origIdx}" ${checked ? 'checked' : ''} ${a.checked ? 'disabled' : ''}>
        <span>${escapeHtml(q.options[origIdx])}</span>
      </label>`;
    }).join('');
    return `<div class="choice-list" data-input="select-all">${opts}<p class="input-hint">Select all options that apply.</p></div>`;
  }

  if (q.type === 'numeric') {
    const val = a.response !== undefined ? a.response : '';
    return `<div data-input="numeric"><input type="number" step="any" class="numeric-input" id="numericInput" value="${escapeHtml(val)}" placeholder="Enter a number" ${a.checked ? 'disabled' : ''}></div>`;
  }

  if (q.type === 'code-entry') {
    const val = a.response !== undefined ? a.response : '';
    return `<div data-input="code-entry"><textarea class="code-entry-input" id="codeEntryInput" rows="2" spellcheck="false" placeholder="Type your MATLAB code here" ${a.checked ? 'disabled' : ''}>${escapeHtml(val)}</textarea></div>`;
  }

  if (q.type === 'matching') {
    const response = Array.isArray(a.response) ? a.response : q.options.map(() => '');
    const rightOptionsHtml = origIdx => q._matchDisplayOrder.map(mi => `<option value="${mi}" ${Number(response[origIdx]) === mi ? 'selected' : ''}>${escapeHtml(q.matchOptions[mi])}</option>`).join('');
    const rows = q.options.map((left, idx) => `
      <div class="match-row">
        <span class="match-left">${escapeHtml(left)}</span>
        <select class="match-select" data-left-index="${idx}" ${a.checked ? 'disabled' : ''}>
          <option value="" ${response[idx] === '' || response[idx] === undefined ? 'selected' : ''}>— choose —</option>
          ${rightOptionsHtml(idx)}
        </select>
      </div>`).join('');
    return `<div data-input="matching">${rows}</div>`;
  }

  if (q.type === 'ordering') {
    const order = Array.isArray(a.response) && a.response.length === q.options.length ? a.response : q._displayOrder;
    const items = order.map((origIdx, pos) => `
      <li class="order-item" data-orig-index="${origIdx}">
        <span class="order-item-text">${escapeHtml(q.options[origIdx])}</span>
        ${!a.checked ? `
          <span class="order-item-controls">
            <button type="button" class="order-move" data-move="up" data-pos="${pos}" ${pos === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
            <button type="button" class="order-move" data-move="down" data-pos="${pos}" ${pos === order.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
          </span>` : ''}
      </li>`).join('');
    return `<ol class="order-list" data-input="ordering">${items}</ol><p class="input-hint">Use the arrows to arrange the steps in the correct order.</p>`;
  }

  return '<p class="input-hint">Unsupported question type.</p>';
}

function renderFeedback(q, a) {
  const correct = a.correct;
  let optionExpHtml = '';
  if (CHOICE_TYPES.includes(q.type) && q.optionExplanations) {
    optionExpHtml = `<ul class="option-explanations">${q._displayOrder.map(origIdx => {
      const isCorrectOpt = origIdx === q.correctAnswer;
      const isSelected = origIdx === Number(a.response);
      return `<li class="${isCorrectOpt ? 'opt-exp-correct' : ''} ${isSelected && !isCorrectOpt ? 'opt-exp-selected-wrong' : ''}">
        <strong>${escapeHtml(q.options[origIdx])}${isCorrectOpt ? ' — Correct' : ''}${isSelected && !isCorrectOpt ? ' — Your answer' : ''}:</strong>
        ${escapeHtml(q.optionExplanations[origIdx])}
      </li>`;
    }).join('')}</ul>`;
  }

  const mistakesHtml = q.commonMistakes && q.commonMistakes.length
    ? `<div class="common-mistakes"><strong>Common mistake${q.commonMistakes.length > 1 ? 's' : ''}:</strong><ul>${q.commonMistakes.map(m => `<li>${escapeHtml(m)}</li>`).join('')}</ul></div>`
    : '';

  const liveRunHtml = renderLiveRunFeedback(a.liveRun);

  return `
    <div class="feedback-banner ${correct ? 'feedback-correct' : 'feedback-incorrect'}">
      <div class="feedback-headline">${correct ? '✓ Correct!' : '✗ Not quite'}</div>
      ${liveRunHtml}
      <p class="feedback-explanation">${escapeHtml(q.explanation || '')}</p>
      ${optionExpHtml}
      ${mistakesHtml}
      <div class="feedback-meta">Concept: <strong>${escapeHtml(q.concept || '—')}</strong>${q.references && q.references.length ? ` · Reference: ${q.references.map(escapeHtml).join(', ')}` : ''}</div>
    </div>`;
}

function renderLiveRunFeedback(liveRun) {
  if (!liveRun) return '';

  if (liveRun.fallback) {
    return `<div class="live-run-note live-run-note-warn">Live MATLAB grading was unavailable this time (${escapeHtml(liveRun.reason)}). Graded by text comparison instead.</div>`;
  }

  const studentOut = liveRun.studentError
    ? `Error: ${liveRun.studentError.message}`
    : (liveRun.studentStdout || '(no output)');

  return `
    <div class="live-run-note">
      <div class="live-run-badge">⚡ Live-graded by running your code in a real MATLAB interpreter</div>
      <div class="live-run-row"><span class="live-run-label">Your code produced:</span><pre class="sandbox-stdout">${escapeHtml(studentOut)}</pre></div>
      <div class="live-run-row"><span class="live-run-label">Expected output:</span><pre class="sandbox-stdout">${escapeHtml(liveRun.referenceStdout || '(no output)')}</pre></div>
    </div>`;
}

function collectResponse(container, q) {
  if (CHOICE_TYPES.includes(q.type)) {
    const checked = container.querySelector('input[name="choice"]:checked');
    return checked ? Number(checked.value) : undefined;
  }
  if (q.type === 'select-all') {
    const checked = [...container.querySelectorAll('input[name="choice"]:checked')].map(i => Number(i.value));
    return checked.length ? checked : undefined;
  }
  if (q.type === 'numeric') {
    const input = container.querySelector('#numericInput');
    return input && input.value !== '' ? Number(input.value) : undefined;
  }
  if (q.type === 'code-entry') {
    const input = container.querySelector('#codeEntryInput');
    return input && input.value.trim() !== '' ? input.value : undefined;
  }
  if (q.type === 'matching') {
    const selects = [...container.querySelectorAll('.match-select')];
    if (!selects.length) return undefined;
    const response = new Array(q.options.length).fill('');
    let anySet = false;
    selects.forEach(sel => {
      const idx = Number(sel.dataset.leftIndex);
      if (sel.value !== '') { response[idx] = Number(sel.value); anySet = true; }
    });
    return anySet ? response : undefined;
  }
  if (q.type === 'ordering') {
    const items = [...container.querySelectorAll('.order-item')];
    return items.map(li => Number(li.dataset.origIndex));
  }
  return undefined;
}

/**
 * Live-grades a code-entry answer by actually running both the student's
 * code and the question's first acceptableAnswer through the MATLAB
 * runtime (see js/matlab-runtime.js), then comparing their printed output
 * — rather than comparing source text. Requires no changes to existing
 * question data: the "reference" output is computed on the fly from
 * whatever acceptableAnswers[0] already is.
 *
 * matlab-runtime.js is imported dynamically here (not at module scope) so
 * views.js — which loads eagerly for every visitor — never pulls in the
 * Web Worker/WASM machinery for students who leave live grading off.
 *
 * Throws (does not return) on an infrastructure failure (e.g. the runtime
 * won't load) — callers should catch that and fall back to
 * quiz.gradeResponse(). A normal MATLAB error in the student's own code is
 * NOT a throw — it's just an incorrect answer with the error shown in
 * feedback, same as a wrong multiple-choice pick.
 */
async function gradeCodeEntryLive(q, response) {
  const { loadMatlabRuntime, runMatlabCode, workspacesEqual } = await import('./matlab-runtime.js');
  await loadMatlabRuntime();

  // Run sequentially, not Promise.all — both go through the same worker/session,
  // and each run starts with clearWorkspace(); running them concurrently risks
  // one run's clear landing in the middle of the other's execution depending on
  // exactly how the WASM runtime yields (verified fine in ad hoc testing, but not
  // relying on that undocumented timing behavior here).
  const studentRun = await runMatlabCode(response, { timeoutMs: 6000 });
  const referenceRun = await runMatlabCode(q.acceptableAnswers[0], { timeoutMs: 6000 });

  // Compare BOTH printed output and actual variable state. Output alone isn't
  // enough — verified directly that "x = 42;" and "x = 41;" produce identical
  // (empty, suppressed) stdout, so a stdout-only comparison would grade a
  // wrong-value answer as correct. workspacesEqual catches that; the stdout
  // check still matters separately for questions that are about *whether*
  // something prints (e.g. forgetting a semicolon), where workspace state
  // alone wouldn't differ.
  const outputMatches = !studentRun.error && !referenceRun.error && studentRun.stdout.trim() === referenceRun.stdout.trim();
  const stateMatches = workspacesEqual(studentRun.workspace, referenceRun.workspace);
  const correct = outputMatches && stateMatches;

  return {
    correct,
    liveRun: {
      studentStdout: studentRun.stdout,
      studentError: studentRun.error,
      referenceStdout: referenceRun.stdout,
    },
  };
}

function isResponseComplete(q, response) {
  if (response === undefined) return false;
  if (q.type === 'matching') return Array.isArray(response) && response.every(v => v !== '');
  if (q.type === 'ordering') return Array.isArray(response) && response.length === q.options.length;
  return true;
}

function wireQuizInteractions(container, session, q, i) {
  const answerArea = container.querySelector('.answer-area');
  const checkBtn = container.querySelector('#checkBtn');
  const saveBtn = container.querySelector('#saveBtn');

  function refreshCheckEnabled() {
    if (!checkBtn) return;
    const response = collectResponse(answerArea, q);
    checkBtn.disabled = !isResponseComplete(q, response);
  }

  function persistDraft() {
    const response = collectResponse(answerArea, q);
    session.answers[i] = { ...(session.answers[i] || {}), response, checked: (session.answers[i] || {}).checked || false };
    sessionStore.saveActiveSession(session);
  }

  answerArea.addEventListener('change', () => {
    persistDraft();
    refreshCheckEnabled();
    // Radio/checkbox :checked state updates natively without a re-render, but
    // our custom highlight class doesn't — sync it here instead of a full re-render.
    answerArea.querySelectorAll('.choice-option').forEach(label => {
      label.classList.toggle('choice-option-selected', label.querySelector('input').checked);
    });
  });
  answerArea.addEventListener('input', () => { persistDraft(); refreshCheckEnabled(); });

  // Ordering reorder controls
  answerArea.querySelectorAll('.order-move').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = answerArea.querySelector('.order-list');
      const pos = Number(btn.dataset.pos);
      const dir = btn.dataset.move === 'up' ? -1 : 1;
      const items = [...list.children];
      const target = items[pos + dir];
      if (!target) return;
      if (dir === -1) list.insertBefore(items[pos], target);
      else list.insertBefore(target, items[pos]);
      persistDraft();
      // Re-render just to refresh disabled states on the arrow buttons at the new positions.
      session.currentIndex = i;
      renderQuizQuestion(container, session);
    });
  });

  refreshCheckEnabled();

  if (q.hint) {
    const hintBtn = container.querySelector('#hintBtn');
    const hintBox = container.querySelector('#hintBox');
    hintBtn.addEventListener('click', () => { hintBox.hidden = !hintBox.hidden; });
  }

  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      const response = collectResponse(answerArea, q);

      if (q.type === 'code-entry' && store.isLiveGradingEnabled()) {
        checkBtn.disabled = true;
        const originalLabel = checkBtn.textContent;
        checkBtn.textContent = 'Running your code…';
        try {
          const { correct, liveRun } = await gradeCodeEntryLive(q, response);
          session.answers[i] = { response, correct, checked: true, liveRun };
        } catch (e) {
          // Infrastructure failure (runtime wouldn't load, etc.) — fall back to the
          // normal string-comparison grading rather than blocking the student.
          const correct = quiz.gradeResponse(q, response);
          session.answers[i] = { response, correct, checked: true, liveRun: { fallback: true, reason: String((e && e.message) || e) } };
        }
        checkBtn.textContent = originalLabel;
      } else {
        const correct = quiz.gradeResponse(q, response);
        session.answers[i] = { response, correct, checked: true };
      }

      const a = session.answers[i];
      store.recordAnswer({ questionId: q.id, unit: q.unit, topic: q.topic, difficulty: q.difficulty, correct: a.correct });
      sessionStore.saveActiveSession(session);
      renderQuizQuestion(container, session);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      persistDraft();
      goToQuestionOrFinish(container, session, i);
    });
  }

  const nextBtn = container.querySelector('#nextBtn');
  if (nextBtn) nextBtn.addEventListener('click', () => goToQuestionOrFinish(container, session, i));

  container.querySelector('#prevBtn').addEventListener('click', () => {
    if (i > 0) { session.currentIndex = i - 1; sessionStore.saveActiveSession(session); renderQuizQuestion(container, session); }
  });
  container.querySelector('#skipBtn').addEventListener('click', () => goToQuestionOrFinish(container, session, i));
  container.querySelector('#markBtn').addEventListener('click', () => {
    session.marked[i] = !session.marked[i];
    sessionStore.saveActiveSession(session);
    renderQuizQuestion(container, session);
  });
  container.querySelector('#endBtn').addEventListener('click', () => {
    const ok = window.confirm('End this quiz now? Unanswered questions will be marked as skipped.');
    if (!ok) return;
    finishAndShowResults(session);
  });

  container.querySelectorAll('.qnav-bubble').forEach(btn => {
    btn.addEventListener('click', () => {
      session.currentIndex = Number(btn.dataset.goto);
      sessionStore.saveActiveSession(session);
      renderQuizQuestion(container, session);
    });
  });
}

function goToQuestionOrFinish(container, session, i) {
  const isLast = i === session.questions.length - 1;
  if (isLast) {
    finishAndShowResults(session);
    return;
  }
  session.currentIndex = i + 1;
  sessionStore.saveActiveSession(session);
  renderQuizQuestion(container, session);
}

function finishAndShowResults(session) {
  clearExamTimer();
  const summary = quiz.finishQuiz(session);
  sessionStore.saveLastResults(summary, session);
  sessionStore.clearActiveSession();
  location.hash = '#/quiz/results';
}

// ─── Results ────────────────────────────────────────────────

export function renderResults(container) {
  const last = sessionStore.loadLastResults();
  if (!last) {
    container.innerHTML = errorState('No recent quiz results to show.') + `<div class="dashboard-actions"><a class="btn btn-outline" href="#/">Back to Dashboard</a></div>`;
    return;
  }
  const { summary, session } = last;

  const topicsHtml = summary.topics.length
    ? summary.topics.map(t => {
        const topic = getTopic(t.unit, t.topic);
        const reviewChapter = findChapterForTopic(t.unit, t.topic);
        return `<div class="results-topic-row">
          <span>${escapeHtml(topic ? topic.title : t.topic)}${reviewChapter ? ` · <a href="${reviewChapterHref(t.unit, reviewChapter.id)}">Review →</a>` : ''}</span>
          ${progressBar(t.accuracy, { label: `${topic ? topic.title : t.topic} accuracy this quiz` })}
          <span>${t.accuracy}%</span>
        </div>`;
      }).join('')
    : '';

  const unitId = session.config && session.config.unitId;
  const backToUnitHref = (unitId && unitId !== 'all') ? `#/unit/${unitId}` : '#/';

  container.innerHTML = `
    <div class="section">
      <div class="section-num">Practice Score</div>
      <h1 class="section-title" style="font-size:2.1em">Quiz Complete</h1>
      <div class="results-summary">
        <div class="results-score">${summary.correct} / ${summary.total}</div>
        <div class="results-pct">${summary.scorePct}%</div>
        ${progressBar(summary.scorePct, { label: 'Overall score' })}
        <div class="results-breakdown">
          <span>Correct: ${summary.correct}</span>
          <span>Incorrect: ${summary.incorrect}</span>
          <span>Skipped: ${summary.skipped}</span>
        </div>
      </div>
      <div class="callout">
        <div class="callout-title">Note</div>
        This is a <strong>Practice Score</strong> for self-assessment only. It is not an official BME 2740 grade.
      </div>

      ${topicsHtml ? `<h3 class="mini-heading">Topics to Review</h3><div class="results-topics">${topicsHtml}</div>` : ''}

      <div class="dashboard-actions">
        ${summary.incorrect ? `<a class="btn btn-outline" href="#/quiz/review">Review Incorrect</a>` : ''}
        <button type="button" class="btn btn-outline" id="retryBtn">Retry Quiz</button>
        <a class="btn btn-outline" href="#/quiz/config?unit=all&topic=weak&difficulty=mixed">Practice Weak Topics</a>
        <a class="btn btn-outline" href="${backToUnitHref}">${unitId && unitId !== 'all' ? 'Back to Unit' : 'Back to Dashboard'}</a>
      </div>
    </div>
  `;

  container.querySelector('#retryBtn').addEventListener('click', () => {
    const newSession = quiz.buildQuizSession(session.config);
    if (!newSession.questions.length) { window.alert('No questions available to retry this selection.'); return; }
    sessionStore.saveActiveSession(newSession);
    location.hash = '#/quiz/active';
  });
}

// ─── Review incorrect (read-only) ───────────────────────────

export function renderReview(container) {
  const last = sessionStore.loadLastResults();
  if (!last) {
    container.innerHTML = errorState('No recent quiz to review.') + `<div class="dashboard-actions"><a class="btn btn-outline" href="#/">Back to Dashboard</a></div>`;
    return;
  }
  const { session } = last;
  const items = session.questions
    .map((q, idx) => ({ q, a: session.answers[idx] }))
    .filter(({ a }) => a && a.checked && !a.correct);

  const html = items.length
    ? items.map(({ q, a }) => {
        const reviewChapter = findChapterForTopic(q.unit, q.topic);
        return `
      <div class="question-card review-card">
        <div class="question-type-tag">${questionTypeLabel(q.type)}</div>
        <p class="question-text">${escapeHtml(q.question)}</p>
        ${q.code ? codeBlock(q.code) : ''}
        <div class="review-answers">
          <div><strong>Your answer:</strong> ${escapeHtml(describeResponse(q, a.response))}</div>
          <div><strong>Correct answer:</strong> ${escapeHtml(describeCorrectAnswer(q))}</div>
        </div>
        ${renderFeedback(q, a)}
        ${reviewChapter ? `<div class="dashboard-actions"><a class="btn btn-outline" href="${reviewChapterHref(q.unit, reviewChapter.id)}">📖 Review this concept →</a></div>` : ''}
      </div>`;
      }).join('')
    : emptyState('Nothing to review. Every answered question in that quiz was correct.');

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/quiz/results">Results</a><span>/</span><span>Review</span></nav>
    <div class="section">
      <div class="section-num">Review</div>
      <h1 class="section-title" style="font-size:2.1em">Incorrect Questions</h1>
      ${html}
    </div>
  `;
  wireCodeCopyButtons(container);
}

function describeResponse(q, response) {
  if (response === undefined) return 'No answer';
  if (CHOICE_TYPES.includes(q.type)) return q.options[response] ?? 'No answer';
  if (q.type === 'select-all') return response.map(i => q.options[i]).join(', ') || 'No answer';
  if (q.type === 'numeric') return String(response);
  if (q.type === 'code-entry') return response;
  if (q.type === 'matching') return q.options.map((left, i) => `${left} → ${response[i] !== '' && response[i] !== undefined ? q.matchOptions[response[i]] : '—'}`).join('; ');
  if (q.type === 'ordering') return response.map(i => q.options[i]).join(' → ');
  return String(response);
}

function describeCorrectAnswer(q) {
  if (CHOICE_TYPES.includes(q.type)) return q.options[q.correctAnswer];
  if (q.type === 'select-all') return q.correctAnswer.map(i => q.options[i]).join(', ');
  if (q.type === 'numeric') return `${q.correctAnswer.value}${q.correctAnswer.tolerance ? ` (± ${q.correctAnswer.tolerance})` : ''}`;
  if (q.type === 'code-entry') return q.acceptableAnswers[0];
  if (q.type === 'matching') return q.options.map((left, i) => `${left} → ${q.matchOptions[q.correctAnswer[i]]}`).join('; ');
  if (q.type === 'ordering') return q.correctAnswer.map(i => q.options[i]).join(' → ');
  return '—';
}

// ─── MATLAB function reference ──────────────────────────────

export function renderReference(container) {
  container.innerHTML = `
    <div class="section">
      <div class="section-num">Reference</div>
      <h1 class="section-title" style="font-size:2.1em">MATLAB Function Reference</h1>
      <div class="section-body"><p>A quick reference for functions used in BME 2740 practice questions, not a replacement for MATLAB’s own documentation.</p></div>
      <input type="text" id="refFilter" class="ref-filter-input" placeholder="Filter by function name, category, or keyword…">
      <div class="reference-grid" id="refGrid"></div>
    </div>
  `;
  const grid = container.querySelector('#refGrid');
  const filterInput = container.querySelector('#refFilter');

  function draw(filter) {
    const f = (filter || '').toLowerCase().trim();
    const list = FUNCTION_REFERENCE.filter(fn =>
      !f || fn.name.toLowerCase().includes(f) || fn.category.toLowerCase().includes(f) || fn.purpose.toLowerCase().includes(f)
    );
    grid.innerHTML = list.length
      ? list.map(fn => `
        <div class="reference-card" id="fn-${cssId(fn.name)}">
          <div class="reference-card-top"><span class="func-name">${escapeHtml(fn.name)}</span><span class="pill">${escapeHtml(fn.category)}</span></div>
          <p class="reference-purpose">${escapeHtml(fn.purpose)}</p>
          ${codeBlock(fn.syntax, { id: `syn-${cssId(fn.name)}` })}
          ${fn.example ? codeBlock(fn.example, { id: `ex-${cssId(fn.name)}` }) : ''}
          ${fn.commonMistake && fn.commonMistake !== '—' ? `<div class="callout callout-amber ref-mistake"><div class="callout-title">Common Mistake</div>${escapeHtml(fn.commonMistake)}</div>` : ''}
          ${fn.related && fn.related.length ? `<div class="pill-row">${fn.related.map(r => `<a class="pill" href="#fn-${cssId(r)}">${escapeHtml(r)}</a>`).join('')}</div>` : ''}
        </div>`).join('')
      : emptyState('No functions match that filter.');
    wireCodeCopyButtons(grid);
  }

  filterInput.addEventListener('input', () => draw(filterInput.value));
  draw('');
}

function cssId(name) { return name.replace(/[^a-z0-9]/gi, '-'); }

// ─── Search ─────────────────────────────────────────────────

export function renderSearch(container, query) {
  container.innerHTML = `
    <div class="section">
      <div class="section-num">Search</div>
      <h1 class="section-title" style="font-size:2.1em">Search</h1>
      <input type="text" id="searchInput" class="ref-filter-input" placeholder="Search topics, MATLAB functions, or tags…" value="${escapeHtml(query || '')}">
      <div id="searchResults"></div>
    </div>
  `;
  const input = container.querySelector('#searchInput');
  const results = container.querySelector('#searchResults');

  function draw(q) {
    const f = (q || '').toLowerCase().trim();
    if (!f) { results.innerHTML = emptyState('Type something to search: try a MATLAB function, a topic name, or a tag like "for loop".'); return; }

    const topicHits = [];
    UNITS.forEach(u => u.topics.forEach(t => {
      if (t.title.toLowerCase().includes(f) || t.description.toLowerCase().includes(f)) topicHits.push({ unit: u, topic: t });
    }));

    const tagHits = new Map();
    getAllQuestions().forEach(qn => {
      const hay = [qn.concept, ...(qn.tags || [])].join(' ').toLowerCase();
      if (hay.includes(f)) {
        const t = getTopic(qn.unit, qn.topic);
        const key = `${qn.unit}::${qn.topic}`;
        if (t && !tagHits.has(key)) tagHits.set(key, { unit: getUnit(qn.unit), topic: t });
      }
    });

    const funcHits = FUNCTION_REFERENCE.filter(fn => fn.name.toLowerCase().includes(f) || fn.purpose.toLowerCase().includes(f));
    const reviewHits = REVIEW_CHAPTERS.filter(c => c.title.toLowerCase().includes(f) || c.keywords.some(k => k.includes(f)));

    const topicSection = (topicHits.length || tagHits.size)
      ? `<h3 class="mini-heading">Topics</h3><ul class="mini-list search-hit-list">
          ${topicHits.map(h => `<li><a href="#/unit/${h.unit.id}/topic/${h.topic.id}">${escapeHtml(h.unit.title)} — ${escapeHtml(h.topic.title)}</a></li>`).join('')}
          ${[...tagHits.values()].map(h => `<li><a href="#/unit/${h.unit.id}/topic/${h.topic.id}">${escapeHtml(h.unit.title)} — ${escapeHtml(h.topic.title)}</a> <span class="dim-item">(matched a question tag)</span></li>`).join('')}
        </ul>`
      : '';

    const reviewSection = reviewHits.length
      ? `<h3 class="mini-heading">Review Chapters</h3><ul class="mini-list search-hit-list">${reviewHits.map(c => `<li><a href="${reviewChapterHref(c.unit, c.id)}">${escapeHtml(c.title)}</a> <span class="dim-item">(Unit ${c.unit} Review)</span></li>`).join('')}</ul>`
      : '';

    const funcSection = funcHits.length
      ? `<h3 class="mini-heading">MATLAB Functions</h3><ul class="mini-list search-hit-list">${funcHits.map(fn => `<li><a href="#/reference">${escapeHtml(fn.name)}</a> — ${escapeHtml(fn.purpose)}</li>`).join('')}</ul>`
      : '';

    results.innerHTML = (topicSection || reviewSection || funcSection) ? topicSection + reviewSection + funcSection : emptyState(`No results for “${q}”.`);
  }

  input.addEventListener('input', () => {
    draw(input.value);
    // replaceState (not location.hash) so the URL stays bookmarkable without
    // firing hashchange on every keystroke, which would re-render and steal focus.
    history.replaceState(null, '', `#/search?q=${encodeURIComponent(input.value)}`);
  });
  draw(query);
}

// ─── Browse mode ─────────────────────────────────────────────
// A read-only way to page through the question bank with answers shown
// up front — no "answer to continue" gate, and nothing here touches
// progress/store.js. Good for studying or previewing content rather than
// self-testing (the quiz flow, above, is still the way to actually practice).

const BROWSE_PAGE_SIZE = 20;

export function renderBrowse(container, params) {
  const unitId = params.get('unit') || 'all';
  const topicId = params.get('topic') || 'all';
  const difficulty = params.get('difficulty') || 'mixed';
  let shown = BROWSE_PAGE_SIZE;

  const unitOptionsHtml = ['<option value="all">All Units</option>']
    .concat(UNITS.filter(u => u.hasContent).map(u => `<option value="${u.id}" ${String(u.id) === unitId ? 'selected' : ''}>Unit ${u.id} — ${escapeHtml(u.short)}</option>`))
    .join('');

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Browse Questions</span></nav>
    <div class="section">
      <div class="section-num">Study Mode</div>
      <h1 class="section-title" style="font-size:2.1em">Browse Questions</h1>
      <div class="section-body"><p>Page through the question bank with answers and explanations shown right away. No need to answer anything to move on. For self-testing, use a regular practice quiz instead.</p></div>
      <div class="quiz-config-form" style="flex-direction:row;flex-wrap:wrap;gap:14px;align-items:flex-end;max-width:none">
        <div class="qc-row" style="min-width:200px"><label for="browseUnit">Unit</label><select id="browseUnit">${unitOptionsHtml}</select></div>
        <div class="qc-row" style="min-width:200px"><label for="browseTopic">Topic</label><select id="browseTopic"></select></div>
        <div class="qc-row" style="min-width:160px"><label for="browseDifficulty">Difficulty</label>
          <select id="browseDifficulty">${['mixed', ...DIFFICULTIES].map(d => `<option value="${d}" ${d === difficulty ? 'selected' : ''}>${d === 'mixed' ? 'Mixed' : d[0].toUpperCase() + d.slice(1)}</option>`).join('')}</select>
        </div>
      </div>
      <input type="text" id="browseFilter" class="ref-filter-input" placeholder="Filter by keyword, concept, or tag…">
      <div id="browseCount" class="input-hint" style="margin:-8px 0 16px"></div>
      <div id="browseList"></div>
      <div class="dashboard-actions"><button type="button" class="btn btn-outline" id="browseMoreBtn" hidden>Show More</button></div>
    </div>
  `;

  const unitSelect = container.querySelector('#browseUnit');
  const topicSelect = container.querySelector('#browseTopic');
  const difficultySelect = container.querySelector('#browseDifficulty');
  const filterInput = container.querySelector('#browseFilter');
  const list = container.querySelector('#browseList');
  const countEl = container.querySelector('#browseCount');
  const moreBtn = container.querySelector('#browseMoreBtn');

  function refreshTopicOptions() {
    const uid = unitSelect.value;
    const unit = uid !== 'all' ? getUnit(uid) : null;
    const options = ['<option value="all">All Topics</option>']
      .concat((unit ? unit.topics : []).map(t => `<option value="${t.id}" ${t.id === topicId ? 'selected' : ''}>${escapeHtml(t.title)}</option>`));
    topicSelect.innerHTML = options.join('');
    topicSelect.disabled = !unit;
    if (!unit) topicSelect.value = 'all';
  }
  refreshTopicOptions();

  function pool() {
    const uid = unitSelect.value;
    const tid = topicSelect.value;
    const diff = difficultySelect.value;
    let qs;
    if (uid === 'all') qs = getAllQuestions();
    else if (tid === 'all') qs = getUnitQuestions(uid);
    else qs = getQuestions(uid, tid, 'mixed');
    if (diff !== 'mixed') qs = qs.filter(q => q.difficulty === diff);
    const f = filterInput.value.toLowerCase().trim();
    if (f) qs = qs.filter(q => [q.question, q.concept, ...(q.tags || [])].join(' ').toLowerCase().includes(f));
    return qs;
  }

  function draw() {
    shown = BROWSE_PAGE_SIZE;
    redraw();
  }

  function redraw() {
    const qs = pool();
    countEl.textContent = `${qs.length} question${qs.length === 1 ? '' : 's'} match this filter.`;
    list.innerHTML = qs.length
      ? qs.slice(0, shown).map(q => renderBrowseCard(q)).join('')
      : emptyState('No questions match this filter yet.');
    moreBtn.hidden = shown >= qs.length;
    wireCodeCopyButtons(list);
  }

  unitSelect.addEventListener('change', () => { refreshTopicOptions(); draw(); });
  topicSelect.addEventListener('change', draw);
  difficultySelect.addEventListener('change', draw);
  filterInput.addEventListener('input', draw);
  moreBtn.addEventListener('click', () => { shown += BROWSE_PAGE_SIZE; redraw(); });

  draw();
}

function renderBrowseCard(q) {
  const unit = getUnit(q.unit);
  const topic = getTopic(q.unit, q.topic);
  const mistakesHtml = q.commonMistakes && q.commonMistakes.length
    ? `<div class="common-mistakes"><strong>Common mistake${q.commonMistakes.length > 1 ? 's' : ''}:</strong><ul>${q.commonMistakes.map(m => `<li>${escapeHtml(m)}</li>`).join('')}</ul></div>`
    : '';
  return `
    <div class="question-card review-card">
      <div class="question-card-top-row">
        <div class="question-type-tag">${questionTypeLabel(q.type)}</div>
        ${difficultyBadge(q.difficulty)}
      </div>
      <div class="quiz-header-unit">${unit ? escapeHtml(unit.title) : ''}${topic ? ' · ' + escapeHtml(topic.title) : ''}</div>
      <p class="question-text">${escapeHtml(q.question)}</p>
      ${q.code ? codeBlock(q.code) : ''}
      ${renderBrowseAnswer(q)}
      <div class="feedback-banner feedback-correct" style="margin-top:14px">
        <div class="feedback-headline">Answer</div>
        <p class="feedback-explanation">${escapeHtml(q.explanation || '')}</p>
        ${mistakesHtml}
        <div class="feedback-meta">Concept: <strong>${escapeHtml(q.concept || '—')}</strong>${q.references && q.references.length ? ` · Reference: ${q.references.map(escapeHtml).join(', ')}` : ''}</div>
      </div>
    </div>`;
}

function renderBrowseAnswer(q) {
  if (CHOICE_TYPES.includes(q.type) && Array.isArray(q.options)) {
    return `<div class="choice-list" style="margin:14px 0">${q.options.map((opt, idx) => `<div class="choice-option ${idx === q.correctAnswer ? 'choice-option-selected' : ''}">${idx === q.correctAnswer ? '✓ ' : ''}${escapeHtml(opt)}</div>`).join('')}</div>`;
  }
  return `<p class="input-hint" style="margin:10px 0"><strong>Correct answer:</strong> ${escapeHtml(describeCorrectAnswer(q))}</p>`;
}

// ─── Instructor mode ────────────────────────────────────────

export function renderInstructor(container) {
  const all = getAllQuestions();
  const rows = all.map(q => `
    <tr>
      <td>${escapeHtml(q.id)}</td>
      <td>${q.unit}</td>
      <td>${escapeHtml(q.topic)}</td>
      <td>${escapeHtml(q.difficulty)}</td>
      <td>${escapeHtml(q.cognitiveLevel || '—')}</td>
      <td>${escapeHtml(q.type)}</td>
      <td>${(q.tags || []).map(escapeHtml).join(', ')}</td>
      <td>${(q.references || []).map(escapeHtml).join('; ')}</td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="section">
      <div class="section-num">Instructor Mode</div>
      <h1 class="section-title" style="font-size:2.1em">Question Bank Inspector</h1>
      <div class="section-body"><p>${all.length} questions total. This view is for course maintenance only and is not linked from student-facing navigation.</p></div>
      <div class="dashboard-actions"><button type="button" class="btn btn-outline" id="exportBtn">Export Question Bank (JSON)</button></div>
      <div class="instructor-table-wrap">
        <table class="instructor-table">
          <thead><tr><th>ID</th><th>Unit</th><th>Topic</th><th>Difficulty</th><th>Cognitive</th><th>Type</th><th>Tags</th><th>References</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bme2740-question-bank.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
