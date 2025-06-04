// ─────────────────────────────────────────────────────────────
// Small shared DOM-building helpers used across views.js.
// ─────────────────────────────────────────────────────────────

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders a MATLAB code block with a copy button. Safe against HTML injection. */
export function codeBlock(code, { id = '' } = {}) {
  const blockId = id || `code-${Math.random().toString(36).slice(2)}`;
  return `
    <div class="code-block" data-code-id="${blockId}">
      <div class="code-block-bar">
        <span class="code-block-lang">MATLAB</span>
        <button type="button" class="code-copy-btn" data-copy-target="${blockId}">Copy</button>
      </div>
      <pre class="code-block-pre"><code id="${blockId}">${escapeHtml(code)}</code></pre>
    </div>`;
}

export function wireCodeCopyButtons(root) {
  root.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (!target) return;
      const text = target.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        // Clipboard API unavailable (older browser / no permission) — fail silently, UI still shows the code.
      }
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1200);
    });
  });
}

export function progressBar(pct, { label = '' } = {}) {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return `
    <div class="progress-bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" ${label ? `aria-label="${escapeHtml(label)}"` : ''}>
      <div class="progress-bar-fill" style="width:${p}%"></div>
    </div>`;
}

export function difficultyBadge(difficulty) {
  const labels = { beginner: 'BEGINNER', intermediate: 'INTERMEDIATE', advanced: 'ADVANCED', expert: 'EXPERT' };
  return `<span class="diff-badge diff-${difficulty}">${labels[difficulty] || difficulty.toUpperCase()}</span>`;
}

export function emptyState(message, { actionHtml = '' } = {}) {
  return `<div class="empty-state"><p>${escapeHtml(message)}</p>${actionHtml}</div>`;
}

export function errorState(message) {
  return `<div class="empty-state empty-state-error"><p>${escapeHtml(message)}</p></div>`;
}
