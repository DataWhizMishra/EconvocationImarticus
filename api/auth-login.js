const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/auth-login');

module.exports = toVercelHandler(handler);
