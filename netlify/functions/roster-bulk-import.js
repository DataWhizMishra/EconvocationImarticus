const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRowsByBatchId, appendRow } = require('./_lib/sheets');
const { newId } = require('./_lib/id');
const { colorForIndex } = require('./_lib/palette');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, namesText } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');
  if (!namesText) throw new HttpError(400, 'namesText is required');

  const names = namesText
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) throw new HttpError(400, 'No names found in the pasted list');

  const existing = await getRowsByBatchId('Roster', batchId);
  let sortOrder = existing.length;
  const created = [];
  for (const name of names) {
    const row = {
      batchId,
      learnerId: newId('learner'),
      name,
      colorHex: colorForIndex(sortOrder),
      photoUrl: '',
      photoDriveFileId: '',
      dreamJobTitle: '',
      dreamJobEmoji: '',
      sortOrder: String(sortOrder),
      joined: 'false',
      joinedAt: '',
    };
    // eslint-disable-next-line no-await-in-loop -- Sheets API has no multi-row append-with-generated-ids primitive
    await appendRow('Roster', row);
    created.push(row);
    sortOrder++;
  }
  return { created: created.length, learners: created };
});
