// API client — Connects frontend to backend (FastAPI)
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
    // 401 from auth-required routes (not /auth/* itself) usually = expired JWT.
    // Clear the dead token so the next page load lands on login instead of looping.
    if (res.status === 401 && !path.startsWith('/auth/') && detail !== 'invalid_gemini_key') {
      TokenStore.clear();
      localStorage.removeItem('jobify_user_id');
    }
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

// --- Resume shape adapters --------------------------------------------------
// UI keeps a friendlier shape (role/period/bullets, skills as strings) than
// the backend's strict Pydantic model (title/start_date/end_date/highlights,
// skills as [{name, level}]). Convert at the boundary in both directions so
// neither side has to think about the other.

function _splitPeriod(period) {
  if (!period) return ['', ''];
  const parts = String(period).split(/\s*[-–—]\s*/);
  return [parts[0] || '', parts[1] || ''];
}

function _toBackendResume(ui) {
  if (!ui || typeof ui !== 'object') return ui;
  const out = {
    name: ui.name || '',
    email: ui.email || null,
    phone: ui.phone || null,
    summary: ui.summary || null,
    education: (ui.education || []).map(e => {
      const [start, end] = _splitPeriod(e.period);
      return {
        institution: e.school || e.institution || null,
        degree: e.degree || null,
        field_of_study: e.field_of_study || null,
        start_date: e.start_date || start || null,
        end_date: e.end_date || end || null,
        gpa: e.gpa || null,
      };
    }),
    experience: (ui.experience || []).map(x => {
      const [start, end] = _splitPeriod(x.period);
      return {
        company: x.company || null,
        title: x.role || x.title || null,
        location: x.location || null,
        start_date: x.start_date || start || null,
        end_date: x.end_date || end || null,
        highlights: Array.isArray(x.bullets) ? x.bullets.filter(Boolean)
                  : Array.isArray(x.highlights) ? x.highlights.filter(Boolean)
                  : [],
      };
    }),
    projects: (ui.projects || []).map(p => {
      const [s, en] = _splitPeriod(p.period);
      return {
        name: p.name || null,
        description: p.description || null,
        url: p.url || null,
        start_date: p.start_date || s || null,
        end_date: p.end_date || en || null,
        technologies: Array.isArray(p.technologies) ? p.technologies.filter(Boolean) : [],
        highlights: Array.isArray(p.highlights) ? p.highlights.filter(Boolean) : [],
      };
    }),
    skills: (ui.skills || []).map(s =>
      typeof s === 'string' ? { name: s, level: null } : { name: s.name, level: s.level || null }
    ).filter(s => s.name),
  };
  // Drop empty email so EmailStr validation doesn't choke on "".
  if (out.email === '' || out.email == null) delete out.email;
  return out;
}

function _fromBackendResume(be) {
  if (!be || typeof be !== 'object') return be;
  return {
    name: be.name || '',
    email: be.email || '',
    phone: be.phone || '',
    summary: be.summary || '',
    title: be.title || '',
    location: be.location || '',
    website: be.website || '',
    experience: (be.experience || []).map((x, i) => ({
      id: i + 1,
      role: x.title || '',
      company: x.company || '',
      period: [x.start_date, x.end_date].filter(Boolean).join(' — ') || '',
      bullets: Array.isArray(x.highlights) ? x.highlights : [],
    })),
    education: (be.education || []).map((e, i) => ({
      id: i + 1,
      school: e.institution || '',
      degree: e.degree || '',
      period: [e.start_date, e.end_date].filter(Boolean).join(' — ') || '',
    })),
    projects: (be.projects || []).map((p, i) => ({
      id: i + 1,
      name: p.name || '',
      description: p.description || '',
      url: p.url || '',
      period: [p.start_date, p.end_date].filter(Boolean).join(' — ') || '',
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      highlights: Array.isArray(p.highlights) ? p.highlights : [],
    })),
    skills: (be.skills || []).map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean),
  };
}

export const UsersAPI = {
  getMe() { return api('/users/me'); },
  /** GET /users/resume — returns saved resume in UI shape, or null. */
  async getResume() {
    const r = await api('/users/resume');
    return r ? _fromBackendResume(r) : null;
  },
  /** PUT /users/resume — accepts UI shape, transforms to backend shape. */
  saveResume(uiResume) {
    return api('/users/resume', { method: 'PUT', body: JSON.stringify(_toBackendResume(uiResume)) });
  },
};

export const JobsAPI = {
  search(params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    return api(`/jobs/search?${qs.toString()}`);
  },
  /** Personalised feed ranked by cosine similarity to the user's resume embedding.
   *  Returns { personalised: bool, results: [{ ..., match_pct?: int }] } */
  matchFeed(params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    return api(`/jobs/match-feed?${qs.toString()}`);
  },
  getById(id) { return api(`/jobs/${id}`); },
  fetchExternal(query, location, count = 20) {
    return api('/jobs/fetch', { method: 'POST', body: JSON.stringify({ query, location, results_per_page: count }) });
  },
  stats() { return api('/jobs/stats/summary'); },
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
  /** Add a manually-typed project (no URL fetch). */
  addManual(project) { return api('/projects/manual', { method: 'POST', body: JSON.stringify(project) }); },
  list() { return api('/projects'); },
  remove(id) { return api(`/projects/${id}`, { method: 'DELETE' }); },
};

export const AIAPI = {
  /** POST /ai/rewrite — kind: 'summary' | 'bullet' | 'project_description' | 'generic' */
  rewrite(text, kind = 'generic', context) {
    return api('/ai/rewrite', { method: 'POST', body: JSON.stringify({ text, kind, context }) });
  },
  /** POST /ai/extract-github — distill a GitHub repo into a project entry */
  extractGithub(url) {
    return api('/ai/extract-github', { method: 'POST', body: JSON.stringify({ url }) });
  },
};

export const HealthAPI = {
  async check() {
    try { const data = await api('/health'); return data && data.status === 'ok'; }
    catch { return false; }
  },
};
