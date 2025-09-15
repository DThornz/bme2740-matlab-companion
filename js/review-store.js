// ─────────────────────────────────────────────────────────────
// localStorage-backed "have I read this Review chapter" tracking.
// Deliberately separate from js/store.js's quiz progress — this is
// not graded, not scored, just a subtle "% explored" signal (see
// spec §42: "Do not make this a graded system"). Same
// storage-unavailable fallback pattern as store.js.
// ─────────────────────────────────────────────────────────────

const KEY = 'bme2740_review_progress';

let memoryFallback = null;
let storageOk = true;
try {
  const t = '__bme2740_review_test__';
  window.localStorage.setItem(t, '1');
  window.localStorage.removeItem(t);
} catch (e) {
  storageOk = false;
  memoryFallback = {};
}

function load() {
  if (!storageOk) return memoryFallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function save(data) {
  if (!storageOk) { memoryFallback = data; return; }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    storageOk = false;
    memoryFallback = data;
  }
}

function chapterKey(unitId, chapterId) {
  return `${unitId}::${chapterId}`;
}

export function isChapterReviewed(unitId, chapterId) {
  return !!load()[chapterKey(unitId, chapterId)];
}

export function setChapterReviewed(unitId, chapterId, reviewed) {
  const data = load();
  const key = chapterKey(unitId, chapterId);
  if (reviewed) data[key] = Date.now();
  else delete data[key];
  save(data);
}

/** Fraction (0-100) of the given chapter ids marked reviewed for a unit. */
export function unitExploredPct(unitId, chapterIds) {
  if (!chapterIds.length) return 0;
  const data = load();
  const done = chapterIds.filter(id => data[chapterKey(unitId, id)]).length;
  return Math.round((done / chapterIds.length) * 100);
}
