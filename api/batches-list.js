const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/batches-list');

module.exports = toVercelHandler(handler);
