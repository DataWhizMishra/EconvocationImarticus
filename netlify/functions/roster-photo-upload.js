const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRows, updateRowByKey } = require('./_lib/sheets');
const { uploadPhoto, deletePhoto } = require('./_lib/drive');

// ~1.5MB decoded, generous over the "under ~300KB" guidance given to mentors client-side.
const MAX_BASE64_CHARS = 2_000_000;

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { batchId, learnerId, filename, contentType, dataBase64 } = body;
  if (!batchId || !learnerId) throw new HttpError(400, 'batchId and learnerId are required');
  if (!dataBase64) throw new HttpError(400, 'dataBase64 is required');
  if (dataBase64.length > MAX_BASE64_CHARS) {
    throw new HttpError(413, 'Photo too large - please compress it before uploading');
  }

  const rows = await getRows('Roster');
  const row = rows.find((r) => r.batchId === batchId && r.learnerId === learnerId);
  if (!row) throw new HttpError(404, 'Learner not found');

  if (row.photoDriveFileId) {
    await deletePhoto(row.photoDriveFileId);
  }

  const safeName = `${batchId}_${learnerId}_${(filename || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { fileId, photoUrl } = await uploadPhoto(dataBase64, safeName, contentType || 'image/jpeg');

  await updateRowByKey('Roster', ['batchId', 'learnerId'], [batchId, learnerId], {
    photoUrl,
    photoDriveFileId: fileId,
  });

  return { photoUrl };
});
