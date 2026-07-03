const { withHandler, HttpError } = require('./_lib/http');
const { getRowsBundle } = require('./_lib/sheets');

const LETTERS = ['A', 'B', 'C', 'D'];

// The single polling endpoint both mentor and learner clients hit every few
// seconds. Merges slide/quiz position with a live tally so only one Apps
// Script round trip is needed here, no matter which fields are needed.
exports.handler = withHandler(async ({ qs }) => {
  const { batchId } = qs;
  if (!batchId) throw new HttpError(400, 'batchId query param required');

  const bundle = await getRowsBundle(['LiveState', 'Responses', 'Questions']);
  const state = bundle.LiveState.find((r) => r.batchId === batchId);
  if (!state) throw new HttpError(404, 'Batch has no live state yet');

  const result = {
    batchId,
    currentSlideIndex: Number(state.currentSlideIndex) || 0,
    currentSlideId: state.currentSlideId || 's1',
    quizPhase: state.quizPhase || 'idle',
    currentQuestionId: state.currentQuestionId || '',
    questionIndex: Number(state.questionIndex) || 0,
    certCycleIndex: Number(state.certCycleIndex) || 0,
    awardCycleIndex: Number(state.awardCycleIndex) || 0,
    updatedAt: state.updatedAt,
  };

  if ((result.quizPhase === 'open' || result.quizPhase === 'revealed') && result.currentQuestionId) {
    const qResponses = bundle.Responses.filter(
      (r) => r.batchId === batchId && r.questionId === result.currentQuestionId,
    );
    const tally = { A: 0, B: 0, C: 0, D: 0, total: 0 };
    qResponses.forEach((r) => {
      const letter = LETTERS[Number(r.selectedOption)];
      if (letter) {
        tally[letter]++;
        tally.total++;
      }
    });
    result.tally = tally;

    if (result.quizPhase === 'revealed') {
      const q = bundle.Questions.find((r) => r.batchId === batchId && r.questionId === result.currentQuestionId);
      if (q) {
        result.correctIndex = q.correctIndex !== '' ? Number(q.correctIndex) : null;
        result.explanation = q.explanation || '';
        result.correctCount = qResponses.filter((r) => r.isCorrect === 'true').length;
      }
    }
  }

  return result;
});
