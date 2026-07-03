const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/special-certs-upsert');

module.exports = toVercelHandler(handler);
