const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/awards-upsert');

module.exports = toVercelHandler(handler);
