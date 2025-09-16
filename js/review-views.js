// ─────────────────────────────────────────────────────────────
// Review section — the "learn/reference" companion to the quiz
// system (js/views.js), covering the same course material but for
// reading and experimenting rather than self-testing. Dynamically
// imported by js/app.js's /learn routes only, same lazy-loading
// pattern as js/sandbox.js — most of the actual chapter text lives
// in data/review/unitN.js, pulled in here via data/review/content.js.
// ─────────────────────────────────────────────────────────────

import { UNITS, countQuestions } from './bank.js';
import { REVIEW_CHAPTERS, REVIEW_COMING_SOON, chaptersForUnit, reviewChapterHref, reviewUnitHref } from '../data/review/nav.js';
import { getChapterContent, adjacentChapters } from '../data/review/content.js';
import { escapeHtml, codeBlock, wireCodeCopyButtons, emptyState, errorState, progressBar } from './render.js';
import { tryItBlockHtml, wireTryItBlocks } from './review-tryit.js';
import * as reviewStore from './review-store.js';

// ─── Landing page ───────────────────────────────────────────

export function renderLearnHome(container) {
  const unitCards = UNITS.map(unit => {
    const chapters = chaptersForUnit(unit.id);
    const hasReview = chapters.length > 0;
    const exploredPct = hasReview ? reviewStore.unitExploredPct(unit.id, chapters.map(c => c.id)) : 0;
    return `
      <a class="review-unit-card ${hasReview ? '' : 'review-unit-card-soon'}" href="${hasReview ? reviewUnitHref(unit.id) : '#/learn'}" ${hasReview ? '' : 'aria-disabled="true" tabindex="-1"'}>
        <div class="review-unit-card-num">${String(unit.id).padStart(2, '0')} · Unit ${unit.id}</div>
        <div class="review-unit-card-title">${escapeHtml(unit.title)}</div>
        ${hasReview
          ? `<div class="review-unit-card-count">${chapters.length} chapter${chapters.length === 1 ? '' : 's'} · ${exploredPct}% explored</div>`
          : `<span class="soon-badge">Coming Soon</span>`}
      </a>`;
  }).join('');

  const comingSoonHtml = REVIEW_COMING_SOON.map(c => `<span class="pill">${escapeHtml(c.label)}</span>`).join('');

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Review</span></nav>
    <div class="hero" style="padding-top:20px">
      <div class="hero-kicker">BME 2740 Review</div>
      <h1 class="hero-title" style="font-size:clamp(1.9em,4vw,2.6em)">MATLAB &amp; Computational Modeling</h1>
      <p class="hero-sub">A structured reference covering the programming, numerical methods, and modeling techniques used in BME 2740 — read before or during practice, whenever you think “I don’t quite remember how this works.”</p>
    </div>

    <div class="callout" style="margin-bottom:40px">
      <div class="callout-title">Review vs. Practice</div>
      <strong>Review</strong> (this section) teaches the material — explanations, examples, and code you can run and edit. <strong>Practice</strong> (the quizzes) tests it. They’re cross-linked throughout: every chapter links to matching practice questions, and practice results link back to the chapter that explains what you missed.
    </div>

    <div class="section">
      <div class="section-num">§ Course Units</div>
      <h2 class="section-title">Chapters</h2>
      <div class="review-landing-grid">${unitCards}</div>
    </div>

    ${comingSoonHtml ? `
    <div class="section">
      <div class="section-num">Coming Soon</div>
      <h2 class="section-title">Planned Chapters</h2>
      <div class="section-body"><p>Not written yet — Unit 0, Unit 1, and one worked Unit 2 chapter are live first; the rest are being added unit by unit.</p></div>
      <div class="pill-row">${comingSoonHtml}</div>
    </div>` : ''}
  `;
}

// ─── Unit chapter list ──────────────────────────────────────

export function renderLearnUnit(container, unitSlug) {
  const unit = UNITS.find(u => u.slug === unitSlug);
  if (!unit) { container.innerHTML = errorState('That Review unit could not be found.') + backLink(); return; }

  const chapters = chaptersForUnit(unit.id);
  if (!chapters.length) {
    container.innerHTML = `
      <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/learn">Review</a><span>/</span><span>${escapeHtml(unit.short)}</span></nav>
      <div class="section">
        <div class="section-num">§ Unit ${unit.id}</div>
        <h1 class="section-title" style="font-size:2.1em">${escapeHtml(unit.title)}</h1>
        ${emptyState('Review chapters for this unit haven’t been written yet — check back soon.', { actionHtml: `<div class="dashboard-actions"><a class="btn btn-outline" href="#/learn">Back to Review</a></div>` })}
      </div>`;
    return;
  }

  const exploredPct = reviewStore.unitExploredPct(unit.id, chapters.map(c => c.id));

  const chapterListHtml = chapters.map(c => {
    const reviewed = reviewStore.isChapterReviewed(unit.id, c.id);
    const content = getChapterContent(unit.id, c.id);
    return `
      <a class="review-chapter-card" href="${reviewChapterHref(unit.id, c.id)}">
        <div>
          <div class="review-chapter-card-title">${escapeHtml(c.title)}</div>
          ${content ? `<div class="review-chapter-card-desc">${escapeHtml(content.summary)}</div>` : ''}
        </div>
        ${reviewed ? '<span class="review-chapter-check" title="Reviewed">✓</span>' : ''}
      </a>`;
  }).join('');

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/learn">Review</a><span>/</span><span>${escapeHtml(unit.short)}</span></nav>
    <div class="section">
      <div class="section-num">§ Unit ${unit.id} Review</div>
      <h1 class="section-title" style="font-size:2.1em">${escapeHtml(unit.title)}</h1>
      <div class="section-body"><p>${escapeHtml(unit.description)}</p></div>
      <div class="unit-card-progress" style="max-width:340px;margin:16px 0 4px">
        ${progressBar(exploredPct, { label: `${unit.title} review progress` })}
        <span class="unit-card-pct">${exploredPct}% explored</span>
      </div>
      <div class="dashboard-actions"><a class="btn btn-outline" href="#/unit/${unit.id}">Go to Practice for this Unit</a></div>
    </div>
    <div class="section">
      <h2 class="section-title">Chapters</h2>
      <div class="review-chapter-list">${chapterListHtml}</div>
    </div>
  `;
}

// ─── Chapter page ───────────────────────────────────────────

export function renderLearnChapter(container, unitSlug, chapterId) {
  const unit = UNITS.find(u => u.slug === unitSlug);
  const nav = unit && REVIEW_CHAPTERS.find(c => c.unit === unit.id && c.id === chapterId);
  const content = nav && getChapterContent(unit.id, chapterId);

  if (!unit || !nav || !content) {
    container.innerHTML = errorState('That Review chapter could not be found.') + backLink();
    return;
  }

  const { prev, next } = adjacentChapters(unit.id, chapterId);
  const chaptersInUnit = chaptersForUnit(unit.id);
  const reviewed = reviewStore.isChapterReviewed(unit.id, chapterId);

  const sidebarHtml = chaptersInUnit.map(c => `
    <a class="review-toc-item ${c.id === chapterId ? 'review-toc-current' : ''}" href="${reviewChapterHref(unit.id, c.id)}">
      <span class="review-toc-check">${reviewStore.isChapterReviewed(unit.id, c.id) ? '✓' : ''}</span>
      <span>${escapeHtml(c.title)}</span>
    </a>`).join('');

  const sectionsHtml = content.sections.map(s => `
    <div class="review-section">
      <h2 class="review-section-heading">${escapeHtml(s.heading)}</h2>
      ${s.blocks.map(renderBlock).join('')}
    </div>`).join('');

  const chapterTopic = nav.topic;
  const hasPracticeQuestions = countQuestions(unit.id, chapterTopic) > 0;
  const practiceHref = `#/quiz/config?unit=${unit.id}&topic=${chapterTopic}&difficulty=mixed`;

  container.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/learn">Review</a><span>/</span><a href="${reviewUnitHref(unit.id)}">${escapeHtml(unit.short)}</a><span>/</span><span>${escapeHtml(content.title)}</span></nav>
    <div class="review-layout">
      <aside class="review-sidebar">
        <div class="review-sidebar-title">Unit ${unit.id} — ${escapeHtml(unit.short)}</div>
        <nav class="review-toc" aria-label="Chapters in this unit">${sidebarHtml}</nav>
      </aside>
      <div class="review-chapter">
        <div class="review-chapter-kicker">${escapeHtml(content.kicker)}</div>
        <h1 class="review-chapter-title">${escapeHtml(content.title)}</h1>
        <p class="review-chapter-summary">${escapeHtml(content.summary)}</p>
        <div class="review-chapter-meta">
          <span>⏱ ~${content.minutes} min read</span>
          <button type="button" class="btn btn-outline btn-sm" id="markReviewedBtn">${reviewed ? '✓ Reviewed' : 'Mark as Reviewed'}</button>
        </div>

        ${sectionsHtml}

        <div class="review-footer">
          <div class="dashboard-actions">
            ${hasPracticeQuestions
              ? `<a class="btn btn-primary" href="${practiceHref}">Practice This Topic →</a>`
              : `<span class="input-hint">Practice questions for this topic aren’t published yet.</span>`}
            <a class="btn btn-outline" href="${reviewUnitHref(unit.id)}">Back to Unit ${unit.id} Review</a>
          </div>
          <div class="review-prevnext">
            ${prev ? `<a class="review-prevnext-link review-prev" href="${reviewChapterHref(prev.unit, prev.id)}">← Previous: ${escapeHtml(prev.title)}</a>` : '<span></span>'}
            ${next ? `<a class="review-prevnext-link review-next" href="${reviewChapterHref(next.unit, next.id)}">Next: ${escapeHtml(next.title)} →</a>` : '<span></span>'}
          </div>
        </div>
      </div>
    </div>
  `;

  wireCodeCopyButtons(container);
  wireTryItBlocks(container);
  wireQuickChecks(container);

  const markBtn = container.querySelector('#markReviewedBtn');
  markBtn.addEventListener('click', () => {
    const now = !reviewStore.isChapterReviewed(unit.id, chapterId);
    reviewStore.setChapterReviewed(unit.id, chapterId, now);
    markBtn.textContent = now ? '✓ Reviewed' : 'Mark as Reviewed';
    markBtn.classList.toggle('btn-outline', true);
  });
}

function backLink() {
  return `<div class="dashboard-actions"><a class="btn btn-outline" href="#/learn">Back to Review</a></div>`;
}

// ─── Block rendering ────────────────────────────────────────

const CALLOUT_META = {
  note: { cls: 'callout', title: 'Note' },
  remember: { cls: 'callout callout-green', title: 'Remember' },
  mistake: { cls: 'callout callout-amber', title: 'Common Mistake' },
  try: { cls: 'callout callout-blue', title: 'Try It' },
};

let qcCounter = 0;

function renderBlock(block) {
  switch (block.t) {
    case 'p':
      return `<p class="review-p">${block.html}</p>`;
    case 'list':
      return block.ordered
        ? `<ol class="review-list">${block.items.map(i => `<li>${i}</li>`).join('')}</ol>`
        : `<ul class="review-list">${block.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    case 'code':
      return `${block.caption ? `<div class="review-code-caption">${escapeHtml(block.caption)}</div>` : ''}${codeBlock(block.code)}`;
    case 'tryit':
      return `${block.caption ? `<div class="review-code-caption">${escapeHtml(block.caption)}</div>` : ''}${tryItBlockHtml(block.code, '')}`;
    case 'callout': {
      const meta = CALLOUT_META[block.kind] || CALLOUT_META.note;
      return `<div class="${meta.cls}"><div class="callout-title">${escapeHtml(block.title || meta.title)}</div>${block.html}</div>`;
    }
    case 'table':
      return `<div style="overflow-x:auto"><table class="param-table review-table"><thead><tr>${block.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'eq':
      // $$...$$ (display math), not inline $...$ — .eq-main's CSS (see style.css
      // "Equation display") specifically overrides KaTeX's display-mode margin/
      // alignment for use inside this flex row, so display mode is what it expects.
      return `<div class="eq-block"><div class="eq-row">${block.label ? `<span class="eq-label">${escapeHtml(block.label)}</span>` : ''}<span class="eq-main">$$${block.main}$$</span></div>${block.note ? `<div class="eq-note">${block.note}</div>` : ''}</div>`;
    case 'quickcheck':
      return renderQuickCheck(block);
    case 'practicelink':
      return countQuestions(block.unitId, block.topicId) > 0
        ? `<div class="dashboard-actions"><a class="btn btn-primary" href="#/quiz/config?unit=${block.unitId}&topic=${block.topicId}&difficulty=mixed">${escapeHtml(block.label)} →</a></div>`
        : `<p class="input-hint">${escapeHtml(block.label)} — practice questions for this topic aren’t published yet.</p>`;
    case 'diagram':
      return `<figure class="review-diagram">${block.svg}${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`;
    case 'html':
      return block.raw;
    default:
      return '';
  }
}

function renderQuickCheck(block) {
  const id = `qc-${++qcCounter}`;
  return `
    <div class="quick-check">
      <span class="quick-check-tag">Check Your Understanding</span>
      <div class="quick-check-q">${block.question}</div>
      <button type="button" class="btn btn-outline btn-sm" data-qc-toggle="${id}">Reveal Answer</button>
      <div class="quick-check-answer" id="${id}" hidden>${block.answerHtml}</div>
    </div>`;
}

function wireQuickChecks(root) {
  root.querySelectorAll('[data-qc-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = root.querySelector(`#${btn.dataset.qcToggle}`);
      if (!el) return;
      const wasHidden = el.hidden;
      el.hidden = !wasHidden;
      btn.textContent = wasHidden ? 'Hide Answer' : 'Reveal Answer';
    });
  });
}
