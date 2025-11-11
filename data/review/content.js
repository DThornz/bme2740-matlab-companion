// ─────────────────────────────────────────────────────────────
// Full Review chapter content registry. Only imported by
// js/review-views.js (dynamically, on the /learn routes) — see
// data/review/nav.js for the lightweight, always-loaded index used
// everywhere else.
//
// Chapter text lives in data/review/content/unit{N}/{chapterId}.md
// (Markdown — see data/review/md-parser.js for the format), one file
// per REVIEW_CHAPTERS entry. All chapters are fetched and parsed in
// parallel the first time any of this module's functions are called,
// same fetch-all-then-cache pattern js/bank.js's loadQuestionModules()
// uses for question JSON — and cached from then on, so every function
// here is async but only pays the network/parse cost once per page load.
// ─────────────────────────────────────────────────────────────

import { REVIEW_CHAPTERS } from './nav.js';
import { parseChapterMarkdown } from './md-parser.js';

const BY_KEY = new Map();
let loadPromise = null;

function ensureLoaded() {
  if (!loadPromise) {
    loadPromise = Promise.all(REVIEW_CHAPTERS.map(async nav => {
      const url = new URL(`./content/unit${nav.unit}/${nav.id}.md`, import.meta.url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load Review chapter ${nav.unit}/${nav.id}: HTTP ${res.status}`);
      const text = await res.text();
      BY_KEY.set(`${nav.unit}::${nav.id}`, parseChapterMarkdown(text));
    }));
  }
  return loadPromise;
}

export async function getChapterContent(unitId, chapterId) {
  await ensureLoaded();
  return BY_KEY.get(`${unitId}::${chapterId}`) || null;
}

/** Chapters in canonical course order (per data/review/nav.js), content attached. */
export async function orderedChapters() {
  await ensureLoaded();
  return REVIEW_CHAPTERS
    .map(nav => ({ nav, content: BY_KEY.get(`${nav.unit}::${nav.id}`) || null }))
    .filter(x => x.content);
}

export async function adjacentChapters(unitId, chapterId) {
  const order = await orderedChapters();
  const idx = order.findIndex(x => x.nav.unit === unitId && x.nav.id === chapterId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? order[idx - 1].nav : null,
    next: idx < order.length - 1 ? order[idx + 1].nav : null,
  };
}
