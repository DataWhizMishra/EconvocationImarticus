const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRows, deleteRowByKey } = require('./_lib/sheets');
const { deletePhoto } = require('./_lib/drive');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, learnerId } = body;
  if (!batchId || !learnerId) throw new HttpError(400, 'batchId and learnerId are required');

  const rows = await getRows('Roster');
  const row = rows.find((r) => r.batchId === batchId && r.learnerId === learnerId);
  if (row && row.photoDriveFileId) {
    await deletePhoto(row.photoDriveFileId);
  }
  const deleted = await deleteRowByKey('Roster', ['batchId', 'learnerId'], [batchId, learnerId]);
  if (!deleted) throw new HttpError(404, 'Learner not found');
  return { ok: true };
});
