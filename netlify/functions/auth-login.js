const { withHandler, HttpError } = require('./_lib/http');
const { signToken } = require('./_lib/auth');

const TOKEN_TTL_SECONDS = 12 * 3600; // 12 hours - long enough to run a live ceremony

exports.handler = withHandler(async ({ body }) => {
  const { password } = body;
  if (!password || password !== process.env.MENTOR_PASSWORD) {
    throw new HttpError(401, 'Incorrect password');
  }
  const token = signToken({ role: 'mentor' }, process.env.SESSION_SECRET, TOKEN_TTL_SECONDS);
  return { token, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 };
});
