const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { deleteRowByKey } = require('./_lib/sheets');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, questionId } = body;
  if (!batchId || !questionId) throw new HttpError(400, 'batchId and questionId are required');
  const deleted = await deleteRowByKey('Questions', ['batchId', 'questionId'], [batchId, questionId]);
  if (!deleted) throw new HttpError(404, 'Not found');
  return { ok: true };
});
