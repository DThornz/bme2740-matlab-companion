// ─────────────────────────────────────────────────────────────
// localStorage-backed progress tracking. No student identity,
// no network calls — everything lives on this device only.
// Falls back to an in-memory object if localStorage is
// unavailable (private browsing, disabled storage, etc.).
// ─────────────────────────────────────────────────────────────

const KEY = 'bme2740_progress';
const VERSION = 1;

function emptyProgress() {
  return {
    version: VERSION,
    attempts: {},   // questionId -> { correct, timesCorrect, timesIncorrect, lastAttempt, unit, topic, difficulty }
    streak: { current: 0, best: 0 },
    history: [],    // capped ring buffer of recent attempts, most recent last
  };
}

let memoryFallback = null;
let storageOk = true;
try {
  const t = '__bme2740_test__';
  window.localStorage.setItem(t, '1');
  window.localStorage.removeItem(t);
} catch (e) {
  storageOk = false;
  memoryFallback = emptyProgress();
}

export function loadProgress() {
  if (!storageOk) return memoryFallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== VERSION) return emptyProgress();
    return parsed;
  } catch (e) {
    return emptyProgress();
  }
}

function saveProgress(progress) {
  if (!storageOk) { memoryFallback = progress; return; }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch (e) {
    // Storage full or blocked mid-session — keep working in memory only.
    storageOk = false;
    memoryFallback = progress;
  }
}

const MAX_HISTORY = 500;

export function recordAnswer({ questionId, unit, topic, difficulty, correct }) {
  const progress = loadProgress();
  const existing = progress.attempts[questionId] || { timesCorrect: 0, timesIncorrect: 0 };

  progress.attempts[questionId] = {
    correct,
    unit, topic, difficulty,
    timesCorrect: existing.timesCorrect + (correct ? 1 : 0),
    timesIncorrect: existing.timesIncorrect + (correct ? 0 : 1),
    lastAttempt: Date.now(),
  };

  progress.history.push({ questionId, unit, topic, difficulty, correct, timestamp: Date.now() });
  if (progress.history.length > MAX_HISTORY) progress.history = progress.history.slice(-MAX_HISTORY);

  if (correct) {
    progress.streak.current += 1;
    progress.streak.best = Math.max(progress.streak.best, progress.streak.current);
  } else {
    progress.streak.current = 0;
  }

  saveProgress(progress);
  return progress;
}

export function resetProgress() {
  saveProgress(emptyProgress());
}

export function isStorageAvailable() {
  return storageOk;
}

// ─── Derived stats ──────────────────────────────────────────

export function getOverallStats() {
  const progress = loadProgress();
  const attempts = Object.values(progress.attempts);
  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter(a => a.correct).length;
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  return {
    questionsAnswered: totalAnswered,
    questionsCorrect: totalCorrect,
    accuracy,
    currentStreak: progress.streak.current,
    bestStreak: progress.streak.best,
  };
}

export function getTopicAccuracy(unitId, topicId) {
  const progress = loadProgress();
  const attempts = Object.values(progress.attempts).filter(a => String(a.unit) === String(unitId) && a.topic === topicId);
  if (!attempts.length) return null;
  const correct = attempts.filter(a => a.correct).length;
  return Math.round((correct / attempts.length) * 100);
}

export function getUnitAccuracy(unitId) {
  const progress = loadProgress();
  const attempts = Object.values(progress.attempts).filter(a => String(a.unit) === String(unitId));
  if (!attempts.length) return null;
  const correct = attempts.filter(a => a.correct).length;
  return Math.round((correct / attempts.length) * 100);
}

export function getUnitAttemptedCount(unitId) {
  const progress = loadProgress();
  return Object.values(progress.attempts).filter(a => String(a.unit) === String(unitId)).length;
}

/** Topics with attempts, sorted worst-accuracy-first. */
export function getWeakestTopics(limit = 3, minAttempts = 3) {
  const progress = loadProgress();
  const byTopic = {};
  Object.values(progress.attempts).forEach(a => {
    const key = `${a.unit}::${a.topic}`;
    if (!byTopic[key]) byTopic[key] = { unit: a.unit, topic: a.topic, correct: 0, total: 0 };
    byTopic[key].total += 1;
    if (a.correct) byTopic[key].correct += 1;
  });
  return Object.values(byTopic)
    .filter(t => t.total >= minAttempts)
    .map(t => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function getRecentTopics(limit = 4) {
  const progress = loadProgress();
  const seen = new Set();
  const out = [];
  for (let i = progress.history.length - 1; i >= 0 && out.length < limit; i--) {
    const h = progress.history[i];
    const key = `${h.unit}::${h.topic}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ unit: h.unit, topic: h.topic, timestamp: h.timestamp });
  }
  return out;
}

export function getSeenQuestionIds() {
  return new Set(Object.keys(loadProgress().attempts));
}

export function getIncorrectQuestionIds() {
  const progress = loadProgress();
  return new Set(Object.entries(progress.attempts).filter(([, a]) => !a.correct).map(([id]) => id));
}

// ─── Live MATLAB grading preference ──────────────────────────
// Separate, tiny localStorage key (not part of the progress object above)
// — a standing opt-in preference, not progress data. Off by default:
// it requires downloading the ~15 MB MATLAB runtime and runs student code
// through it, which is more than a casual "Check Answer" click should
// silently trigger without the student choosing it first.
const LIVE_GRADING_KEY = 'bme2740_live_grading';

export function isLiveGradingEnabled() {
  if (!storageOk) return false;
  try {
    return window.localStorage.getItem(LIVE_GRADING_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export function setLiveGradingEnabled(enabled) {
  if (!storageOk) return;
  try {
    window.localStorage.setItem(LIVE_GRADING_KEY, enabled ? '1' : '0');
  } catch (e) {
    // ignore — preference just won't persist this session
  }
}
