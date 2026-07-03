const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');
const { handler } = require('../netlify/functions/roster-bulk-import');

module.exports = toVercelHandler(handler);
