const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/batches-create');

module.exports = toVercelHandler(handler);
