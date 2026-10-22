import { apiClient } from './client.ts';
import { Forecast, ApiResponse, ApiMeta } from '../types/index.ts';

export interface CreateForecastPayload {
  locationQuery?: string;
  latitude?: number;
  longitude?: number;
  targetDateTime: string;
  systemCapacityKw: number;
  tiltDeg?: number;
  azimuthDeg?: number;
  mode?: 'single' | 'day';
  weatherOverrides?: {
    temperatureC?: number;
    cloudCoverPct?: number;
    ghiWm2?: number;
    humidityPct?: number;
    windSpeedMs?: number;
  };
}

export const forecastApi = {
  create: async (data: CreateForecastPayload) => {
    const res = await apiClient.post<ApiResponse<{ forecast: Forecast }>>('/forecasts', data);
    return res.data.data.forecast;
  },

  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ forecasts: Forecast[] }>>('/forecasts', { params });
    return {
      forecasts: res.data.data.forecasts,
      meta: res.data.meta as ApiMeta,
    };
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ forecast: Forecast }>>(`/forecasts/${id}`);
    return res.data.data.forecast;
  },

  rerun: async (id: string) => {
    const res = await apiClient.post<ApiResponse<{ forecast: Forecast }>>(`/forecasts/${id}/rerun`);
    return res.data.data.forecast;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/forecasts/${id}`);
  },

  getStats: async (params?: { from?: string; to?: string }) => {
    const res = await apiClient.get<ApiResponse<any>>('/forecasts/stats', { params });
    return res.data.data;
  },
  getModelInfo: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/forecasts/model');
    return res.data.data;
  },
};
