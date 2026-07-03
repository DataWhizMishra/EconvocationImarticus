/* localStorage helpers for the mentor session token and per-batch learner sessions. */
(function () {
  const MENTOR_KEY = 'econvo_mentor_token';
  const learnerKey = (batchId) => `econvo_learner_${batchId}`;

  function getMentorToken() {
    try {
      return localStorage.getItem(MENTOR_KEY) || '';
    } catch (e) {
      return '';
    }
  }
  function setMentorToken(token) {
    try {
      localStorage.setItem(MENTOR_KEY, token);
    } catch (e) {
      /* private browsing / storage disabled - mentor will just be asked to log in again */
    }
  }
  function clearMentorToken() {
    try {
      localStorage.removeItem(MENTOR_KEY);
    } catch (e) {}
  }

  function getLearnerSession(batchId) {
    try {
      const raw = localStorage.getItem(learnerKey(batchId));
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session.expiresAt && Date.now() > session.expiresAt) return null;
      return session;
    } catch (e) {
      return null;
    }
  }
  function setLearnerSession(batchId, session) {
    try {
      localStorage.setItem(learnerKey(batchId), JSON.stringify(session));
    } catch (e) {}
  }
  function clearLearnerSession(batchId) {
    try {
      localStorage.removeItem(learnerKey(batchId));
    } catch (e) {}
  }

  // Redirects to admin login (preserving where to return to) if no mentor token is stored.
  // Does NOT validate the token against the server - functions still enforce auth server-side.
  function requireMentorOrRedirect() {
    const token = getMentorToken();
    if (!token) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/admin/login.html?next=${next}`;
      return null;
    }
    return token;
  }

  window.AuthClient = {
    getMentorToken,
    setMentorToken,
    clearMentorToken,
    getLearnerSession,
    setLearnerSession,
    clearLearnerSession,
    requireMentorOrRedirect,
  };
})();
