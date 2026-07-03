const { withHandler, HttpError } = require('./_lib/http');
const { requireLearner } = require('./_lib/auth');
const { getRowsBundle, upsertRowByKey } = require('./_lib/sheets');

exports.handler = withHandler(async ({ event, body }) => {
  const { batchId, questionId, selectedOption } = body;
  if (!batchId || !questionId) throw new HttpError(400, 'batchId and questionId are required');
  if (selectedOption === undefined || selectedOption === null) {
    throw new HttpError(400, 'selectedOption is required');
  }
  const learner = requireLearner(event, batchId);

  const bundle = await getRowsBundle(['LiveState', 'Questions']);
  const stateRows = bundle.LiveState;
  const questionRows = bundle.Questions;
  const state = stateRows.find((r) => r.batchId === batchId);
  if (!state || state.quizPhase !== 'open' || state.currentQuestionId !== questionId) {
    throw new HttpError(409, 'This question is not currently open for answers');
  }

  const question = questionRows.find((r) => r.batchId === batchId && r.questionId === questionId);
  if (!question) throw new HttpError(404, 'Question not found');

  const isCorrect =
    question.kind === 'quiz' && question.correctIndex !== ''
      ? Number(question.correctIndex) === Number(selectedOption)
      : '';

  // upsert on (batchId,questionId,learnerId) - resubmission while still open
  // overwrites the learner's previous answer rather than duplicating a row.
  await upsertRowByKey('Responses', ['batchId', 'questionId', 'learnerId'], {
    batchId,
    questionId,
    learnerId: learner.learnerId,
    learnerName: learner.learnerName,
    selectedOption: String(selectedOption),
    isCorrect: String(isCorrect),
    submittedAt: new Date().toISOString(),
  });

  return { ok: true, selectedOption: Number(selectedOption) };
});
