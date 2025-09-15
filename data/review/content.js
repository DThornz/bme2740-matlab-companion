// ─────────────────────────────────────────────────────────────
// Full Review chapter content registry. Only imported by
// js/review-views.js (dynamically, on the /learn routes) — see
// data/review/nav.js for the lightweight, always-loaded index used
// everywhere else.
// ─────────────────────────────────────────────────────────────

import { REVIEW_CHAPTERS } from './nav.js';
import { UNIT0_CHAPTERS } from './unit0.js';
import { UNIT1_CHAPTERS } from './unit1.js';
import { UNIT2_CHAPTERS } from './unit2.js';

const ALL_CHAPTERS = [...UNIT0_CHAPTERS, ...UNIT1_CHAPTERS, ...UNIT2_CHAPTERS];
const BY_KEY = new Map(ALL_CHAPTERS.map(c => [`${c.unit}::${c.id}`, c]));

export function getChapterContent(unitId, chapterId) {
  return BY_KEY.get(`${unitId}::${chapterId}`) || null;
}

/** Chapters in canonical course order (per data/review/nav.js), content attached. */
export function orderedChapters() {
  return REVIEW_CHAPTERS
    .map(nav => ({ nav, content: getChapterContent(nav.unit, nav.id) }))
    .filter(x => x.content);
}

export function adjacentChapters(unitId, chapterId) {
  const order = orderedChapters();
  const idx = order.findIndex(x => x.nav.unit === unitId && x.nav.id === chapterId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? order[idx - 1].nav : null,
    next: idx < order.length - 1 ? order[idx + 1].nav : null,
  };
}
