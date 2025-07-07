// ─────────────────────────────────────────────────────────────
// Question bank aggregator.
//
// Combines the unit/topic metadata in /data/units.js with the
// per-unit question modules in /data/questions/*.js into one
// queryable structure, and exposes counting + validation helpers.
//
// TO ADD A NEW UNIT'S QUESTIONS: write /data/questions/unitN.js
// exporting `unitNQuestions` (same shape as unit0Questions), then
// import it below and add it to QUESTION_MODULES. Nothing else
// needs to change — units.js already carries hasContent/topics.
// ─────────────────────────────────────────────────────────────

import { UNITS, DIFFICULTIES, getUnit, getTopic } from '../data/units.js';
import { unit0Questions } from '../data/questions/unit0.js';
import { unit1Questions } from '../data/questions/unit1.js';

const QUESTION_MODULES = {
  0: unit0Questions,
  1: unit1Questions,
};

// unitId -> topicId -> difficulty -> Question[]
const BANK = {};

function buildBank() {
  UNITS.forEach(unit => {
    const unitData = {};
    const src = QUESTION_MODULES[unit.id] || {};
    unit.topics.forEach(topic => {
      const topicSrc = src[topic.id] || {};
      const topicData = {};
      DIFFICULTIES.forEach(diff => {
        topicData[diff] = Array.isArray(topicSrc[diff]) ? topicSrc[diff] : [];
      });
      unitData[topic.id] = topicData;
    });
    BANK[unit.id] = unitData;
  });
}
buildBank();

/** All questions for a topic+difficulty (or [] if none exist yet). */
export function getQuestions(unitId, topicId, difficulty) {
  const unit = BANK[unitId];
  if (!unit || !unit[topicId]) return [];
  if (difficulty === 'mixed' || !difficulty) {
    return DIFFICULTIES.flatMap(d => unit[topicId][d] || []);
  }
  return unit[topicId][difficulty] || [];
}

/** All questions across every difficulty for every topic in a unit. */
export function getUnitQuestions(unitId) {
  const unit = BANK[unitId];
  if (!unit) return [];
  return Object.values(unit).flatMap(topic => DIFFICULTIES.flatMap(d => topic[d] || []));
}

/** Every question in the entire bank, flattened. */
export function getAllQuestions() {
  return UNITS.flatMap(u => getUnitQuestions(u.id));
}

export function countQuestions(unitId, topicId, difficulty) {
  if (topicId && difficulty) return getQuestions(unitId, topicId, difficulty).length;
  if (topicId) return DIFFICULTIES.reduce((n, d) => n + getQuestions(unitId, topicId, d).length, 0);
  if (unitId !== undefined) return getUnitQuestions(unitId).length;
  return getAllQuestions().length;
}

export function countByDifficulty(unitId, topicId) {
  const out = {};
  DIFFICULTIES.forEach(d => { out[d] = getQuestions(unitId, topicId, d).length; });
  return out;
}

export function getQuestionById(id) {
  return getAllQuestions().find(q => q.id === id) || null;
}

export { UNITS, DIFFICULTIES, getUnit, getTopic };

// ─── Validation ─────────────────────────────────────────────
const CHOICE_TYPES = ['multiple-choice', 'true-false', 'output-prediction', 'code-debug', 'code-completion', 'scenario'];
const VALID_TYPES = [...CHOICE_TYPES, 'numeric', 'select-all', 'matching', 'ordering', 'code-entry'];

/**
 * Developer-facing sanity check over the whole question bank.
 * Returns { errors, warnings } (arrays of strings) and logs them
 * to the console. Run automatically once in dev (see app.js).
 */
export function validateQuestionBank() {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  getAllQuestions().forEach(q => {
    const tag = q.id || '(missing id)';

    if (!q.id) errors.push(`${tag}: missing "id"`);
    else if (seenIds.has(q.id)) errors.push(`${q.id}: duplicate id`);
    else seenIds.add(q.id);

    if (q.unit === undefined || q.unit === null) errors.push(`${tag}: missing "unit"`);
    else if (!getUnit(q.unit)) errors.push(`${tag}: unit "${q.unit}" does not exist in units.js`);

    if (!q.topic) errors.push(`${tag}: missing "topic"`);
    else if (!getTopic(q.unit, q.topic)) errors.push(`${tag}: topic "${q.topic}" not found in unit ${q.unit}`);

    if (!DIFFICULTIES.includes(q.difficulty)) errors.push(`${tag}: invalid difficulty "${q.difficulty}"`);
    if (!VALID_TYPES.includes(q.type)) errors.push(`${tag}: invalid type "${q.type}"`);
    if (!q.question) errors.push(`${tag}: missing "question" text`);
    if (!q.explanation) warnings.push(`${tag}: missing "explanation"`);
    if (!q.concept) warnings.push(`${tag}: missing "concept"`);
    if (!q.references || !q.references.length) warnings.push(`${tag}: missing "references"`);
    if (!q.tags || !q.tags.length) warnings.push(`${tag}: missing "tags"`);

    if (CHOICE_TYPES.includes(q.type)) {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${tag}: choice-type question needs at least 2 "options"`);
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= (q.options || []).length) {
        errors.push(`${tag}: "correctAnswer" must be a valid index into options`);
      }
    } else if (q.type === 'numeric') {
      if (!q.correctAnswer || typeof q.correctAnswer.value !== 'number') errors.push(`${tag}: numeric question needs correctAnswer.value`);
    } else if (q.type === 'select-all') {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${tag}: select-all question needs at least 2 "options"`);
      if (!Array.isArray(q.correctAnswer) || !q.correctAnswer.length) errors.push(`${tag}: select-all "correctAnswer" must be a non-empty array of indices`);
    } else if (q.type === 'matching') {
      if (!Array.isArray(q.options) || !Array.isArray(q.matchOptions)) errors.push(`${tag}: matching question needs "options" and "matchOptions"`);
      if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length !== (q.options || []).length) errors.push(`${tag}: matching "correctAnswer" must have one entry per left-hand option`);
    } else if (q.type === 'ordering') {
      if (!Array.isArray(q.options)) errors.push(`${tag}: ordering question needs "options"`);
      if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length !== (q.options || []).length) errors.push(`${tag}: ordering "correctAnswer" must be a permutation of option indices`);
    } else if (q.type === 'code-entry') {
      if (!Array.isArray(q.acceptableAnswers) || !q.acceptableAnswers.length) errors.push(`${tag}: code-entry question needs "acceptableAnswers"`);
    }
  });

  if (errors.length) console.error(`[BME2740] Question bank validation: ${errors.length} error(s)`, errors);
  if (warnings.length) console.warn(`[BME2740] Question bank validation: ${warnings.length} warning(s)`, warnings);
  if (!errors.length && !warnings.length) console.info('[BME2740] Question bank validation passed with no issues.');

  return { errors, warnings };
}
