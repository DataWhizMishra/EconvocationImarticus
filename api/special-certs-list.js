const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/special-certs-list');

module.exports = toVercelHandler(handler);
