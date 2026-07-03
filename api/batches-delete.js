const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/batches-delete');

module.exports = toVercelHandler(handler);
