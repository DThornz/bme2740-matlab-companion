// ─────────────────────────────────────────────────────────────
// Parses a Review chapter written as Markdown (see
// data/review/content/unitN/chapterId.md) into the same chapter
// object shape data/review/blocks.js's chapter()/section() builders
// used to produce by hand — {id, unit, title, kicker, summary,
// minutes, sections: [{heading, blocks}]}. js/review-views.js's
// renderBlock() is unchanged; it doesn't know or care whether a
// block object came from hand-written JS or parsed Markdown.
//
// Deliberately a small hand-written parser, not a general-purpose
// Markdown library: content here is fully author-controlled (same
// trust level data/review/blocks.js's header already documents —
// raw HTML in the source passes through untouched, no sanitizing),
// and the output is a specific object shape, not an HTML string, so
// a generic Markdown-to-HTML library wouldn't fit without its own
// custom-renderer layer anyway.
//
// Format, in brief:
//   ---
//   id: solving-ax-b
//   unit: 2
//   title: Matrix Operations & Solving Ax = b
//   kicker: Unit 2 · Linear Systems and Models
//   summary: ...
//   minutes: 11
//   ---
//   ## Section Heading
//   A paragraph. **bold**, `code`, _em_, [text](url) all work; raw
//   <code>HTML</code> tags pass through untouched.
//
//   - a list item
//   - another
//
//   | Col A | Col B |
//   | --- | --- |
//   | 1 | 2 |
//
//   ```matlab
//   x = 1;   % read-only, Copy-only block
//   ```
//
//   ```matlab run caption="x = A\b solves the system directly"
//   x = A\b; % interactive Try-it block
//   ```
//
//   :::callout kind="remember" title="Remember"
//   Body text, same inline rules as a paragraph.
//   :::
//
//   :::quickcheck
//   Q: Question text?
//   A: Answer text.
//   :::
//
//   :::practice unit=2 topic=solving-ax-b
//   Practice: Solving Ax = b
//   :::
//
//   :::eq label="(1)"
//   2x_1 + x_2 = 11
//
//   Optional note paragraph below a blank line.
//   :::
//
//   :::diagram caption="..."
//   <svg>...</svg>
//   :::
// ─────────────────────────────────────────────────────────────

const CALLOUT_KINDS = new Set(['note', 'remember', 'mistake', 'try', 'sandbox']);

// Tags that open a genuine raw-HTML block (see the raw-HTML-block check in parseBlocks
// below). Deliberately an allowlist of block-level elements, not a blocklist of inline
// ones — inline tags like <code>/<strong>/<em>/<kbd>/<a> routinely open a paragraph in
// this content's writing style and must still render as a normal <p> block.
const HTML_BLOCK_TAGS = new Set(['div', 'svg', 'figure', 'table', 'section', 'article', 'header', 'footer', 'form', 'ul', 'ol', 'blockquote', 'pre', 'video', 'iframe', 'nav', 'aside', 'main']);

// Inline tags this content already writes raw HTML with. Matched as whole pairs (not via
// a backreference) so their contents — which may contain a literal '*' or '_', e.g.
// <code>*</code> for the element-wise-multiply operator — are protected verbatim before
// the markdown transforms below run, instead of being mistaken for markdown syntax.
const INLINE_TAG_PAIRS = [
  /<code>[\s\S]*?<\/code>/g,
  /<strong>[\s\S]*?<\/strong>/g,
  /<em>[\s\S]*?<\/em>/g,
  /<a\s[^>]*>[\s\S]*?<\/a>/g,
  /<kbd>[\s\S]*?<\/kbd>/g,
];

/** Parses `key="value"` / `key=value` pairs from a container's opening line (after its type word). */
function parseAttrs(rest) {
  const attrs = {};
  const re = /(\w+)=("([^"]*)"|(\S+))/g;
  let m;
  while ((m = re.exec(rest))) attrs[m[1]] = m[3] !== undefined ? m[3] : m[4];
  return attrs;
}

/**
 * Markdown inline syntax -> HTML. Raw HTML already in the text (e.g. <code>*</code>, an
 * element-wise-operator reference that's common in this course's prose) is protected
 * before the bold/italic/link transforms run, and restored after — otherwise a bare '*'
 * sitting inside an existing tag's content gets mistaken for italic markup and mangles
 * both the tag's content and anything up to the next stray '*' in the paragraph.
 */
function inlineMd(text) {
  const protectedSpans = [];
  const protect = s => { protectedSpans.push(s); return `\u0000${protectedSpans.length - 1}\u0000`; };

  let out = text.replace(/`([^`]+)`/g, (_, code) => protect(`<code>${code}</code>`));
  for (const re of INLINE_TAG_PAIRS) out = out.replace(re, m => protect(m));
  out = out.replace(/<[a-zA-Z][^<>]*\/?>/g, m => protect(m)); // remaining lone/self-closing tags

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<![\w*])\*([^*\n]+)\*(?!\w)/g, '<em>$1</em>');
  out = out.replace(/(?<![\w_])_([^_\n]+)_(?![\w_])/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => protectedSpans[Number(i)]);
  return out;
}

/** Joins soft-wrapped lines within one logical paragraph into a single line, trimming each. */
function joinLines(lines) {
  return lines.map(l => l.trim()).join(' ').trim();
}

/** Splits text on blank lines into paragraphs, inline-transforms each, and wraps in <p> only when there's more than one. */
function bodyToHtml(bodyLines) {
  const paras = splitOnBlankLines(bodyLines).filter(p => p.length);
  const htmlParas = paras.map(p => inlineMd(joinLines(p)));
  return htmlParas.length > 1 ? htmlParas.map(h => `<p>${h}</p>`).join('') : (htmlParas[0] || '');
}

function splitOnBlankLines(lines) {
  const groups = [[]];
  for (const line of lines) {
    if (line.trim() === '') { if (groups[groups.length - 1].length) groups.push([]); }
    else groups[groups.length - 1].push(line);
  }
  return groups.filter(g => g.length);
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (mm) meta[mm[1]] = mm[2].trim();
  }
  return { meta, body: raw.slice(m[0].length) };
}

function parseBlocks(bodyLines) {
  const blocks = [];
  let i = 0;
  while (i < bodyLines.length) {
    const line = bodyLines[i];
    const trimmed = line.trim();

    if (trimmed === '') { i++; continue; }

    // Fenced code block.
    const fenceMatch = trimmed.match(/^```(.*)$/);
    if (fenceMatch) {
      const info = fenceMatch[1].trim();
      const codeLines = [];
      i++;
      while (i < bodyLines.length && bodyLines[i].trim() !== '```') { codeLines.push(bodyLines[i]); i++; }
      i++; // skip closing fence
      const run = /(^|\s)run(\s|$)/.test(info);
      const captionMatch = info.match(/caption="([^"]*)"/);
      const caption = captionMatch ? captionMatch[1] : '';
      const code = codeLines.join('\n');
      blocks.push(run ? { t: 'tryit', code, caption } : { t: 'code', code, caption, output: '' });
      continue;
    }

    // Container (:::type attrs ... :::).
    const containerMatch = trimmed.match(/^:::(\w+)\s*(.*)$/);
    if (containerMatch) {
      const type = containerMatch[1];
      const attrs = parseAttrs(containerMatch[2]);
      const bodyChunk = [];
      i++;
      while (i < bodyLines.length && bodyLines[i].trim() !== ':::') { bodyChunk.push(bodyLines[i]); i++; }
      i++; // skip closing :::
      blocks.push(buildContainerBlock(type, attrs, bodyChunk));
      continue;
    }

    // Table (GFM pipe syntax).
    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < bodyLines.length && bodyLines[i].trim().startsWith('|')) { tableLines.push(bodyLines[i].trim()); i++; }
      const cells = l => l.replace(/^\||\|$/g, '').split('|').map(c => inlineMd(c.trim()));
      const headers = cells(tableLines[0]);
      const rows = tableLines.slice(2).map(cells); // row 1 is the --- separator
      blocks.push({ t: 'table', headers, rows });
      continue;
    }

    // List (- item / 1. item).
    if (/^(-|\*|\d+\.)\s/.test(trimmed)) {
      const ordered = /^\d+\./.test(trimmed);
      const items = [];
      while (i < bodyLines.length && /^(-|\*|\d+\.)\s/.test(bodyLines[i].trim())) {
        items.push(inlineMd(bodyLines[i].trim().replace(/^(-|\*|\d+\.)\s/, '')));
        i++;
      }
      blocks.push({ t: 'list', items, ordered });
      continue;
    }

    // Raw HTML block: a chunk that opens with a block-level tag (<div>, <svg>, <table>, ...)
    // passes through verbatim. A paragraph that merely *starts* with an inline tag (e.g.
    // "<code>x</code> is assignment...", a common pattern in this content) is NOT a raw
    // HTML block — it still needs the <p class="review-p"> wrapper, so it falls through
    // to the plain-paragraph case below.
    const blockTagMatch = trimmed.match(/^<\/?([a-zA-Z][\w-]*)/);
    if (blockTagMatch && HTML_BLOCK_TAGS.has(blockTagMatch[1].toLowerCase())) {
      const chunk = [];
      while (i < bodyLines.length && bodyLines[i].trim() !== '') { chunk.push(bodyLines[i]); i++; }
      blocks.push({ t: 'html', raw: chunk.join('\n') });
      continue;
    }

    // Plain paragraph.
    {
      const chunk = [];
      while (i < bodyLines.length && bodyLines[i].trim() !== '' && !isBlockStart(bodyLines[i])) { chunk.push(bodyLines[i]); i++; }
      blocks.push({ t: 'p', html: inlineMd(joinLines(chunk)) });
    }
  }
  return blocks;
}

function isBlockStart(line) {
  const t = line.trim();
  return t.startsWith('```') || t.startsWith(':::') || t.startsWith('|') || /^(-|\*|\d+\.)\s/.test(t);
}

function buildContainerBlock(type, attrs, bodyLines) {
  switch (type) {
    case 'callout': {
      const kind = CALLOUT_KINDS.has(attrs.kind) ? attrs.kind : 'note';
      return { t: 'callout', kind, title: attrs.title || '', html: bodyToHtml(bodyLines) };
    }
    case 'quickcheck': {
      const text = bodyLines.join('\n');
      const qMatch = text.match(/Q:\s*([\s\S]*?)(?:\nA:|$)/);
      const aMatch = text.match(/A:\s*([\s\S]*)$/);
      const question = qMatch ? inlineMd(joinLines(qMatch[1].split('\n'))) : '';
      const answerHtml = aMatch ? bodyToHtml(aMatch[1].split('\n')) : '';
      return { t: 'quickcheck', question, answerHtml };
    }
    case 'practice': {
      const label = inlineMd(joinLines(bodyLines));
      return { t: 'practicelink', unitId: Number(attrs.unit), topicId: attrs.topic, label };
    }
    case 'eq': {
      const paras = splitOnBlankLines(bodyLines);
      const main = paras[0] ? joinLines(paras[0]) : '';
      const note = paras[1] ? bodyToHtml(paras[1]) : '';
      return { t: 'eq', main, label: attrs.label || '', note };
    }
    case 'diagram':
      return { t: 'diagram', svg: bodyLines.join('\n'), caption: attrs.caption || '' };
    case 'html':
      return { t: 'html', raw: bodyLines.join('\n') };
    default:
      return { t: 'html', raw: '' };
  }
}

/** rawText -> chapter object, the same shape data/review/blocks.js's chapter() produces. */
export function parseChapterMarkdown(rawText) {
  const { meta, body } = parseFrontmatter(rawText);
  const bodyLines = body.split(/\r?\n/);

  const sections = [];
  let current = null;
  for (const line of bodyLines) {
    const headingMatch = line.match(/^##\s+(.*)$/);
    if (headingMatch) {
      current = { heading: headingMatch[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }

  return {
    id: meta.id,
    unit: Number(meta.unit),
    title: meta.title,
    kicker: meta.kicker || '',
    summary: meta.summary || '',
    minutes: Number(meta.minutes) || 6,
    topics: [],
    sections: sections.map(s => ({ heading: s.heading, blocks: parseBlocks(s.lines) })),
  };
}
