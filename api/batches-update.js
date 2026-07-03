const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/batches-update');

module.exports = toVercelHandler(handler);
