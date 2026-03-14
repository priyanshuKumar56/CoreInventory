import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor — auto-refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ===== AUTH =====
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  refreshToken: (data) => api.post('/auth/refresh', data),
};

// ===== DASHBOARD =====
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ===== RECEIPTS =====
export const receiptsAPI = {
  getAll: (params) => api.get('/receipts', { params }),
  getById: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
  update: (id, data) => api.put(`/receipts/${id}`, data),
  action: (id, action) => api.post(`/receipts/${id}/action`, { action }),
  delete: (id) => api.delete(`/receipts/${id}`),
};

// ===== DELIVERIES =====
export const deliveriesAPI = {
  getAll: (params) => api.get('/deliveries', { params }),
  getById: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  action: (id, action) => api.post(`/deliveries/${id}/action`, { action }),
};

// ===== TRANSFERS =====
export const transfersAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  action: (id, action) => api.post(`/transfers/${id}/action`, { action }),
};

// ===== ADJUSTMENTS =====
export const adjustmentsAPI = {
  getAll: () => api.get('/adjustments'),
  create: (data) => api.post('/adjustments', data),
  validate: (id) => api.post(`/adjustments/${id}/validate`),
};

// ===== STOCK & MOVES =====
export const stockAPI = {
  getOverview: (params) => api.get('/stock', { params }),
  getMoves: (params) => api.get('/moves', { params }),
};

// ===== PRODUCTS =====
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
};

// ===== WAREHOUSES & LOCATIONS =====
export const warehousesAPI = {
  getAll: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
  getLocations: (params) => api.get('/locations', { params }),
  createLocation: (data) => api.post('/locations', data),
};

// ===== CONTACTS =====
export const contactsAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  create: (data) => api.post('/contacts', data),
};

// ===== USERS =====
export const usersAPI = {
  getAll: () => api.get('/users'),
  updateProfile: (data) => api.put('/profile', data),
};
