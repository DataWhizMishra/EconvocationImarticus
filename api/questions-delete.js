const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/questions-delete');

module.exports = toVercelHandler(handler);
