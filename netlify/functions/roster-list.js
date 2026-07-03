const { withHandler, HttpError } = require('./_lib/http');
const { getRowsByBatchId } = require('./_lib/sheets');
const { mapRoster } = require('./_lib/mappers');

// Public: join.html needs it for the name-autocomplete, live.html needs it for avatars.
exports.handler = withHandler(async ({ qs }) => {
  const { batchId } = qs;
  if (!batchId) throw new HttpError(400, 'batchId query param required');
  return mapRoster(await getRowsByBatchId('Roster', batchId));
});
