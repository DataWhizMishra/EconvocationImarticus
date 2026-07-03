const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function ok(body, statusCode = 200) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body === undefined ? {} : body),
  };
}

function err(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify({ error: message }),
  };
}

// Wraps a Netlify Function handler: parses JSON body + query string, catches
// HttpError/other errors and turns them into JSON responses, adds CORS.
function withHandler(fn) {
  return async (event) => {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }
    try {
      let body = {};
      if (event.body) {
        try {
          body = JSON.parse(event.body);
        } catch (e) {
          throw new HttpError(400, 'Invalid JSON body');
        }
      }
      const qs = event.queryStringParameters || {};
      const result = await fn({ event, body, qs });
      return ok(result);
    } catch (e) {
      if (e instanceof HttpError) return err(e.statusCode, e.message);
      console.error(e);
      return err(500, e.message || 'Internal error');
    }
  };
}

module.exports = { ok, err, withHandler, HttpError, CORS_HEADERS };
