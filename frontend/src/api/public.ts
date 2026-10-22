import { apiClient } from './client.ts';
import { DashboardSummary, ApiResponse } from '../types/index.ts';

export const publicApi = {
  getHealth: async () => {
    const res = await apiClient.get<ApiResponse<{ api: string; db: string; ml: string; uptimeSeconds: number }>>(
      '/health'
    );
    return res.data.data;
  },

  getStats: async () => {
    const res = await apiClient.get<ApiResponse<{ totalForecasts: number; totalUsers: number }>>('/public/stats');
    return res.data.data;
  },

  submitContact: async (data: { name: string; email: string; subject: string; message: string }) => {
    const res = await apiClient.post<ApiResponse<{ id: string; message: string }>>('/contact', data);
    return res.data.data;
  },

  getDashboardSummary: async () => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
};
