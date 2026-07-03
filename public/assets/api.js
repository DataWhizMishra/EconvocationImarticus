/* Shared fetch wrapper for every frontend page. Talks to /api/* which
   netlify.toml redirects to /.netlify/functions/*. */
(function () {
  const API_BASE = '/api';

  async function apiRequest(path, { method = 'GET', body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      /* empty body is fine */
    }
    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      const error = new Error(message);
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  function apiGet(path, params, token) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`${path}${qs}`, { method: 'GET', token });
  }

  function apiPost(path, body, token) {
    return apiRequest(path, { method: 'POST', body, token });
  }

  window.Api = { apiGet, apiPost };
})();
