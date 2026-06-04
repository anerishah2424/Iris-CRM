import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
export const AGENT_BASE_URL = (import.meta as any).env.VITE_AGENT_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → refresh token → retry original request once
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        await useAuthStore.getState().refreshAccessToken();
        const token = useAuthStore.getState().accessToken;
        err.config.headers.Authorization = `Bearer ${token}`;
        return api(err.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
