// ─────────────────────────────────────────────────────────────
// Quiz engine: question selection, session state, grading.
// Pure logic — no DOM here (see render.js for that).
// ─────────────────────────────────────────────────────────────

import { getQuestions, getUnitQuestions, getAllQuestions, DIFFICULTIES } from './bank.js';
import { getSeenQuestionIds, getIncorrectQuestionIds, getWeakestTopics, recordAnswer } from './store.js';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function indices(n) { return Array.from({ length: n }, (_, i) => i); }

/**
 * Deep-clones a question (so per-session display shuffling never
 * mutates the shared bank data) and attaches display-order arrays.
 * IMPORTANT: options/correctAnswer are left untouched — only the
 * *order in which they're rendered* is randomized, via _displayOrder
 * (array of original option indices, in the order to render them).
 * Every input the renderer produces (selected index, select-all
 * indices, matching pairs, ordering sequence) is expressed in terms
 * of ORIGINAL indices, so grading never needs to remap anything.
 */
function prepareForDisplay(question) {
  const q = JSON.parse(JSON.stringify(question));

  if (Array.isArray(q.options)) {
    q._displayOrder = q.type === 'true-false' ? indices(q.options.length) : shuffle(indices(q.options.length));
  }
  if (Array.isArray(q.matchOptions)) {
    q._matchDisplayOrder = shuffle(indices(q.matchOptions.length));
  }
  return q;
}

/**
 * config: {
 *   unitId, topicId ('weak' | 'all' | topic id), difficulty ('mixed' | one of DIFFICULTIES),
 *   count: number | 'all', selection: 'random' | 'unseen' | 'incorrect' | 'mixed', mode: 'practice' | 'exam'
 * }
 */
export function buildQuizSession(config) {
  const { unitId, topicId, difficulty, count, selection, mode } = config;
  let pool;

  if (topicId === 'weak') {
    const weak = getWeakestTopics(5, 2);
    pool = weak.length
      ? weak.flatMap(w => DIFFICULTIES.flatMap(d => getQuestions(w.unit, w.topic, d)))
      : getAllQuestions();
  } else if (topicId === 'all') {
    pool = getUnitQuestions(unitId);
  } else {
    pool = getQuestions(unitId, topicId, difficulty || 'mixed');
  }

  // The 'weak'/'all' presets pull from every difficulty by construction;
  // still honor an explicit (non-mixed) difficulty choice from the config form.
  if ((topicId === 'weak' || topicId === 'all') && difficulty && difficulty !== 'mixed') {
    pool = pool.filter(q => q.difficulty === difficulty);
  }

  let usedFallback = null;
  if (selection === 'unseen') {
    const seen = getSeenQuestionIds();
    const filtered = pool.filter(q => !seen.has(q.id));
    if (filtered.length) pool = filtered;
    else usedFallback = 'No unseen questions remain in this set — showing all questions instead.';
  } else if (selection === 'incorrect') {
    const incorrect = getIncorrectQuestionIds();
    const filtered = pool.filter(q => incorrect.has(q.id));
    if (filtered.length) pool = filtered;
    else usedFallback = 'No previously-incorrect questions in this set yet — showing all questions instead.';
  }

  pool = shuffle(pool);
  const n = count === 'all' || !count ? pool.length : Math.min(Number(count), pool.length);
  const questions = pool.slice(0, n).map(prepareForDisplay);

  return {
    id: `quiz-${Date.now()}`,
    config: { ...config },
    mode: mode || 'practice',
    questions,
    currentIndex: 0,
    answers: {},          // index -> { response, correct, checked }
    marked: {},           // index -> true
    startedAt: Date.now(),
    fallbackNotice: usedFallback,
  };
}

// ─── Grading ─────────────────────────────────────────────────

const CHOICE_TYPES = ['multiple-choice', 'true-false', 'output-prediction', 'code-debug', 'code-completion', 'scenario'];

function normalizeCode(str) {
  return String(str).replace(/\s+/g, '');
}

export function gradeResponse(question, response) {
  if (response === undefined || response === null || response === '') return false;

  if (CHOICE_TYPES.includes(question.type)) {
    return Number(response) === question.correctAnswer;
  }
  if (question.type === 'numeric') {
    const val = Number(response);
    if (Number.isNaN(val)) return false;
    const { value, tolerance = 0 } = question.correctAnswer;
    return Math.abs(val - value) <= tolerance;
  }
  if (question.type === 'select-all') {
    const a = [...response].map(Number).sort();
    const b = [...question.correctAnswer].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  if (question.type === 'matching') {
    if (!Array.isArray(response) || response.length !== question.correctAnswer.length) return false;
    return response.every((v, i) => Number(v) === question.correctAnswer[i]);
  }
  if (question.type === 'ordering') {
    if (!Array.isArray(response) || response.length !== question.correctAnswer.length) return false;
    return response.every((v, i) => Number(v) === question.correctAnswer[i]);
  }
  if (question.type === 'code-entry') {
    const norm = normalizeCode(response);
    return question.acceptableAnswers.some(a => normalizeCode(a) === norm);
  }
  return false;
}

/**
 * Grades any still-pending answers (exam mode defers grading until the
 * quiz is finished/ended) and records them to progress. Safe to call on
 * a practice-mode session too — everything there is already checked.
 */
export function finishQuiz(session) {
  session.questions.forEach((q, i) => {
    const a = session.answers[i];
    if (a && !a.checked) {
      const correct = gradeResponse(q, a.response);
      session.answers[i] = { ...a, correct, checked: true };
      recordAnswer({ questionId: q.id, unit: q.unit, topic: q.topic, difficulty: q.difficulty, correct });
    }
  });
  session.finishedAt = Date.now();
  return summarizeSession(session);
}

// ─── Session summary ────────────────────────────────────────

export function summarizeSession(session) {
  const total = session.questions.length;
  let correct = 0, incorrect = 0, skipped = 0;
  const byTopic = {};

  session.questions.forEach((q, i) => {
    const a = session.answers[i];
    const key = `${q.unit}::${q.topic}`;
    if (!byTopic[key]) byTopic[key] = { unit: q.unit, topic: q.topic, correct: 0, total: 0 };
    byTopic[key].total += 1;

    if (!a || !a.checked) { skipped += 1; return; }
    if (a.correct) { correct += 1; byTopic[key].correct += 1; }
    else incorrect += 1;
  });

  const scorePct = total ? Math.round((correct / total) * 100) : 0;
  const topics = Object.values(byTopic).map(t => ({ ...t, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0 }));

  return { total, correct, incorrect, skipped, scorePct, topics };
}
