const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRowsByBatchId, appendRow, upsertRowByKey } = require('./_lib/sheets');
const { newId } = require('./_lib/id');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, certId, type, icon, label, awardTitle, winners, description, sortOrder } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');
  if (!label) throw new HttpError(400, 'label is required');

  const winnerNames = Array.isArray(winners) ? winners.join('|') : winners || '';

  if (certId) {
    const patch = {
      batchId,
      certId,
      type: type || 'custom',
      icon: icon || '🏅',
      label,
      awardTitle: awardTitle || '',
      winnerNames,
    };
    if (description !== undefined) patch.description = description;
    if (sortOrder !== undefined) patch.sortOrder = String(sortOrder);
    const updated = await upsertRowByKey('SpecialCerts', ['batchId', 'certId'], patch);
    return updated;
  }

  const existing = await getRowsByBatchId('SpecialCerts', batchId);
  const row = {
    batchId,
    certId: newId('cert'),
    type: type || 'custom',
    icon: icon || '🏅',
    label,
    awardTitle: awardTitle || '',
    winnerLearnerIds: '',
    winnerNames,
    description: description || '',
    sortOrder: String(sortOrder !== undefined ? sortOrder : existing.length),
  };
  await appendRow('SpecialCerts', row);
  return row;
});
