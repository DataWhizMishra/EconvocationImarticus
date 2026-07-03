const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRows, updateRowByKey } = require('./_lib/sheets');
const { parseBatch } = require('./_lib/batches');
const { slugify } = require('./_lib/id');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { id, settings, joinSlug: joinSlugIn, ...rest } = body;
  if (!id) throw new HttpError(400, 'id is required');

  const rows = await getRows('Batches');
  const current = rows.find((r) => r.id === id);
  if (!current) throw new HttpError(404, 'Batch not found');

  const rowPatch = { ...rest, updatedAt: new Date().toISOString() };

  if (joinSlugIn) {
    const joinSlug = slugify(joinSlugIn);
    const clash = rows.find((r) => r.joinSlug === joinSlug && r.id !== id && r.status !== 'archived');
    if (clash) throw new HttpError(409, `A batch already uses the join link /${joinSlug}`);
    rowPatch.joinSlug = joinSlug;
  }

  if (settings) {
    let currentSettings = {};
    try {
      currentSettings = current.settingsJson ? JSON.parse(current.settingsJson) : {};
    } catch (e) {
      currentSettings = {};
    }
    rowPatch.settingsJson = JSON.stringify({ ...currentSettings, ...settings });
  }

  const updated = await updateRowByKey('Batches', 'id', id, rowPatch);
  return parseBatch(updated);
});
