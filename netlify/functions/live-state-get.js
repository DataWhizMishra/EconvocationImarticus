const { withHandler, HttpError } = require('./_lib/http');
const { getRowsBundle } = require('./_lib/sheets');
const { getLiveState } = require('./_lib/firebase');

const LETTERS = ['A', 'B', 'C', 'D'];

// Slide/quiz position now reaches clients via a direct Firebase listener
// (see public/live.html) - this endpoint is only still needed for the quiz
// tally, which requires aggregating the Responses sheet. Position fields are
// still read here (from Firebase, not Sheets) and returned for the mentor's
// tally-poll call, which reuses the same response shape.
exports.handler = withHandler(async ({ qs }) => {
  const { batchId } = qs;
  if (!batchId) throw new HttpError(400, 'batchId query param required');

  const state = await getLiveState(batchId);
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
    musicStartedAt: state.musicStartedAt ? Number(state.musicStartedAt) : null,
    updatedAt: state.updatedAt,
  };

  if ((result.quizPhase === 'open' || result.quizPhase === 'revealed') && result.currentQuestionId) {
    const bundle = await getRowsBundle(['Responses', 'Questions']);
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
