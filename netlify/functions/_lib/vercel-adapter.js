// Wraps a Netlify-style handler (event) => { statusCode, headers, body } so it
// can run as a Vercel Node.js serverless function (req, res). Vercel's Node
// runtime already parses req.body/req.query for us, so this only needs to
// reshape those into the `event` object the existing handlers expect, then
// replay the returned { statusCode, headers, body } onto `res`.
function toVercelHandler(netlifyHandler) {
  return async (req, res) => {
    const body =
      req.body === undefined || req.body === null || req.body === ''
        ? null
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters: req.query || {},
      body,
    };

    const result = await netlifyHandler(event, {});
    res.status(result.statusCode || 200);
    for (const [key, value] of Object.entries(result.headers || {})) {
      res.setHeader(key, value);
    }
    res.send(result.body || '');
  };
}

module.exports = { toVercelHandler };
