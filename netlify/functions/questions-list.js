const { withHandler, HttpError } = require('./_lib/http');
const { getRowsByBatchId } = require('./_lib/sheets');
const { mapQuestions } = require('./_lib/mappers');

// Public, but deliberately strips the answer key - correctIndex/explanation
// only ever reach a client via live-state-get, and only once revealed.
exports.handler = withHandler(async ({ qs }) => {
  const { batchId, kind } = qs;
  if (!batchId) throw new HttpError(400, 'batchId query param required');
  let rows = await getRowsByBatchId('Questions', batchId);
  if (kind) rows = rows.filter((r) => r.kind === kind);
  return mapQuestions(rows);
});
