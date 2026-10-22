import { apiClient } from './client.ts';
import {
  AdminStats,
  User,
  Forecast,
  SolarDataRecord,
  ContactMessage,
  SystemSetting,
  SystemLog,
  ApiResponse,
  ApiMeta,
} from '../types/index.ts';

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
    return res.data.data;
  },

  getUsers: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ users: User[] }>>('/admin/users', { params });
    return {
      users: res.data.data.users,
      meta: res.data.meta as ApiMeta,
    };
  },

  getUserById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ user: User; forecastCount: number; recentForecasts: Forecast[] }>>(
      `/admin/users/${id}`
    );
    return res.data.data;
  },

  updateUser: async (id: string, data: { role?: string; status?: string; name?: string }) => {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>(`/admin/users/${id}`, data);
    return res.data.data.user;
  },

  deleteUser: async (id: string, deleteForecasts = true) => {
    await apiClient.delete(`/admin/users/${id}`, {
      params: { deleteForecasts },
    });
  },

  getSolarData: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ records: SolarDataRecord[] }>>('/admin/solar-data', { params });
    return {
      records: res.data.data.records,
      meta: res.data.meta as ApiMeta,
    };
  },

  createSolarData: async (data: any) => {
    const res = await apiClient.post<ApiResponse<{ record: SolarDataRecord }>>('/admin/solar-data', data);
    return res.data.data.record;
  },

  updateSolarData: async (id: string, data: any) => {
    const res = await apiClient.patch<ApiResponse<{ record: SolarDataRecord }>>(`/admin/solar-data/${id}`, data);
    return res.data.data.record;
  },

  deleteSolarData: async (id: string) => {
    await apiClient.delete(`/admin/solar-data/${id}`);
  },

  importSolarData: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ inserted: number; skipped: number; errors: any[] }>>(
      '/admin/solar-data/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  getForecasts: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ forecasts: Forecast[] }>>('/admin/forecasts', { params });
    return {
      forecasts: res.data.data.forecasts,
      meta: res.data.meta as ApiMeta,
    };
  },

  getForecastById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ forecast: Forecast }>>(`/admin/forecasts/${id}`);
    return res.data.data.forecast;
  },

  deleteForecast: async (id: string) => {
    await apiClient.delete(`/admin/forecasts/${id}`);
  },

  getForecastActivity: async (days = 30) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/forecasts/activity', { params: { days } });
    return res.data.data;
  },

  getMessages: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ messages: ContactMessage[] }>>('/admin/messages', { params });
    return {
      messages: res.data.data.messages,
      meta: res.data.meta as ApiMeta,
    };
  },

  updateMessageStatus: async (id: string, status: 'new' | 'read' | 'resolved') => {
    const res = await apiClient.patch<ApiResponse<{ message: ContactMessage }>>(`/admin/messages/${id}`, { status });
    return res.data.data.message;
  },

  deleteMessage: async (id: string) => {
    await apiClient.delete(`/admin/messages/${id}`);
  },

  getSettings: async () => {
    const res = await apiClient.get<ApiResponse<{ settings: SystemSetting[] }>>('/admin/settings');
    return res.data.data.settings;
  },

  updateSetting: async (key: string, value: any) => {
    const res = await apiClient.patch<ApiResponse<{ setting: SystemSetting }>>(`/admin/settings/${key}`, { value });
    return res.data.data.setting;
  },

  getLogs: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ logs: SystemLog[] }>>('/admin/logs', { params });
    return {
      logs: res.data.data.logs,
      meta: res.data.meta as ApiMeta,
    };
  },

  getModelInfo: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/model');
    return res.data.data;
  },
};
