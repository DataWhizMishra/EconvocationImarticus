const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/messages-save');

module.exports = toVercelHandler(handler);
