const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/live-state-get');

module.exports = toVercelHandler(handler);
