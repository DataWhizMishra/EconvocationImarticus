const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRowsByBatchId, appendRow, upsertRowByKey } = require('./_lib/sheets');
const { newId } = require('./_lib/id');
const { colorForIndex } = require('./_lib/palette');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, learnerId, name, colorHex, dreamJobTitle, dreamJobEmoji, sortOrder } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');
  if (!name || !String(name).trim()) throw new HttpError(400, 'name is required');

  if (learnerId) {
    const patch = { batchId, learnerId, name };
    if (colorHex !== undefined) patch.colorHex = colorHex;
    if (dreamJobTitle !== undefined) patch.dreamJobTitle = dreamJobTitle;
    if (dreamJobEmoji !== undefined) patch.dreamJobEmoji = dreamJobEmoji;
    if (sortOrder !== undefined) patch.sortOrder = String(sortOrder);
    const updated = await upsertRowByKey('Roster', ['batchId', 'learnerId'], patch);
    return updated;
  }

  const existing = await getRowsByBatchId('Roster', batchId);
  const row = {
    batchId,
    learnerId: newId('learner'),
    name,
    colorHex: colorHex || colorForIndex(existing.length),
    photoUrl: '',
    photoDriveFileId: '',
    dreamJobTitle: dreamJobTitle || '',
    dreamJobEmoji: dreamJobEmoji || '',
    sortOrder: String(sortOrder !== undefined ? sortOrder : existing.length),
    joined: 'false',
    joinedAt: '',
  };
  await appendRow('Roster', row);
  return row;
});
