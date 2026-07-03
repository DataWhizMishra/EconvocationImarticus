const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { deleteRowByKey } = require('./_lib/sheets');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, certId } = body;
  if (!batchId || !certId) throw new HttpError(400, 'batchId and certId are required');
  const deleted = await deleteRowByKey('SpecialCerts', ['batchId', 'certId'], [batchId, certId]);
  if (!deleted) throw new HttpError(404, 'Not found');
  return { ok: true };
});
