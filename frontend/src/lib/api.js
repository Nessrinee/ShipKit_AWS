import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sk_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('sk_refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, {
            refreshToken: refresh,
          });
          localStorage.setItem('sk_access_token', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('sk_access_token');
          localStorage.removeItem('sk_refresh_token');
        }
      }
    }
    return Promise.reject(err);
  }
);

export const fetchProducts = () => api.get('/products');
export const fetchProduct  = (slug) => api.get(`/products/${slug}`);
export const verifyLicense = (body) => api.post('/downloads/verify', body);
export const sendContact   = (body) => api.post('/contact', body);
export const loginAdmin    = (body) => api.post('/auth/login', body);

export default api;
