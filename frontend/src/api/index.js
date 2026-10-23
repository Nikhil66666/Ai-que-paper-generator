import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  verifyOTP: (data) => API.post('/api/auth/verify-otp', data),
  resendOTP: (data) => API.post('/api/auth/resend-otp', data),
  login: (data) => API.post('/api/auth/login', data),
  forgotPassword: (data) => API.post('/api/auth/forgot-password', data),
  resetPassword: (data) => API.post('/api/auth/reset-password', data),
  getMe: () => API.get('/api/auth/me'),
  updateProfile: (data) => API.put('/api/auth/me', data),
};

// ─── Subjects ─────────────────────────────────────────────────────────
export const subjectAPI = {
  list: () => API.get('/api/subjects'),
  get: (id) => API.get(`/api/subjects/${id}`),
  create: (data) => API.post('/api/subjects', data),
  update: (id, data) => API.put(`/api/subjects/${id}`, data),
  delete: (id) => API.delete(`/api/subjects/${id}`),
  // COs
  listCOs: (subjectId) => API.get(`/api/subjects/${subjectId}/cos`),
  createCO: (subjectId, data) => API.post(`/api/subjects/${subjectId}/cos`, data),
  updateCO: (subjectId, coId, data) => API.put(`/api/subjects/${subjectId}/cos/${coId}`, data),
  deleteCO: (subjectId, coId) => API.delete(`/api/subjects/${subjectId}/cos/${coId}`),
};

// ─── Questions ────────────────────────────────────────────────────────
export const questionAPI = {
  list: (params) => API.get('/api/questions', { params }),
  get: (id) => API.get(`/api/questions/${id}`),
  create: (data) => API.post('/api/questions', data),
  update: (id, data) => API.put(`/api/questions/${id}`, data),
  delete: (id) => API.delete(`/api/questions/${id}`),
  bulkImport: (questions) => API.post('/api/questions/bulk-import', questions),
  aiGenerate: (data) => API.post('/api/questions/ai-generate', data),
};

// ─── Papers ───────────────────────────────────────────────────────────
export const paperAPI = {
  list: () => API.get('/api/papers'),
  get: (id) => API.get(`/api/papers/${id}`),
  generate: (data) => API.post('/api/papers/generate', data),
  manualCreate: (data) => API.post('/api/papers/manual-create', data),
  addQuestions: (paperId, data) => API.post(`/api/papers/${paperId}/add-questions`, data),
  updateQuestion: (paperId, questionId, data) => API.put(`/api/papers/${paperId}/questions/${questionId}`, data),
  deleteQuestion: (paperId, questionId) => API.delete(`/api/papers/${paperId}/questions/${questionId}`),
  addSingleQuestion: (paperId, data) => API.post(`/api/papers/${paperId}/questions`, data),
  delete: (id) => API.delete(`/api/papers/${id}`),
  getPDFUrl: (id) => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${base}/api/papers/${id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  downloadPDF: async (id, title = 'question_paper') => {
    const res = await API.get(`/api/papers/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// ─── Analysis ─────────────────────────────────────────────────────────
export const analysisAPI = {
  bloomCoverage: (subjectId) => API.get('/api/analysis/bloom-coverage', { params: { subject_id: subjectId } }),
  coCoverage: (subjectId) => API.get('/api/analysis/co-coverage', { params: { subject_id: subjectId } }),
  difficultyTrend: (subjectId) => API.get('/api/analysis/difficulty-trend', { params: { subject_id: subjectId } }),
  repeatQuestions: (subjectId) => API.get('/api/analysis/repeat-questions', { params: { subject_id: subjectId } }),
  summary: () => API.get('/api/analysis/summary'),
};

export default API;
