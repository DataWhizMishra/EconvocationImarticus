const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/special-certs-delete');

module.exports = toVercelHandler(handler);
