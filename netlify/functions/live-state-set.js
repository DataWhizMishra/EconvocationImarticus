const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { upsertRowByKey } = require('./_lib/sheets');

const ALLOWED = [
  'currentSlideIndex', 'currentSlideId', 'quizPhase', 'currentQuestionId',
  'questionIndex', 'certCycleIndex', 'awardCycleIndex',
];

// Mentor-only. Called on every Next/Prev/Reveal/cycle-cert/cycle-award action;
// this is the row every learner (and the mentor's own tally view) polls.
exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, ...patchIn } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');

  const patch = { batchId, updatedAt: new Date().toISOString(), updatedBy: 'mentor' };
  ALLOWED.forEach((k) => {
    if (patchIn[k] !== undefined) patch[k] = String(patchIn[k]);
  });

  return upsertRowByKey('LiveState', 'batchId', patch);
});
