// Single catch-all Vercel function for every /api/<name> endpoint. Vercel's
// Hobby plan caps a deployment at 12 serverless functions, and this project
// has 27 endpoints, so instead of one function per endpoint (as Netlify
// Functions does) they're all dispatched from here - one function, routed by
// the `fn` path segment. Each handler's own logic is untouched in
// netlify/functions/*.js.
const { toVercelHandler } = require('../netlify/functions/_lib/vercel-adapter');

const handlers = {
  'auth-login': require('../netlify/functions/auth-login').handler,
  'batches-list': require('../netlify/functions/batches-list').handler,
  'batches-get': require('../netlify/functions/batches-get').handler,
  'batches-create': require('../netlify/functions/batches-create').handler,
  'batches-update': require('../netlify/functions/batches-update').handler,
  'batches-delete': require('../netlify/functions/batches-delete').handler,
  'roster-bulk-import': require('../netlify/functions/roster-bulk-import').handler,
  'roster-upsert': require('../netlify/functions/roster-upsert').handler,
  'roster-delete': require('../netlify/functions/roster-delete').handler,
  'roster-list': require('../netlify/functions/roster-list').handler,
  'roster-photo-upload': require('../netlify/functions/roster-photo-upload').handler,
  'messages-list': require('../netlify/functions/messages-list').handler,
  'messages-save': require('../netlify/functions/messages-save').handler,
  'special-certs-list': require('../netlify/functions/special-certs-list').handler,
  'special-certs-upsert': require('../netlify/functions/special-certs-upsert').handler,
  'special-certs-delete': require('../netlify/functions/special-certs-delete').handler,
  'awards-list': require('../netlify/functions/awards-list').handler,
  'awards-upsert': require('../netlify/functions/awards-upsert').handler,
  'awards-delete': require('../netlify/functions/awards-delete').handler,
  'questions-list': require('../netlify/functions/questions-list').handler,
  'questions-upsert': require('../netlify/functions/questions-upsert').handler,
  'questions-delete': require('../netlify/functions/questions-delete').handler,
  'live-bootstrap': require('../netlify/functions/live-bootstrap').handler,
  'live-state-get': require('../netlify/functions/live-state-get').handler,
  'live-state-set': require('../netlify/functions/live-state-set').handler,
  'response-submit': require('../netlify/functions/response-submit').handler,
  join: require('../netlify/functions/join').handler,
};

module.exports = async (req, res) => {
  const name = req.query.fn;
  const netlifyHandler = handlers[name];
  if (!netlifyHandler) {
    res.status(404).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: `Unknown endpoint: ${name}` }));
    return;
  }
  return toVercelHandler(netlifyHandler)(req, res);
};
