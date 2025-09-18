// ─────────────────────────────────────────────────────────────
// Router + bootstrap. Hash-based, so the whole app works as a
// static file over GitHub Pages with no server-side routing.
// ─────────────────────────────────────────────────────────────

import { validateQuestionBank } from './bank.js';
import {
  renderDashboard, renderUnit, renderTopic, renderQuizConfig,
  renderQuiz, renderResults, renderReview, renderReference,
  renderSearch, renderInstructor, renderBrowse,
} from './views.js';
import { errorState } from './render.js';
import { isLiveGradingEnabled, setLiveGradingEnabled } from './store.js';

const app = document.getElementById('appRoot');
const isInstructorMode = new URLSearchParams(location.search).get('mode') === 'instructor';

const ROUTES = [
  { pattern: /^\/$/, render: () => renderDashboard(app) },
  { pattern: /^\/unit\/([^/]+)$/, render: m => renderUnit(app, decodeURIComponent(m[1])) },
  { pattern: /^\/unit\/([^/]+)\/topic\/([^/]+)$/, render: m => renderTopic(app, decodeURIComponent(m[1]), decodeURIComponent(m[2])) },
  { pattern: /^\/quiz\/config$/, render: (m, params) => renderQuizConfig(app, params) },
  { pattern: /^\/quiz\/active$/, render: () => renderQuiz(app) },
  { pattern: /^\/quiz\/results$/, render: () => renderResults(app) },
  { pattern: /^\/quiz\/review$/, render: () => renderReview(app) },
  { pattern: /^\/reference$/, render: () => renderReference(app) },
  { pattern: /^\/browse$/, render: (m, params) => renderBrowse(app, params) },
  // Dynamically imported — sandbox.js pulls in matlab-runtime.js, which owns a
  // Web Worker. Keeping that out of the eagerly-loaded module graph means
  // visitors who never open the sandbox never pay for it (see README "MATLAB
  // Sandbox" for why a worker is used at all).
  { pattern: /^\/sandbox$/, render: async () => {
      app.innerHTML = '<div class="empty-state">Loading…</div>';
      const { renderSandbox } = await import('./sandbox.js');
      renderSandbox(app);
    } },
  // Review section — the "learn/reference" companion to the quiz system
  // (see data/review/). Dynamically imported for the same reason as the
  // sandbox above: most visitors practicing questions never open it, so
  // its chapter content shouldn't be in their initial page load.
  { pattern: /^\/learn$/, render: async () => {
      app.innerHTML = '<div class="empty-state">Loading…</div>';
      const { renderLearnHome } = await import('./review-views.js');
      renderLearnHome(app);
    } },
  { pattern: /^\/learn\/([^/]+)$/, render: async m => {
      app.innerHTML = '<div class="empty-state">Loading…</div>';
      const { renderLearnUnit } = await import('./review-views.js');
      renderLearnUnit(app, decodeURIComponent(m[1]));
    } },
  { pattern: /^\/learn\/([^/]+)\/([^/]+)$/, render: async m => {
      app.innerHTML = '<div class="empty-state">Loading…</div>';
      const { renderLearnChapter } = await import('./review-views.js');
      renderLearnChapter(app, decodeURIComponent(m[1]), decodeURIComponent(m[2]));
    } },
  { pattern: /^\/search$/, render: (m, params) => renderSearch(app, params.get('q') || '') },
  { pattern: /^\/instructor$/, render: () => {
      if (!isInstructorMode) { location.hash = '#/'; return; }
      renderInstructor(app);
    } },
];

function parseHash() {
  const raw = location.hash || '#/';
  const withoutHash = raw.slice(1) || '/';           // drop leading '#'
  const [path, queryString] = withoutHash.split('?');
  return { path, params: new URLSearchParams(queryString || '') };
}

async function route() {
  const hash = location.hash;
  // Plain in-page anchors (e.g. "#units" from the dashboard's "Explore Course
  // Topics" button) are not app routes — let the browser's native anchor
  // scrolling handle those without re-rendering the view underneath it.
  if (hash && !hash.startsWith('#/')) return;

  const { path, params } = parseHash();
  const match = ROUTES.find(r => r.pattern.test(path));

  if (!match) {
    app.innerHTML = errorState('Page not found.') + '<div class="dashboard-actions"><a class="btn btn-outline" href="#/">Back to Dashboard</a></div>';
    return;
  }
  // Awaited — several routes (sandbox, /learn/*) render() asynchronously via a
  // dynamic import (see ROUTES above) and only populate #appRoot once that
  // resolves. Firing renderMath() without waiting for it used to run KaTeX
  // against the "Loading…" placeholder instead of the real content, leaving
  // any $$...$$ in a Review chapter showing as raw, unrendered text.
  await match.render(path.match(match.pattern), params);
  window.scrollTo(0, 0);
  // KaTeX loads via <script defer>; guard in case this runs before it's ready.
  if (window.renderMath) window.renderMath();
}

window.addEventListener('hashchange', route);

// Kept separate from script.js (the shared template's accessibility-panel
// logic for dark mode / font size / font style) since this toggle is
// specific to this project, not the shared design system.
function initLiveGradingToggle() {
  const toggle = document.getElementById('liveGradingToggle');
  if (!toggle) return;
  toggle.checked = isLiveGradingEnabled();
  toggle.addEventListener('change', () => setLiveGradingEnabled(toggle.checked));
}

// type="module" scripts execute after the document has been parsed, so the
// DOM (including #appRoot) is already available here — no need to wait for
// DOMContentLoaded.
validateQuestionBank();
initLiveGradingToggle();
route();
