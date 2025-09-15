// ─────────────────────────────────────────────────────────────
// Lightweight, always-loaded index of Review chapters — id, title,
// which unit/topic each covers, and search keywords. Used by
// js/views.js (Practice side, eagerly loaded) and js/app.js's search
// to show "Review this topic →" links and search hits WITHOUT
// pulling in the full chapter content (data/review/unitN.js), which
// is dynamically imported only by js/review-views.js — see the
// /learn route in app.js, same lazy-loading pattern as the sandbox.
//
// Keep this in sync by hand whenever a chapter is added/renamed in
// data/review/unitN.js — it deliberately mirrors id/title/unit/topic
// rather than being generated, since this repo has no build step.
//
// One chapter per existing question-bank topic (see data/units.js) —
// not a separate taxonomy — so Review and Practice always line up
// 1:1 and cross-linking needs no fuzzy matching.
// ─────────────────────────────────────────────────────────────

export const REVIEW_CHAPTERS = [
  // ─ Unit 0 — MATLAB Overview ─
  { unit: 0, id: 'environment', topic: 'environment', title: 'The MATLAB Environment & Scripts',
    keywords: ['command window', 'workspace', 'current folder', 'live script', 'clear', 'clc', 'close all', 'editor'] },
  { unit: 0, id: 'syntax-operators', topic: 'variables-operators', title: 'Variables, Syntax & Operators',
    keywords: ['assignment', 'semicolon', 'comment', 'operator precedence', 'arithmetic', 'variable naming', 'isvarname'] },
  { unit: 0, id: 'vectors-matrices', topic: 'vectors-matrices', title: 'Vectors, Matrices & Indexing',
    keywords: ['row vector', 'column vector', 'colon operator', 'linspace', 'matrix', 'zeros', 'ones', 'eye', 'transpose', 'end', 'indexing', 'element-wise', '.*', './', '.^'] },
  { unit: 0, id: 'plotting-basics', topic: 'plotting-basics', title: 'Basic Plotting',
    keywords: ['plot', 'xlabel', 'ylabel', 'title', 'legend', 'grid on', 'hold on', 'figure'] },
  { unit: 0, id: 'control-flow', topic: 'control-flow', title: 'Logical Expressions & Control Flow',
    keywords: ['if', 'elseif', 'else', 'switch', 'case', 'logical operators', '&&', '||', 'relational operators'] },
  { unit: 0, id: 'loops-debugging', topic: 'loops-debugging', title: 'Loops, Debugging & Help',
    keywords: ['for loop', 'while loop', 'preallocation', 'infinite loop', 'debugging', 'error message', 'doc', 'help'] },

  // ─ Unit 1 — MATLAB ─
  { unit: 1, id: 'fundamentals-review', topic: 'fundamentals-review', title: 'Variables, Arrays & Indexing Review',
    keywords: ['logical indexing', 'find', 'boolean mask', 'element-wise operations'] },
  { unit: 1, id: 'io-and-scripts', topic: 'io-and-scripts', title: 'Functions, Input/Output & Scripts',
    keywords: ['function', 'input', 'output', 'multiple outputs', 'scope', 'function handle'] },
  { unit: 1, id: 'plotting-patterns', topic: 'plotting-patterns', title: 'Plotting & Programming Patterns',
    keywords: ['subplot', 'multiple curves', 'line style', 'marker', 'plotting idioms'] },
  { unit: 1, id: 'reading-output', topic: 'reading-output', title: 'Reading Code, Errors & Output',
    keywords: ['error message', 'predict output', 'common errors', 'debugging'] },

  // ─ Unit 2 — Linear Systems and Models (exemplary chapter) ─
  { unit: 2, id: 'solving-ax-b', topic: 'solving-ax-b', title: 'Matrix Operations & Solving Ax = b',
    keywords: ['backslash', 'inv', 'linear system', 'matrix inverse', 'rank', 'determinant', 'a\\b'] },
];

// Course areas the Review landing page lists but that have no chapters
// yet — shown as "Coming Soon", same convention as UNITS.hasContent.
export const REVIEW_COMING_SOON = [
  { label: 'Least Squares & Regression', unit: 2 },
  { label: 'Vectorization & Efficiency', unit: 2 },
  { label: 'Numerical Quadrature', unit: 3 },
  { label: 'Interpolation', unit: 3 },
  { label: 'Initial Value Problems & Euler’s Method', unit: 4 },
  { label: 'Solving ODEs with ode45', unit: 5 },
  { label: 'Nonlinear Equations & Optimization', unit: 6 },
  { label: 'Introduction to Neural Networks', unit: null },
];

export function findChapterForTopic(unitId, topicId) {
  return REVIEW_CHAPTERS.find(c => String(c.unit) === String(unitId) && c.topic === topicId) || null;
}

export function chaptersForUnit(unitId) {
  return REVIEW_CHAPTERS.filter(c => String(c.unit) === String(unitId));
}

export function reviewChapterHref(unitId, chapterId) {
  return `#/learn/unit${unitId}/${chapterId}`;
}

export function reviewUnitHref(unitId) {
  return `#/learn/unit${unitId}`;
}
