const { withHandler, HttpError } = require('./_lib/http');
const { signToken } = require('./_lib/auth');
const { getRowsBundle, updateRowByKey, appendRow } = require('./_lib/sheets');
const { newId } = require('./_lib/id');
const { colorForIndex } = require('./_lib/palette');
const { parseBatch } = require('./_lib/batches');

const TOKEN_TTL_SECONDS = 6 * 3600; // a live ceremony runs a couple hours at most

exports.handler = withHandler(async ({ body }) => {
  const { batchSlug, learnerId, learnerName } = body;
  if (!batchSlug) throw new HttpError(400, 'batchSlug is required');
  if (!learnerName || !String(learnerName).trim()) throw new HttpError(400, 'learnerName is required');

  const bundle = await getRowsBundle(['Batches', 'Roster']);
  const batchRow = bundle.Batches.find((r) => r.joinSlug === batchSlug);
  if (!batchRow) throw new HttpError(404, 'Convocation not found');
  if (batchRow.status !== 'live') throw new HttpError(403, 'This convocation is not currently open for joining');

  const batch = parseBatch(batchRow);
  const batchRoster = bundle.Roster.filter((r) => r.batchId === batch.id);
  const trimmedName = learnerName.trim();

  let finalLearnerId = learnerId;
  let finalLearnerName = trimmedName;
  const now = new Date().toISOString();

  if (learnerId) {
    const existing = batchRoster.find((r) => r.learnerId === learnerId);
    if (!existing) throw new HttpError(404, 'Learner not found in this batch roster');
    finalLearnerName = existing.name;
    await updateRowByKey('Roster', ['batchId', 'learnerId'], [batch.id, learnerId], {
      joined: 'true',
      joinedAt: now,
    });
  } else {
    const byName = batchRoster.find((r) => r.name.toLowerCase() === trimmedName.toLowerCase());
    if (byName) {
      finalLearnerId = byName.learnerId;
      finalLearnerName = byName.name;
      await updateRowByKey('Roster', ['batchId', 'learnerId'], [batch.id, byName.learnerId], {
        joined: 'true',
        joinedAt: now,
      });
    } else {
      // not on the pre-loaded roster - add them so the mentor can see who showed up
      finalLearnerId = newId('learner');
      await appendRow('Roster', {
        batchId: batch.id,
        learnerId: finalLearnerId,
        name: finalLearnerName,
        colorHex: colorForIndex(batchRoster.length),
        photoUrl: '',
        photoDriveFileId: '',
        dreamJobTitle: '',
        dreamJobEmoji: '',
        sortOrder: String(batchRoster.length),
        joined: 'true',
        joinedAt: now,
      });
    }
  }

  const learnerToken = signToken(
    { role: 'learner', batchId: batch.id, learnerId: finalLearnerId, learnerName: finalLearnerName },
    process.env.SESSION_SECRET,
    TOKEN_TTL_SECONDS,
  );

  return {
    learnerToken,
    batchId: batch.id,
    joinSlug: batch.joinSlug,
    learnerId: finalLearnerId,
    learnerName: finalLearnerName,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };
});
