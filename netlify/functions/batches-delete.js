const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { updateRowByKey } = require('./_lib/sheets');

// Soft delete only - a real row delete would shift other tabs' assumptions
// and destroy history (rosters, responses) for no benefit.
exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const { id } = body;
  if (!id) throw new HttpError(400, 'id is required');
  const updated = await updateRowByKey('Batches', 'id', id, {
    status: 'archived',
    updatedAt: new Date().toISOString(),
  });
  if (!updated) throw new HttpError(404, 'Batch not found');
  return { ok: true };
});
