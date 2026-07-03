const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { upsertRowByKey } = require('./_lib/sheets');

// Bulk upsert: {batchId, messages:[{learnerId, learnerName, messageText}]}
exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, messages } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');
  if (!Array.isArray(messages)) throw new HttpError(400, 'messages array is required');

  let sortOrder = 0;
  for (const m of messages) {
    if (!m.learnerId) continue;
    // eslint-disable-next-line no-await-in-loop -- Sheets API has no batch-upsert primitive
    await upsertRowByKey('Messages', ['batchId', 'learnerId'], {
      batchId,
      learnerId: m.learnerId,
      learnerName: m.learnerName || '',
      messageText: m.messageText || '',
      sortOrder: String(sortOrder++),
    });
  }
  return { ok: true, saved: messages.length };
});
