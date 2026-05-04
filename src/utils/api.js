import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // send httpOnly cookies
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token from localStorage as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('roomie_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('roomie_token');
      localStorage.removeItem('roomie_member');
      localStorage.removeItem('roomie_room');
      // Redirect to join page if not already there
      if (!window.location.pathname.includes('/join')) {
        window.location.href = '/join';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  createRoom: (data) => api.post('/rooms', data),
  getRoom: (id) => api.get(`/rooms/${id}`),
  join: (data) => api.post('/auth/join', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── Members ───────────────────────────────────────────────────────────────
export const membersApi = {
  list: () => api.get('/members'),
  add: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
};

// ── Expenses ──────────────────────────────────────────────────────────────
export const expensesApi = {
  add: (data) => api.post('/expenses', data),
  list: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  markPaid: (splitId) => api.post(`/splits/${splitId}/pay`),
  recordAttempt: (splitId, upiApp, amount) =>
    api.post(`/splits/${splitId}/attempt`, { upiApp, amount }),
  getAttempts: (splitId) => api.get(`/splits/${splitId}/attempts`),
  deleteExpense: (expenseId) => api.delete(`/expenses/${expenseId}`),
  balances: () => api.get('/balances'),
  myPending: () => api.get('/my-pending'),
};

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationsApi = {
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
  saveFcmToken: (token) => api.post('/notifications/fcm-token', { token }),
  getVapidKey: () => api.get('/notifications/vapid-key'),
};
