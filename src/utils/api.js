import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // send httpOnly cookies
  timeout: 30000,        // 30s — handles Render.com cold starts
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
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  // Multi-room
  myRooms: () => api.get('/auth/my-rooms'),
  switchRoom: (roomId) => api.post('/auth/switch-room', { roomId }),
  joinRoom: (data) => api.post('/auth/join-room', data),
};

// ── Members ───────────────────────────────────────────────────────────────
export const membersApi = {
  list: () => api.get('/members'),
  add: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  remove: (id) => api.delete(`/members/${id}/remove`),
  tourComplete: () => api.post('/members/tour-complete'),
};

// ── Expenses ──────────────────────────────────────────────────────────────
export const expensesApi = {
  add: (data) => api.post('/expenses', data),
  list: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  edit: (id, data) => api.put(`/expenses/${id}`, data),
  markPaid: (splitId) => api.post(`/splits/${splitId}/pay`),
  partialPay: (splitId, amount) => api.post(`/splits/${splitId}/partial-pay`, { amount }),
  recordAttempt: (splitId, upiApp, amount) =>
    api.post(`/splits/${splitId}/attempt`, { upiApp, amount }),
  getAttempts: (splitId) => api.get(`/splits/${splitId}/attempts`),
  deleteExpense: (expenseId, force = false) => api.delete(`/expenses/${expenseId}`, { data: { force } }),
  balances: () => api.get('/balances'),
  netBalances: () => api.get('/net-balances'),
  myPending: () => api.get('/my-pending'),
  activity: (limit) => api.get('/activity', { params: { limit } }),
  settlementPlan: () => api.get('/settlement-plan'),
  payerConfirm: (splitId) => api.post(`/splits/${splitId}/payer-confirm`),
  payerVerify: (splitId, approve) => api.post(`/splits/${splitId}/payer-verify`, { approve }),
  lockRoom: (lock) => api.post('/room/lock', { lock }),
  sendReminder: (splitId) => api.post(`/splits/${splitId}/remind`),
  getExpenseEdits: (expenseId) => api.get(`/expenses/${expenseId}/edits`),
};

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationsApi = {
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
  saveFcmToken: (token) => api.post('/notifications/fcm-token', { token }),
  getVapidKey: () => api.get('/notifications/vapid-key'),
};
