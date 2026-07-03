const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { deleteRowByKey } = require('./_lib/sheets');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, awardId } = body;
  if (!batchId || !awardId) throw new HttpError(400, 'batchId and awardId are required');
  const deleted = await deleteRowByKey('Awards', ['batchId', 'awardId'], [batchId, awardId]);
  if (!deleted) throw new HttpError(404, 'Not found');
  return { ok: true };
});
