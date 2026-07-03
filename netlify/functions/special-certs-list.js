const { withHandler, HttpError } = require('./_lib/http');
const { getRowsByBatchId } = require('./_lib/sheets');
const { mapCerts } = require('./_lib/mappers');

exports.handler = withHandler(async ({ qs }) => {
  const { batchId } = qs;
  if (!batchId) throw new HttpError(400, 'batchId query param required');
  return mapCerts(await getRowsByBatchId('SpecialCerts', batchId));
});
