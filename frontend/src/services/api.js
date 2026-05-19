// src/services/api.js
// ═══════════════════════════════════════════════════════
// Centralized REST API Service Layer
// All backend calls go through this file
// Base URL proxied via package.json → http://localhost:5000
// ═══════════════════════════════════════════════════════

import axios from 'axios';

const BASE = '/api';

// Axios instance with auth header injection
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('medibot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medibot_token');
      localStorage.removeItem('medibot_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
};

// ── CHAT ──────────────────────────────────────────────
export const chatAPI = {
  send:         (message, lang) => api.post('/chat', { message, lang }),
  history:      (limit = 50)   => api.get(`/chat/history?limit=${limit}`),
  clearHistory: ()              => api.delete('/chat/history'),
};

// ── TABLETS ───────────────────────────────────────────
export const tabletsAPI = {
  getAll:  ()              => api.get('/tablets'),
  add:     (name, time)   => api.post('/tablets', { name, time }),
  update:  (id, taken)    => api.patch(`/tablets/${id}`, { taken }),
  remove:  (id)           => api.delete(`/tablets/${id}`),
};

// ── WATER ─────────────────────────────────────────────
export const waterAPI = {
  get:    ()        => api.get('/water'),
  update: (glasses) => api.put('/water', { glasses }),
};

// ── BMI ───────────────────────────────────────────────
export const bmiAPI = {
  calculate: (weight, height, lang) => api.post('/bmi', { weight, height, lang }),
  history:   ()                      => api.get('/bmi/history'),
};

// ── VITALS ────────────────────────────────────────────
export const vitalsAPI = {
  get: ()     => api.get('/vitals'),
  log: (data) => api.post('/vitals', data),
};

// ── IMAGE ─────────────────────────────────────────────
export const imageAPI = {
  analyze: (formData) => api.post('/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ── MISC ──────────────────────────────────────────────
export const miscAPI = {
  tips:       (lang = 'en') => api.get(`/tips?lang=${lang}`),
  diseases:   ()             => api.get('/diseases'),
  disease:    (name, lang)   => api.get(`/diseases/${name}?lang=${lang}`),
  dashboard:  ()             => api.get('/dashboard'),
  healthCheck:()             => api.get('/health'),
};

export default api;
