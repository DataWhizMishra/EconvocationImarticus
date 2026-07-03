const { withHandler, HttpError } = require('./_lib/http');
const { getRowsBundle } = require('./_lib/sheets');
const { parseBatch } = require('./_lib/batches');
const { mapRoster, mapMessages, mapCerts, mapAwards, mapQuestions } = require('./_lib/mappers');

// Public. Combines everything join.html/live.html need on load into a single
// Apps Script round trip instead of 2-6 separate ones - each call to Apps
// Script has real overhead (script execution + a redirect hop), so this is
// the difference between a ~1-5s load and a much slower one.
exports.handler = withHandler(async ({ qs }) => {
  const { slug } = qs;
  if (!slug) throw new HttpError(400, 'slug query param required');

  const bundle = await getRowsBundle(['Batches', 'Roster', 'Messages', 'SpecialCerts', 'Awards', 'Questions']);
  const batchRow = bundle.Batches.find((r) => r.joinSlug === slug);
  if (!batchRow || batchRow.status === 'archived') throw new HttpError(404, 'Batch not found');
  const batch = parseBatch(batchRow);

  const byBatch = (rows) => rows.filter((r) => r.batchId === batch.id);

  return {
    batch,
    roster: mapRoster(byBatch(bundle.Roster)),
    messages: mapMessages(byBatch(bundle.Messages)),
    certs: mapCerts(byBatch(bundle.SpecialCerts)),
    awards: mapAwards(byBatch(bundle.Awards)),
    questions: mapQuestions(byBatch(bundle.Questions)),
  };
});
