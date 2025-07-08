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

// ─── Export / Import (backup & restore, cross-device transfer) ──────────
// Everything lives only in this browser's localStorage (see file header),
// so it's one "clear browsing data" away from being gone — this is the
// student's way to back it up or move it to another device.
//
// Two independent version numbers are involved and shouldn't be confused:
//   - `EXPORT_FORMAT_VERSION` (this section) is the shape of the *export
//     file itself* (the envelope: exportedAt/progress/preferences).
//   - `VERSION` (top of this file) is the shape of the *progress object*
//     inside it, unchanged from what's already stored under `bme2740_progress`.
// Each can evolve independently without breaking the other.
const EXPORT_FORMAT_VERSION = 1;

// Registry for future envelope migrations: MIGRATIONS[v] takes an envelope
// at format version v and returns one at v+1. Empty for now (v1 is the
// only format that has ever existed) — this is the seam a v2 change would
// hook into, so a file exported today keeps importing correctly forever.
const MIGRATIONS = {};

function migrateEnvelope(envelope, warnings) {
  let e = envelope;
  const declared = typeof e.exportFormat === 'number' ? e.exportFormat : null;
  if (declared === null) {
    warnings.push('This file has no export-format version — importing on a best-effort basis.');
    return e;
  }
  if (declared > EXPORT_FORMAT_VERSION) {
    warnings.push(`This file was exported from a newer version of the app (format v${declared}; this app supports up to v${EXPORT_FORMAT_VERSION}) — importing what this version recognizes, the rest is ignored.`);
    return e; // forward compat: fields this version doesn't know about are simply never read below
  }
  while (e.exportFormat < EXPORT_FORMAT_VERSION) {
    const step = MIGRATIONS[e.exportFormat];
    if (!step) { warnings.push(`No migration path from format v${e.exportFormat} to v${EXPORT_FORMAT_VERSION} — importing as-is.`); break; }
    e = step(e);
  }
  return e;
}

function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }

function sanitizeAttempt(a) {
  if (!a || typeof a !== 'object') return null;
  return {
    correct: !!a.correct,
    unit: a.unit,
    topic: typeof a.topic === 'string' ? a.topic : undefined,
    difficulty: typeof a.difficulty === 'string' ? a.difficulty : undefined,
    timesCorrect: isFiniteNumber(a.timesCorrect) ? a.timesCorrect : 0,
    timesIncorrect: isFiniteNumber(a.timesIncorrect) ? a.timesIncorrect : 0,
    lastAttempt: isFiniteNumber(a.lastAttempt) ? a.lastAttempt : Date.now(),
  };
}

/**
 * Rebuilds a guaranteed-valid progress object from whatever a (possibly
 * older, newer, hand-edited, or partially corrupted) parsed progress blob
 * contains — every field is defaulted rather than trusted, so this never
 * throws on unexpected shapes. This is what makes import forward- *and*
 * backward-compatible in practice: a field this code doesn't recognize is
 * silently dropped (forward compat — a newer export just has extra fields
 * ignored here), and a field that's missing/malformed just falls back to
 * its default (backward compat — an older/thinner export still imports).
 */
function sanitizeProgress(raw) {
  const out = emptyProgress();
  if (!raw || typeof raw !== 'object') return out;

  if (raw.attempts && typeof raw.attempts === 'object') {
    Object.entries(raw.attempts).forEach(([id, a]) => {
      const s = sanitizeAttempt(a);
      if (s) out.attempts[id] = s;
    });
  }
  if (raw.streak && typeof raw.streak === 'object') {
    out.streak.current = isFiniteNumber(raw.streak.current) ? raw.streak.current : 0;
    out.streak.best = isFiniteNumber(raw.streak.best) ? raw.streak.best : 0;
  }
  if (Array.isArray(raw.history)) {
    out.history = raw.history
      .filter(h => h && typeof h === 'object' && typeof h.questionId === 'string')
      .map(h => ({
        questionId: h.questionId,
        unit: h.unit, topic: h.topic, difficulty: h.difficulty,
        correct: !!h.correct,
        timestamp: isFiniteNumber(h.timestamp) ? h.timestamp : Date.now(),
      }))
      .slice(-MAX_HISTORY);
  }
  return out;
}

/** Everything this device has stored, as a pretty-printed JSON string ready to download. */
export function exportProgressJSON() {
  const envelope = {
    app: 'bme2740-matlab-companion',
    exportFormat: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    progress: loadProgress(),
    preferences: { liveGrading: isLiveGradingEnabled() },
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Restores progress from a previously-exported JSON string, REPLACING
 * whatever is currently stored on this device. Never throws on a
 * recognizable-but-unusual shape (older format, newer format, missing
 * optional fields) — see sanitizeProgress()/migrateEnvelope() above —
 * it only throws for input that isn't parseable JSON or isn't an object
 * at all, since there's nothing reasonable to import from that.
 *
 * Returns { warnings } — a (possibly empty) array of human-readable notes
 * about anything unusual encountered (format mismatch, missing fields),
 * worth surfacing to the student so a partial/lossy import isn't silent.
 */
export function importProgressJSON(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error('That file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('That file does not look like a progress export.');
  }

  const warnings = [];
  // Backward compat with a hypothetical un-enveloped export (or someone
  // pointing this at the raw progress object itself, e.g. copied straight
  // out of localStorage) — treat the whole parsed object as the progress
  // blob directly if it isn't wrapped in the expected envelope shape.
  const envelope = ('progress' in parsed) ? migrateEnvelope(parsed, warnings) : { progress: parsed };

  const sanitized = sanitizeProgress(envelope.progress);
  saveProgress(sanitized);

  if (envelope.preferences && typeof envelope.preferences === 'object' && typeof envelope.preferences.liveGrading === 'boolean') {
    setLiveGradingEnabled(envelope.preferences.liveGrading);
  }

  return { warnings };
}
