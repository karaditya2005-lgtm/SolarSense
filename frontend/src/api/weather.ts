import { apiClient } from './client.ts';
import { HourlyWeather, SolarDataRecord, ApiResponse, ApiMeta } from '../types/index.ts';

export interface GeocodeResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DailyForecastRecord {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  solarIrradianceSumMjM2: number;
  solarIrradianceKwhM2: number;
  precipitationMm: number;
  windSpeedMaxMs: number;
  expectedSolarGenerationKwh: number | null;
  actualGenerationKwh?: number | null;
  forecastStatus: string;
}

export interface ModelMetadata {
  name: string;
  type?: string;
  version: string;
  status?: string;
  dataSource?: string;
  metrics?: {
    mae?: number;
    rmse?: number;
    r2?: number;
    nmae?: number;
  };
}

export interface SevenDayForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  daily: DailyForecastRecord[];
  model?: ModelMetadata;
  source?: string;
  fetchedAt?: string;
}

export const weatherApi = {
  geocode: async (query: string) => {
    const res = await apiClient.get<ApiResponse<{ results: GeocodeResult[] }>>('/weather/geocode', {
      params: { q: query },
    });
    return res.data.data.results;
  },

  getCurrent: async (latitude: number, longitude: number) => {
    const res = await apiClient.get<
      ApiResponse<{ current: HourlyWeather; location: any; source?: string; fetchedAt?: string }>
    >('/weather/current', {
      params: { latitude, longitude },
    });
    return res.data.data;
  },

  getForecast: async (latitude: number, longitude: number, date?: string) => {
    const res = await apiClient.get<ApiResponse<{ hourly: HourlyWeather[]; timezone: string }>>(
      '/weather/forecast',
      {
        params: { latitude, longitude, date },
      }
    );
    return res.data.data;
  },

  get7DayForecast: async (latitude: number, longitude: number, timezone?: string, capacityKw?: number) => {
    const res = await apiClient.get<ApiResponse<SevenDayForecastResponse>>('/weather/forecast', {
      params: { latitude, longitude, days: 7, timezone, capacityKw },
    });
    return res.data.data;
  },

  getSolarData: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<{ records: SolarDataRecord[] }>>('/weather/solar-data', {
      params,
    });
    return {
      records: res.data.data.records,
      meta: res.data.meta as ApiMeta,
    };
  },
};
