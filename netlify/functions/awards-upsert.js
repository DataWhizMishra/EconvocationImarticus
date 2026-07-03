const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRowsByBatchId, appendRow, upsertRowByKey } = require('./_lib/sheets');
const { newId } = require('./_lib/id');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, awardId, category, winnerLearnerId, winnerName, winnerRole, sortOrder } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');
  if (!category || !winnerName) throw new HttpError(400, 'category and winnerName are required');

  if (awardId) {
    const patch = { batchId, awardId, category, winnerLearnerId: winnerLearnerId || '', winnerName, winnerRole: winnerRole || '' };
    if (sortOrder !== undefined) patch.sortOrder = String(sortOrder);
    const updated = await upsertRowByKey('Awards', ['batchId', 'awardId'], patch);
    return updated;
  }

  const existing = await getRowsByBatchId('Awards', batchId);
  const row = {
    batchId,
    awardId: newId('award'),
    category,
    winnerLearnerId: winnerLearnerId || '',
    winnerName,
    winnerRole: winnerRole || '',
    sortOrder: String(sortOrder !== undefined ? sortOrder : existing.length),
  };
  await appendRow('Awards', row);
  return row;
});
