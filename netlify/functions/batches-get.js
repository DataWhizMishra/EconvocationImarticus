const { withHandler, HttpError } = require('./_lib/http');
const { getRows } = require('./_lib/sheets');
const { parseBatch } = require('./_lib/batches');

// Public endpoint: join.html and live.html both need batch config before a
// learner has any token. Nothing secret lives on this row.
exports.handler = withHandler(async ({ qs }) => {
  const { slug, id } = qs;
  if (!slug && !id) throw new HttpError(400, 'slug or id query param required');
  const rows = await getRows('Batches');
  const row = rows.find((r) => (id && r.id === id) || (slug && r.joinSlug === slug));
  if (!row || row.status === 'archived') throw new HttpError(404, 'Batch not found');
  return parseBatch(row);
});
