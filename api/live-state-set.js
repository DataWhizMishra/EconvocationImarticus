const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/live-state-set');

module.exports = toVercelHandler(handler);
