const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/response-submit');

module.exports = toVercelHandler(handler);
