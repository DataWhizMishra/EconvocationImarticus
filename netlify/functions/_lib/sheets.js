const { callAppsScript } = require('./appsScript');

// short-lived in-memory cache (per warm function container) to absorb bursts
// of concurrent learner polling without hammering the Apps Script quota.
const rowCache = new Map(); // sheetName -> { rows, ts }
const CACHE_MS = 2500;

function invalidateCache(sheetName) {
  rowCache.delete(sheetName);
}

async function getRows(sheetName, { skipCache = false } = {}) {
  const cached = rowCache.get(sheetName);
  if (!skipCache && cached && Date.now() - cached.ts < CACHE_MS) {
    return cached.rows;
  }
  const rows = await callAppsScript('getRows', { sheet: sheetName });
  rowCache.set(sheetName, { rows, ts: Date.now() });
  return rows;
}

async function getRowsByBatchId(sheetName, batchId, opts) {
  const rows = await getRows(sheetName, opts);
  return rows.filter((r) => r.batchId === batchId);
}

// Reads several sheet tabs in as few Apps Script round trips as possible -
// each call has real overhead (script execution + a redirect hop), so
// bundling reads that a page needs together matters a lot more here than it
// would calling the Sheets API directly. Cached tabs are served from memory;
// only the sheets not already warm get sent to Apps Script, in one request.
async function getRowsBundle(sheetNames) {
  const result = {};
  const uncached = [];
  for (const name of sheetNames) {
    const cached = rowCache.get(name);
    if (cached && Date.now() - cached.ts < CACHE_MS) {
      result[name] = cached.rows;
    } else {
      uncached.push(name);
    }
  }
  if (uncached.length) {
    const bundle = await callAppsScript('getBundle', { sheets: uncached });
    uncached.forEach((name) => {
      const rows = bundle[name] || [];
      rowCache.set(name, { rows, ts: Date.now() });
      result[name] = rows;
    });
  }
  return result;
}

async function appendRow(sheetName, obj) {
  const result = await callAppsScript('appendRow', { sheet: sheetName, row: obj });
  invalidateCache(sheetName);
  return result;
}

// Updates the first row matching keyCols/keyVals with `patch` (merged over existing values).
// Returns the merged object, or null if no row matched.
async function updateRowByKey(sheetName, keyColsIn, keyValsIn, patch) {
  const keyCols = Array.isArray(keyColsIn) ? keyColsIn : [keyColsIn];
  const keyVals = Array.isArray(keyValsIn) ? keyValsIn : [keyValsIn];
  const result = await callAppsScript('updateRowByKey', { sheet: sheetName, keyCols, keyVals, patch });
  invalidateCache(sheetName);
  return result;
}

// Updates the row matching keyCols against fields already present in `patch`,
// or appends a new row if none matched. keyCols values are read from `patch`.
async function upsertRowByKey(sheetName, keyColsIn, patch) {
  const keyCols = Array.isArray(keyColsIn) ? keyColsIn : [keyColsIn];
  const result = await callAppsScript('upsertRowByKey', { sheet: sheetName, keyCols, patch });
  invalidateCache(sheetName);
  return result;
}

// Physically removes the first row matching keyCols/keyVals. Returns true if a row was deleted.
async function deleteRowByKey(sheetName, keyColsIn, keyValsIn) {
  const keyCols = Array.isArray(keyColsIn) ? keyColsIn : [keyColsIn];
  const keyVals = Array.isArray(keyValsIn) ? keyValsIn : [keyValsIn];
  const result = await callAppsScript('deleteRowByKey', { sheet: sheetName, keyCols, keyVals });
  invalidateCache(sheetName);
  return result.deleted;
}

module.exports = {
  getRows,
  getRowsByBatchId,
  getRowsBundle,
  appendRow,
  updateRowByKey,
  upsertRowByKey,
  deleteRowByKey,
  invalidateCache,
};
