const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/questions-list');

module.exports = toVercelHandler(handler);
