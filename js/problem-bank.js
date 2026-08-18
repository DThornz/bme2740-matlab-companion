// ─────────────────────────────────────────────────────────────
// Problem-set bank aggregator — the "Problem Sets" feature.
//
// Separate from js/bank.js (the multiple-choice question bank). These are
// longer, multi-part word problems in the style of the actual BME 2740
// homework assignments and practice quizzes (see MATLAB Files/Assignment_*
// and Quiz_*_Practice.mlx) — a student reads a scenario, works through
// parts a/b/c… in MATLAB, can reveal progressive hints, and can then
// compare against a fully worked solution with comments. Not graded and
// not wired into store.js progress tracking.
//
// Data lives in /data/problems/unitN.json, one flat array per unit. Shape
// of each entry:
//   {
//     id: "U{unit}-WB-{difficulty letter}{2-digit seq}",  // e.g. "U0-WB-B01"
//     unit: Number,
//     topic: String,           // a topic id from data/units.js for this unit
//     difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
//     title: String,
//     context: String,         // scenario/framing paragraph shown before the parts
//     parts: [{ label: 'a', prompt: String }, ...],
//     starterCode: String,     // comment-only (or deliberately-buggy) MATLAB stub —
//                              // meant to be copied into a blank script/Live Script
//     hints: [String, ...],    // revealed one at a time, on deliberate click
//     solutionCode: String,    // full worked MATLAB solution, commented per part
//     solutionExplanation: String,
//     concept: String,
//     tags: [String, ...],
//     references: [String, ...],
//   }
//
// TO ADD A NEW UNIT'S PROBLEM SETS: write /data/problems/unitN.json (same
// shape as unit0.json), then add it to PROBLEM_FILES below.
// ─────────────────────────────────────────────────────────────

import { UNITS, DIFFICULTIES, getUnit, getTopic } from '../data/units.js';

const PROBLEM_FILES = {
  0: 'unit0.json',
  1: 'unit1.json',
  2: 'unit2.json',
  3: 'unit3.json',
  4: 'unit4.json',
  5: 'unit5.json',
  6: 'unit6.json',
};

async function loadProblemModules() {
  const entries = await Promise.all(
    Object.entries(PROBLEM_FILES).map(async ([unitId, file]) => {
      const url = new URL(`../data/problems/${file}`, import.meta.url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${file}: HTTP ${res.status}`);
      return [unitId, await res.json()];
    })
  );
  return Object.fromEntries(entries);
}

const PROBLEM_MODULES = await loadProblemModules();

/** All problem sets for a unit (or [] if none exist yet). */
export function getUnitProblems(unitId) {
  return PROBLEM_MODULES[String(unitId)] || [];
}

/** Problem sets for a unit, optionally filtered to one difficulty ('mixed' or omitted = all). */
export function getProblems(unitId, difficulty) {
  const all = getUnitProblems(unitId);
  if (!difficulty || difficulty === 'mixed') return all;
  return all.filter(p => p.difficulty === difficulty);
}

export function countProblems(unitId, difficulty) {
  return getProblems(unitId, difficulty).length;
}

export function countProblemsByDifficulty(unitId) {
  const out = {};
  DIFFICULTIES.forEach(d => { out[d] = getProblems(unitId, d).length; });
  return out;
}

export function getProblemById(id) {
  for (const unitId of Object.keys(PROBLEM_MODULES)) {
    const found = PROBLEM_MODULES[unitId].find(p => p.id === id);
    if (found) return found;
  }
  return null;
}

export function getAllProblems() {
  return Object.values(PROBLEM_MODULES).flat();
}

export { UNITS, DIFFICULTIES, getUnit, getTopic };

// ─── Validation ─────────────────────────────────────────────

/**
 * Developer-facing sanity check over the whole problem-set bank. Mirrors
 * validateQuestionBank() in bank.js. Returns { errors, warnings } and logs
 * them to the console; called once from problem-views.js when that module
 * first loads (i.e. only once a student actually opens Problem Sets).
 */
export function validateProblemBank() {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  getAllProblems().forEach(p => {
    const tag = p.id || '(missing id)';

    if (!p.id) errors.push(`${tag}: missing "id"`);
    else if (seenIds.has(p.id)) errors.push(`${p.id}: duplicate id`);
    else seenIds.add(p.id);

    if (p.unit === undefined || p.unit === null) errors.push(`${tag}: missing "unit"`);
    else if (!getUnit(p.unit)) errors.push(`${tag}: unit "${p.unit}" does not exist in units.js`);

    if (p.topic && !getTopic(p.unit, p.topic)) errors.push(`${tag}: topic "${p.topic}" not found in unit ${p.unit}`);

    if (!DIFFICULTIES.includes(p.difficulty)) errors.push(`${tag}: invalid difficulty "${p.difficulty}"`);
    if (!p.title) errors.push(`${tag}: missing "title"`);
    if (!Array.isArray(p.parts) || !p.parts.length) errors.push(`${tag}: missing "parts"`);
    else p.parts.forEach((part, i) => {
      if (!part.label) errors.push(`${tag}: part ${i} missing "label"`);
      if (!part.prompt) errors.push(`${tag}: part ${i} missing "prompt"`);
    });

    if (!p.starterCode) warnings.push(`${tag}: missing "starterCode"`);
    if (!p.solutionCode) errors.push(`${tag}: missing "solutionCode"`);
    if (!p.solutionExplanation) warnings.push(`${tag}: missing "solutionExplanation"`);
    if (!p.hints || !p.hints.length) warnings.push(`${tag}: missing "hints"`);
    if (!p.concept) warnings.push(`${tag}: missing "concept"`);
    if (!p.references || !p.references.length) warnings.push(`${tag}: missing "references"`);
    if (!p.tags || !p.tags.length) warnings.push(`${tag}: missing "tags"`);
  });

  if (errors.length) console.error(`[BME2740] Problem bank validation: ${errors.length} error(s)`, errors);
  if (warnings.length) console.warn(`[BME2740] Problem bank validation: ${warnings.length} warning(s)`, warnings);
  if (!errors.length && !warnings.length) console.info('[BME2740] Problem bank validation passed with no issues.');

  return { errors, warnings };
}
