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
  { unit: 1, id: 'numerical-precision-taylor', topic: 'numerical-precision-taylor', title: 'Floating-Point Precision & Taylor Series',
    keywords: ['floating point', 'ieee 754', 'round-off error', 'truncation error', 'taylor series', 'maclaurin series', 'eps', 'machine epsilon'] },

  // ─ Unit 2 — Linear Systems and Models ─
  { unit: 2, id: 'linear-systems-basics', topic: 'linear-systems-basics', title: 'Linear Systems & Matrix Representation',
    keywords: ['coefficient matrix', 'augmented matrix', 'system of equations', 'matrix multiplication', 'transpose', 'linear dependence', 'linear independence'] },
  { unit: 2, id: 'solving-ax-b', topic: 'solving-ax-b', title: 'Matrix Operations & Solving Ax = b',
    keywords: ['backslash', 'inv', 'linear system', 'matrix inverse', 'rank', 'determinant', 'a\\b'] },
  { unit: 2, id: 'least-squares-regression', topic: 'least-squares-regression', title: 'Least Squares & Regression',
    keywords: ['normal equations', 'polyfit', 'polyval', 'r squared', 'coefficient of determination', 'sse', 'mse', 'over-determined'] },
  { unit: 2, id: 'vectorization-efficiency', topic: 'vectorization-efficiency', title: 'Vectorization & Efficiency',
    keywords: ['tic', 'toc', 'preallocation', 'vectorization', 'logical indexing', 'single precision', 'profiler'] },

  // ─ Unit 3 — Numerical Quadrature and Interpolation ─
  { unit: 3, id: 'numerical-quadrature', topic: 'numerical-quadrature', title: 'Numerical Quadrature',
    keywords: ['trapezoidal rule', "simpson's rule", 'trapz', 'integral', 'step size', 'convergence', 'auc'] },
  { unit: 3, id: 'interpolation', topic: 'interpolation', title: 'Interpolation',
    keywords: ['lagrange polynomial', 'polyfit', 'polyval', 'spline', 'extrapolation', "runge's phenomenon"] },

  // ─ Unit 4 — Numerical Integration ─
  { unit: 4, id: 'numerical-differentiation', topic: 'numerical-differentiation', title: 'Numerical Differentiation',
    keywords: ['forward difference', 'backward difference', 'central difference', 'gradient', 'diff', 'finite difference', 'truncation error'] },
  { unit: 4, id: 'ivp-euler', topic: 'ivp-euler', title: 'Initial Value Problems & Euler’s Method',
    keywords: ["euler's method", 'initial value problem', 'forward euler', 'backward euler', 'implicit euler', 'state variable'] },
  { unit: 4, id: 'numerical-stability', topic: 'numerical-stability', title: 'Step Size, Error & Stability',
    keywords: ['local error', 'global error', 'stiffness', 'step size', 'stability', 'instability'] },

  // ─ Unit 5 — Numerical Integration Extended ─
  { unit: 5, id: 'ode45-solving', topic: 'ode45-solving', title: 'Solving ODEs with ode45',
    keywords: ['ode45', 'adaptive step size', 'ode solver', 'tspan', 'tolerance'] },
  { unit: 5, id: 'coupled-ode-systems', topic: 'coupled-ode-systems', title: 'Coupled ODEs & State-Space Models',
    keywords: ['state-space', 'coupled odes', 'system of odes', 'vector state'] },
  { unit: 5, id: 'physiological-ode-models', topic: 'physiological-ode-models', title: 'Physiological ODE Modeling',
    keywords: ['fitzhugh-nagumo', 'van der pol', 'lotka-volterra', 'rlc circuit', 'phase portrait', 'symbolic math', 'dsolve'] },

  // ─ Unit 6 — Nonlinear Equations and Optimization ─
  { unit: 6, id: 'nonlinear-roots', topic: 'nonlinear-roots', title: 'Nonlinear Equations & Root Finding',
    keywords: ["newton's method", 'fzero', 'root finding', 'convergence'] },
  { unit: 6, id: 'optimization-basics', topic: 'optimization-basics', title: 'Optimization Fundamentals',
    keywords: ['gradient descent', 'fminbnd', 'local extrema', 'global extrema', 'objective function'] },
  { unit: 6, id: 'nonlinear-regression', topic: 'nonlinear-regression', title: 'Nonlinear Regression & Curve Fitting',
    keywords: ['fminsearch', 'nelder-mead', 'simplex', 'curve fitting', 'sum of squared error', 'hill equation'] },
];

// Course areas the Review landing page lists but that have no chapters
// yet — shown as "Coming Soon", same convention as UNITS.hasContent.
export const REVIEW_COMING_SOON = [];

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
