/**
 * E-Convocation backend — deploy this bound to the spreadsheet that has the
 * 8 tabs described in the project README (Batches, Roster, Messages,
 * SpecialCerts, Awards, Questions, Responses, LiveState).
 *
 * Setup:
 * 1. Open the spreadsheet -> Extensions -> Apps Script.
 * 2. Delete the default code and paste this whole file in.
 * 3. Project Settings (gear icon) -> Script Properties -> add:
 *      API_SECRET       = any long random string you make up
 *      DRIVE_FOLDER_ID   = (optional) a Drive folder ID for learner photos
 * 4. Deploy -> New deployment -> type "Web app" -> Execute as "Me" ->
 *    Who has access "Anyone" -> Deploy -> authorize the permissions it asks
 *    for -> copy the Web app URL (ends in /exec).
 * 5. Give the app that URL (APPS_SCRIPT_URL) and the API_SECRET you chose
 *    (APPS_SCRIPT_SECRET) as Netlify environment variables.
 */

function doGet(e) {
  return jsonOut_({ ok: true, result: 'E-Convocation Apps Script backend is running. Use POST.' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'Invalid JSON body' });
  }
  if (!body.secret || body.secret !== getSecret_()) {
    return jsonOut_({ ok: false, error: 'Unauthorized' });
  }
  try {
    var result = dispatch_(body);
    return jsonOut_({ ok: true, result: result });
  } catch (err) {
    return jsonOut_({ ok: false, error: String((err && err.message) || err) });
  }
}

function dispatch_(body) {
  switch (body.op) {
    case 'getRows':
      return getRows_(body.sheet);
    case 'getBundle':
      return getBundle_(body.sheets);
    case 'appendRow':
      return appendRow_(body.sheet, body.row);
    case 'updateRowByKey':
      return updateRowByKey_(body.sheet, body.keyCols, body.keyVals, body.patch);
    case 'upsertRowByKey':
      return upsertRowByKey_(body.sheet, body.keyCols, body.patch);
    case 'deleteRowByKey':
      return { deleted: deleteRowByKey_(body.sheet, body.keyCols, body.keyVals) };
    case 'uploadPhoto':
      return uploadPhoto_(body.base64, body.filename, body.mimeType);
    case 'deletePhoto':
      return { ok: deletePhoto_(body.fileId) };
    default:
      throw new Error('Unknown op: ' + body.op);
  }
}

/* ---------- config helpers ---------- */

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty('API_SECRET');
}

function getSpreadsheet_() {
  // Bound scripts (Extensions > Apps Script from inside the sheet) can just
  // use the active spreadsheet - no need to configure an ID.
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getDriveFolder_() {
  var id = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!id) return null;
  try {
    return DriveApp.getFolderById(id);
  } catch (err) {
    return null;
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Unknown sheet tab: ' + name);
  return sheet;
}

/* ---------- generic row operations (mirror netlify/functions/_lib/sheets.js) ---------- */

function readAll_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return { headers: [], rows: [] };
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = { _rowNumber: i + 1 };
    for (var c = 0; c < headers.length; c++) {
      var v = values[i][c];
      obj[headers[c]] = v === undefined || v === null ? '' : String(v);
    }
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function getRows_(sheetName) {
  return readAll_(getSheet_(sheetName)).rows;
}

// Reads several tabs within a single script execution - much cheaper than
// one execution per tab, since each Web App invocation has its own overhead.
function getBundle_(sheetNames) {
  var result = {};
  for (var i = 0; i < sheetNames.length; i++) {
    result[sheetNames[i]] = getRows_(sheetNames[i]);
  }
  return result;
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function appendRow_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  var row = headers.map(function (h) {
    return obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : '';
  });
  sheet.appendRow(row);
  return obj;
}

function findRow_(sheet, keyCols, keyVals) {
  var data = readAll_(sheet);
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    var match = true;
    for (var k = 0; k < keyCols.length; k++) {
      if ((r[keyCols[k]] || '') !== String(keyVals[k])) {
        match = false;
        break;
      }
    }
    if (match) return r;
  }
  return null;
}

function updateRowByKey_(sheetName, keyCols, keyVals, patch) {
  var sheet = getSheet_(sheetName);
  var found = findRow_(sheet, keyCols, keyVals);
  if (!found) return null;
  var headers = getHeaders_(sheet);
  var merged = Object.assign({}, found, patch);
  var rowValues = headers.map(function (h) {
    return merged[h] !== undefined && merged[h] !== null ? String(merged[h]) : '';
  });
  sheet.getRange(found._rowNumber, 1, 1, headers.length).setValues([rowValues]);
  return merged;
}

function upsertRowByKey_(sheetName, keyCols, patch) {
  var keyVals = keyCols.map(function (c) {
    return patch[c];
  });
  var updated = updateRowByKey_(sheetName, keyCols, keyVals, patch);
  if (updated) return updated;
  return appendRow_(sheetName, patch);
}

function deleteRowByKey_(sheetName, keyCols, keyVals) {
  var sheet = getSheet_(sheetName);
  var found = findRow_(sheet, keyCols, keyVals);
  if (!found) return false;
  sheet.deleteRow(found._rowNumber);
  return true;
}

/* ---------- Drive photo storage ---------- */

function uploadPhoto_(base64, filename, mimeType) {
  var clean = base64.indexOf(',') >= 0 ? base64.split(',')[1] : base64;
  var bytes = Utilities.base64Decode(clean);
  var blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', filename || 'photo.jpg');
  var folder = getDriveFolder_();
  var file = folder ? folder.createFile(blob) : DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileId = file.getId();
  return { fileId: fileId, photoUrl: 'https://lh3.googleusercontent.com/d/' + fileId + '=s400' };
}

function deletePhoto_(fileId) {
  if (!fileId) return true;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return true;
  } catch (err) {
    return false;
  }
}
