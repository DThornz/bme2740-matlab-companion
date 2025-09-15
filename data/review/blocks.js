// ─────────────────────────────────────────────────────────────
// Tiny builder functions for Review-chapter content blocks. Each
// helper returns a plain, serializable object ({t: '<type>', ...})
// — no DOM, no HTML-escaping decisions made here. js/review-views.js
// (specifically renderBlock()) is the only place these get turned
// into markup, so content authors (data/review/unitN.js) describe
// *content*, not markup, except via the deliberate html() escape
// hatch below.
//
// This mirrors the separation already used elsewhere in the repo:
// data/questions/*.json describes questions, js/views.js renders
// them. Same idea here for the Review/textbook section.
// ─────────────────────────────────────────────────────────────

/** A paragraph. `html` may contain safe inline markup (<code>, <strong>, <em>, <a>) — this content is authored by us, not user input, same trust level as the rest of data/. */
export const p = (htmlText) => ({ t: 'p', html: htmlText });

/** A bulleted or numbered list. Each item may contain inline markup. */
export const list = (items, { ordered = false } = {}) => ({ t: 'list', items, ordered });

/**
 * A MATLAB code example. Pass `run: true` to make it an interactive
 * "Try it" block (see js/review-tryit.js) instead of a static,
 * copy-only block — per the spec's three levels (Read / Copy / Run).
 */
export const code = (source, { caption = '', run = false, output = '' } = {}) =>
  run ? { t: 'tryit', code: source, caption } : { t: 'code', code: source, caption, output };

/** kind: 'note' | 'remember' | 'mistake' | 'try' */
export const callout = (kind, title, htmlText) => ({ t: 'callout', kind, title, html: htmlText });

/** A compact "which tool for which job" or comparison table. */
export const table = (headers, rows) => ({ t: 'table', headers, rows });

/** An equation, rendered via the existing KaTeX auto-render pass (see app.js route()). Author `main` with $...$ or $$...$$ delimiters. */
export const eq = (main, { label = '', note = '' } = {}) => ({ t: 'eq', main, label, note });

/** A "Check Your Understanding" reveal-answer prompt — NOT a duplicate of the quiz bank, just a quick self-check while reading. */
export const quickCheck = (question, answerHtml) => ({ t: 'quickcheck', question, answerHtml });

/** Deep link into the practice/quiz system for a specific topic. */
export const practiceLink = (unitId, topicId, label) => ({ t: 'practicelink', unitId, topicId, label });

/** A small hand-authored inline SVG diagram — trusted, static markup. */
export const diagram = (svg, caption = '') => ({ t: 'diagram', svg, caption });

/** Escape hatch for anything the block types above don't cover. */
export const html = (raw) => ({ t: 'html', raw });

export function section(heading, blocks) {
  return { heading, blocks };
}

export function chapter({ id, unit, title, kicker = '', summary, minutes = 6, topics = [], sections }) {
  return { id, unit, title, kicker, summary, minutes, topics, sections };
}
