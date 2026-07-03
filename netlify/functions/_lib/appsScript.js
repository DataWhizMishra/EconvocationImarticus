// Thin client for the Google Apps Script Web App that acts as our database
// backend (see /apps-script/Code.gs). Netlify Functions never talk to the
// Google Sheets/Drive REST APIs directly - everything goes through this.

function scriptUrl() {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error('Missing APPS_SCRIPT_URL env var');
  return url;
}

function scriptSecret() {
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!secret) throw new Error('Missing APPS_SCRIPT_SECRET env var');
  return secret;
}

async function callAppsScript(op, payload) {
  const res = await fetch(scriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: scriptSecret(), op, ...payload }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(
      'Apps Script returned a non-JSON response - confirm the deployment is a Web App with access set to ' +
        '"Anyone" and APPS_SCRIPT_URL is the /exec URL. Raw response: ' +
        text.slice(0, 200),
    );
  }
  if (!data.ok) {
    throw new Error(data.error || 'Apps Script call failed');
  }
  return data.result;
}

module.exports = { callAppsScript };
