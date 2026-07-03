const { callAppsScript } = require('./appsScript');

// base64Data may be a raw base64 string or a data: URL - both are accepted.
// The Drive folder to upload into is configured on the Apps Script side
// (DRIVE_FOLDER_ID script property), not passed from here.
async function uploadPhoto(base64Data, filename, mimeType) {
  return callAppsScript('uploadPhoto', { base64: base64Data, filename, mimeType });
}

async function deletePhoto(fileId) {
  if (!fileId) return;
  try {
    await callAppsScript('deletePhoto', { fileId });
  } catch (e) {
    // already gone or inaccessible - not fatal for the caller's flow
  }
}

module.exports = { uploadPhoto, deletePhoto };
