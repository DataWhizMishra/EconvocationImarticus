const { withHandler } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRows } = require('./_lib/sheets');
const { parseBatch } = require('./_lib/batches');

exports.handler = withHandler(async ({ event }) => {
  requireMentor(event);
  const rows = await getRows('Batches');
  return rows
    .filter((r) => r.status !== 'archived')
    .map(parseBatch)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
});
