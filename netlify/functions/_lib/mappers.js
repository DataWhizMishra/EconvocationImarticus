// Shared row -> DTO mapping, used by both the individual *-list.js endpoints
// and live-bootstrap.js (which bundles several of these into one call).

function mapRoster(rows) {
  return rows
    .map((r) => ({
      learnerId: r.learnerId,
      name: r.name,
      colorHex: r.colorHex,
      photoUrl: r.photoUrl || '',
      dreamJobTitle: r.dreamJobTitle || '',
      dreamJobEmoji: r.dreamJobEmoji || '',
      sortOrder: Number(r.sortOrder) || 0,
      joined: r.joined === 'true' || r.joined === true,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapMessages(rows) {
  return rows
    .map((r) => ({
      learnerId: r.learnerId,
      learnerName: r.learnerName,
      messageText: r.messageText,
      sortOrder: Number(r.sortOrder) || 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapCerts(rows) {
  return rows
    .map((r) => ({
      certId: r.certId,
      type: r.type || 'custom',
      icon: r.icon || '🏅',
      label: r.label,
      awardTitle: r.awardTitle,
      winners: (r.winnerNames || '').split('|').map((s) => s.trim()).filter(Boolean),
      description: r.description,
      sortOrder: Number(r.sortOrder) || 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapAwards(rows) {
  return rows
    .map((r) => ({
      awardId: r.awardId,
      category: r.category,
      winnerName: r.winnerName,
      winnerRole: r.winnerRole,
      sortOrder: Number(r.sortOrder) || 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Deliberately strips correctIndex/explanation - see questions-list.js.
function mapQuestions(rows) {
  return rows
    .map((r) => ({
      questionId: r.questionId,
      kind: r.kind,
      sortOrder: Number(r.sortOrder) || 0,
      text: r.text,
      options: [r.optionA, r.optionB, r.optionC, r.optionD].map((o) => o || ''),
      timerSeconds: Number(r.timerSeconds) || 30,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

module.exports = { mapRoster, mapMessages, mapCerts, mapAwards, mapQuestions };
