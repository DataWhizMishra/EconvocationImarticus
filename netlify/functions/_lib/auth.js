const crypto = require('crypto');
const { HttpError } = require('./http');

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input) {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}

function sign(payloadB64, secret) {
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Minimal stateless signed token: base64url(payload) + "." + hmac-sha256 signature.
// No external JWT dependency needed for this scale.
function signToken(payload, secret, ttlSeconds) {
  const body = { ...payload, iat: Date.now(), exp: Date.now() + ttlSeconds * 1000 };
  const payloadB64 = b64url(JSON.stringify(body));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sig] = token.split('.');
  const expected = sign(payloadB64, secret);
  const sigBuf = Buffer.from(sig || '');
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  let payload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64));
  } catch (e) {
    return null;
  }
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

function getBearerToken(event) {
  const headers = event.headers || {};
  const h = headers.authorization || headers.Authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  return m ? m[1] : null;
}

function requireMentor(event) {
  const secret = process.env.SESSION_SECRET;
  const payload = verifyToken(getBearerToken(event), secret);
  if (!payload || payload.role !== 'mentor') {
    throw new HttpError(401, 'Mentor authentication required');
  }
  return payload;
}

// batchId is optional - pass it to also enforce the token was issued for that batch.
function requireLearner(event, batchId) {
  const secret = process.env.SESSION_SECRET;
  const payload = verifyToken(getBearerToken(event), secret);
  if (!payload || payload.role !== 'learner') {
    throw new HttpError(401, 'Learner authentication required');
  }
  if (batchId && payload.batchId !== batchId) {
    throw new HttpError(403, 'Token not valid for this batch');
  }
  return payload;
}

module.exports = { signToken, verifyToken, requireMentor, requireLearner, getBearerToken };
