// API client — Connects frontend to jobify_backend (FastAPI)
// In dev, Vite proxies these paths to http://localhost:8000 (see vite.config.js).
// Override at runtime with: window.JOBIFY_API_BASE = 'https://...'

const API_BASE = (typeof window !== 'undefined' && window.JOBIFY_API_BASE) || '';

export const TokenStore = {
  get()           { return localStorage.getItem('jobify_token'); },
  set(t)          { localStorage.setItem('jobify_token', t); },
  clear()         { localStorage.removeItem('jobify_token'); },
  userId()        { return localStorage.getItem('jobify_user_id'); },
  setUserId(id)   { localStorage.setItem('jobify_user_id', id); },
  geminiKey()     { return localStorage.getItem('jobify_gemini_key') || ''; },
  setGeminiKey(k) { if (k) localStorage.setItem('jobify_gemini_key', k); else localStorage.removeItem('jobify_gemini_key'); },
};

async function api(path, opts = {}) {
  const token = TokenStore.get();
  const geminiKey = TokenStore.geminiKey();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (geminiKey) headers['X-Gemini-API-Key'] = geminiKey;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let detail = '';
    try { const j = await res.json(); detail = j.detail || j.error || JSON.stringify(j); } catch {}
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const AuthAPI = {
  async register(email, password) {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
    TokenStore.set(data.access_token);
    if (data.user_id) TokenStore.setUserId(data.user_id);
    return data;
  },
  async login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    TokenStore.set(data.access_token);
    if (data.user_id) TokenStore.setUserId(data.user_id);
    return data;
  },
  async setApiKey(geminiKey) {
    const data = await api('/auth/set-api-key', { method: 'POST', body: JSON.stringify({ gemini_key: geminiKey }) });
    TokenStore.setGeminiKey(geminiKey);
    return data;
  },
  validateKey(geminiKey) {
    return api('/auth/validate-key', { headers: geminiKey ? { 'X-Gemini-API-Key': geminiKey } : {} });
  },
  logout() {
    TokenStore.clear();
    localStorage.removeItem('jobify_user_id');
    TokenStore.setGeminiKey('');
  },
  isLoggedIn() { return !!TokenStore.get(); },
};

export const UsersAPI = {
  getMe() { return api('/users/me'); },
  saveResume(resumeData) { return api('/users/resume', { method: 'PUT', body: JSON.stringify(resumeData) }); },
};

export const JobsAPI = {
  search(params = {}) {
    const qs = new URLSearchParams();
    if (params.q)        qs.set('q', params.q);
    if (params.location) qs.set('location', params.location);
    if (params.limit)    qs.set('limit', params.limit);
    if (params.offset)   qs.set('offset', params.offset);
    return api(`/jobs/search?${qs.toString()}`);
  },
  getById(id) { return api(`/jobs/${id}`); },
  fetchExternal(query, location, count = 20) {
    return api('/jobs/fetch', { method: 'POST', body: JSON.stringify({ query, location, results_per_page: count }) });
  },
};

export const TailorAPI = {
  match(jdText)  { return api('/jd/match',  { method: 'POST', body: JSON.stringify({ jd_text: jdText }) }); },
  tailor(jdText) { return api('/jd/tailor', { method: 'POST', body: JSON.stringify({ jd_text: jdText }) }); },
  history() { return api('/jd/history'); },
};

export const ChatAPI = {
  send(message) { return api('/chat/message', { method: 'POST', body: JSON.stringify({ message }) }); },
};

export const ProjectsAPI = {
  ingest(urls) { return api('/projects/ingest', { method: 'POST', body: JSON.stringify({ urls }) }); },
  list() { return api('/projects'); },
  remove(id) { return api(`/projects/${id}`, { method: 'DELETE' }); },
};

export const HealthAPI = {
  async check() {
    try { const data = await api('/health'); return data && data.status === 'ok'; }
    catch { return false; }
  },
};
