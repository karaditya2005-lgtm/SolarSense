import { apiClient, setAccessToken } from './client.ts';
import { User, ApiResponse } from '../types/index.ts';

let activeRefreshPromise: Promise<{ user: User; accessToken: string }> | null = null;

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data);
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },

  refresh: async () => {
    // Dedupe concurrent refresh calls (prevents React StrictMode double invocation issues)
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
      try {
        const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/refresh');
        setAccessToken(res.data.data.accessToken);
        return res.data.data;
      } finally {
        activeRefreshPromise = null;
      }
    })();

    return activeRefreshPromise;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  getMe: async () => {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await apiClient.patch<ApiResponse<{ message: string }>>('/auth/change-password', data);
    return res.data.data;
  },
};
