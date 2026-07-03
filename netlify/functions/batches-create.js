const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRows, appendRow, upsertRowByKey } = require('./_lib/sheets');
const { newId, slugify } = require('./_lib/id');
const { toRow } = require('./_lib/batches');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { name, programName, cohortLabel, eventDateISO, eventDateLabel, joinSlug: joinSlugIn, settings } = body;
  if (!name || !String(name).trim()) throw new HttpError(400, 'name is required');

  const joinSlug = slugify(joinSlugIn || name);
  if (!joinSlug) throw new HttpError(400, 'Could not derive a join link from that name');

  const existing = await getRows('Batches');
  if (existing.some((r) => r.joinSlug === joinSlug && r.status !== 'archived')) {
    throw new HttpError(409, `A batch already uses the join link /${joinSlug}`);
  }

  const now = new Date().toISOString();
  const batch = {
    id: newId('batch'),
    name,
    programName: programName || '',
    cohortLabel: cohortLabel || name,
    joinSlug,
    status: 'draft',
    eventDateISO: eventDateISO || '',
    eventDateLabel: eventDateLabel || '',
    musicDefaultUrl: '',
    createdAt: now,
    updatedAt: now,
    settings: settings || {},
  };
  await appendRow('Batches', toRow(batch));

  // seed an idle LiveState row so live-state-get never has to special-case "no row yet"
  await upsertRowByKey('LiveState', 'batchId', {
    batchId: batch.id,
    currentSlideIndex: '0',
    currentSlideId: 's1',
    quizPhase: 'idle',
    currentQuestionId: '',
    questionIndex: '0',
    certCycleIndex: '0',
    awardCycleIndex: '0',
    musicStartedAt: '',
    updatedAt: now,
    updatedBy: 'system',
  });

  return batch;
});
