const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { setLiveState, stampMusicStartIfAbsent } = require('./_lib/firebase');

const ALLOWED = [
  'currentSlideIndex', 'currentSlideId', 'quizPhase', 'currentQuestionId',
  'questionIndex', 'certCycleIndex', 'awardCycleIndex',
];

// Mentor-only. Called on every Next/Prev/Reveal/cycle-cert/cycle-award action
// (and once, with an empty patch, right when the mentor opens the live page).
// Writes straight to Firebase Realtime Database - every learner (and the
// mentor's own tally view) holds a live listener on this same node instead of
// polling, so this call landing is what makes the slide change appear
// everywhere, typically well under a second later.
exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, ...patchIn } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');

  const patch = { updatedAt: Date.now(), updatedBy: 'mentor' };
  ALLOWED.forEach((k) => {
    if (patchIn[k] !== undefined) patch[k] = patchIn[k];
  });

  // Stamp a shared start time for the background music, so every client
  // (mentor + every learner) can compute the same "how far into the loop are
  // we" offset from a common reference instead of each starting the track
  // from 0 independently. Only checked on the dedicated bootstrap call (empty
  // patch, sent once when the mentor opens the live page) - every other call
  // is on the hot path (fires on every Next/Prev/Reveal click).
  if (Object.keys(patchIn).length === 0) {
    await stampMusicStartIfAbsent(batchId);
  }

  return setLiveState(batchId, patch);
});
