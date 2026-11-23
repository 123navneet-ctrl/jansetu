/**
 * JanSetu REST API Client
 * Connects React frontend to Spring Boot + JDBC Backend (com.jansetu)
 * Gracefully falls back to local data if backend is offline.
 */

const API_BASE = 'http://localhost:8080/api';
const TIMEOUT_MS = 3500;

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = errBody.message || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(message);
      error.status = res.status;
      error.data = errBody;
      throw error;
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const ApiClient = {
  // --- SCHEMES ---
  async getSchemes() {
    return request(`${API_BASE}/schemes`);
  },

  async getSchemeById(id) {
    return request(`${API_BASE}/schemes/${id}`);
  },

  async getCategories() {
    return request(`${API_BASE}/schemes/categories`);
  },

  async getSchemesGroupedByState() {
    return request(`${API_BASE}/schemes/grouped-by-state`);
  },

  async getRecentlyViewed() {
    return request(`${API_BASE}/schemes/recently-viewed`);
  },

  // --- USERS & PROFILE ---
  async login(email, password) {
    return request(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  async getUser(id = 1) {
    return request(`${API_BASE}/users/${id}`);
  },

  async createUser(userData) {
    return request(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id, userData) {
    return request(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  },

  // --- SAVED SCHEMES ---
  async getSavedSchemes(userId = 1) {
    return request(`${API_BASE}/users/${userId}/saved`);
  },

  async saveScheme(userId = 1, schemeId) {
    return request(`${API_BASE}/users/${userId}/saved/${schemeId}`, {
      method: 'POST',
    });
  },

  async removeSavedScheme(userId = 1, schemeId) {
    return request(`${API_BASE}/users/${userId}/saved/${schemeId}`, {
      method: 'DELETE',
    });
  },

  // --- STREAMS RECOMMENDATIONS ---
  async getRecommendations(userId = 1, page = 0, size = 10, sort = 'name') {
    return request(`${API_BASE}/users/${userId}/recommendations?page=${page}&size=${size}&sort=${sort}`);
  },

  // --- PRODUCER-CONSUMER SCHEME VERIFICATIONS (Admin Pipeline) ---
  async submitVerification(schemeId, priority = 1, notes = '') {
    return request(`${API_BASE}/verifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeId, priority, notes }),
    });
  },

  async getVerifications() {
    return request(`${API_BASE}/verifications`);
  },

  async getVerificationById(id) {
    return request(`${API_BASE}/verifications/${id}`);
  },

  // Backwards-compatible aliases
  async submitReview(userId = 1, schemeId, priority = 1, notes = '') {
    return this.submitVerification(schemeId, priority, notes);
  },

  async getUserReviews(userId = 1) {
    return this.getVerifications();
  },

  // --- ADMIN CSV MULTITHREADED IMPORT & EXPORT ---
  async startCsvImport(file = null) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const controller = new AbortController();
      const res = await fetch(`${API_BASE}/admin/schemes/import-async`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      return await res.json();
    } else {
      return request(`${API_BASE}/admin/schemes/import-async`, {
        method: 'POST',
      });
    }
  },

  async getJobStatus(jobId) {
    return request(`${API_BASE}/admin/jobs/${jobId}`);
  },

  async cancelJob(jobId) {
    return request(`${API_BASE}/admin/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  },

  getExportUrl() {
    return `${API_BASE}/admin/schemes/export`;
  },
};

