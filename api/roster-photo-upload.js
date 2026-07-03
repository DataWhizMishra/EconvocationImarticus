const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/roster-photo-upload');

module.exports = toVercelHandler(handler);
