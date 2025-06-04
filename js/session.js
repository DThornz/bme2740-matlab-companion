// ─────────────────────────────────────────────────────────────
// Ephemeral (tab-scoped) state for the currently active quiz and
// the most recent results, so a page refresh mid-quiz doesn't
// lose everything. Uses sessionStorage, not localStorage — this
// is scratch state, not progress history (that's store.js).
// ─────────────────────────────────────────────────────────────

const ACTIVE_KEY = 'bme2740_active_quiz';
const RESULTS_KEY = 'bme2740_last_results';

function safeGet(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function safeSet(key, value) {
  try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}
function safeRemove(key) {
  try { window.sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
}

export function saveActiveSession(session) { safeSet(ACTIVE_KEY, session); }
export function loadActiveSession() { return safeGet(ACTIVE_KEY); }
export function clearActiveSession() { safeRemove(ACTIVE_KEY); }

export function saveLastResults(summary, session) { safeSet(RESULTS_KEY, { summary, session }); }
export function loadLastResults() { return safeGet(RESULTS_KEY); }
