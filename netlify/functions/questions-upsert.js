const { withHandler, HttpError } = require('./_lib/http');
const { requireMentor } = require('./_lib/auth');
const { getRowsByBatchId, appendRow, upsertRowByKey } = require('./_lib/sheets');
const { newId } = require('./_lib/id');

exports.handler = withHandler(async ({ event, body }) => {
  requireMentor(event);
  const {
    batchId, questionId, kind, text,
    optionA, optionB, optionC, optionD,
    correctIndex, explanation, timerSeconds, sortOrder,
  } = body;
  if (!batchId) throw new HttpError(400, 'batchId is required');
  if (!text) throw new HttpError(400, 'text is required');
  if (kind !== 'quiz' && kind !== 'poll') throw new HttpError(400, "kind must be 'quiz' or 'poll'");

  const patch = {
    batchId,
    kind,
    text,
    optionA: optionA || '',
    optionB: optionB || '',
    optionC: optionC || '',
    optionD: optionD || '',
    correctIndex: kind === 'quiz' && correctIndex !== undefined && correctIndex !== null ? String(correctIndex) : '',
    explanation: explanation || '',
    timerSeconds: String(timerSeconds || 30),
  };
  if (sortOrder !== undefined) patch.sortOrder = String(sortOrder);

  if (questionId) {
    patch.questionId = questionId;
    const updated = await upsertRowByKey('Questions', ['batchId', 'questionId'], patch);
    return updated;
  }

  const existing = await getRowsByBatchId('Questions', batchId);
  const row = { ...patch, questionId: newId('q'), sortOrder: String(sortOrder !== undefined ? sortOrder : existing.length) };
  await appendRow('Questions', row);
  return row;
});
