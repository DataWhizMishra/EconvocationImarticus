const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRows, upsertRowByKey } = require('./_lib/sheets');

const ALLOWED = [
  'currentSlideIndex', 'currentSlideId', 'quizPhase', 'currentQuestionId',
  'questionIndex', 'certCycleIndex', 'awardCycleIndex',
];

// Mentor-only. Called on every Next/Prev/Reveal/cycle-cert/cycle-award action
// (and once, with an empty patch, right when the mentor opens the live page);
// this is the row every learner (and the mentor's own tally view) polls.
exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, ...patchIn } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');

  const patch = { batchId, updatedAt: new Date().toISOString(), updatedBy: 'mentor' };
  ALLOWED.forEach((k) => {
    if (patchIn[k] !== undefined) patch[k] = String(patchIn[k]);
  });

  // Stamp a shared start time for the background music, so every client
  // (mentor + every learner) can compute the same "how far into the loop are
  // we" offset from a common reference instead of each starting the track
  // from 0 independently. Only checked on the dedicated bootstrap call (empty
  // patch, sent once when the mentor opens the live page) - every other call
  // is on the hot path (fires on every Next/Prev/Reveal click) and skipping
  // this extra Apps Script round trip there matters for slide-sync latency.
  if (Object.keys(patchIn).length === 0) {
    const rows = await getRows('LiveState');
    const existing = rows.find((r) => r.batchId === batchId);
    if (!existing || !existing.musicStartedAt) {
      patch.musicStartedAt = String(Date.now());
    }
  }

  return upsertRowByKey('LiveState', 'batchId', patch);
});
