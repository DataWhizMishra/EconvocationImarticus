// Batches rows store most fields as flat columns but bundle free-form/rarely
// -queried config into a single settingsJson cell (see plan for shape).
function parseBatch(row) {
  if (!row) return null;
  let settings = {};
  try {
    settings = row.settingsJson ? JSON.parse(row.settingsJson) : {};
  } catch (e) {
    settings = {};
  }
  return {
    id: row.id,
    name: row.name,
    programName: row.programName || '',
    cohortLabel: row.cohortLabel || row.name,
    joinSlug: row.joinSlug,
    status: row.status || 'draft',
    eventDateISO: row.eventDateISO || '',
    eventDateLabel: row.eventDateLabel || '',
    musicDefaultUrl: row.musicDefaultUrl || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    settings,
  };
}

function toRow(batch) {
  const { settings, ...rest } = batch;
  return { ...rest, settingsJson: JSON.stringify(settings || {}) };
}

module.exports = { parseBatch, toRow };
