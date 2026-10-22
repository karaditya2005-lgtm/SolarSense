import { apiClient } from './client.ts';
import { User, ApiResponse } from '../types/index.ts';

export const userApi = {
  getMe: async () => {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/users/me');
    return res.data.data.user;
  },

  updateMe: async (data: Partial<User>) => {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>('/users/me', data);
    return res.data.data.user;
  },

  deleteMe: async (password: string) => {
    await apiClient.delete('/users/me', { data: { password } });
  },
};
