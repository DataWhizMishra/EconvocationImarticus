const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/messages-list');

module.exports = toVercelHandler(handler);
