export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserPreferences {
  units?: 'metric' | 'imperial';
  defaultLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  defaultCapacityKw?: number;
  batteryCapacityKwh?: number;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  organization?: string;
  preferences?: UserPreferences;
  forecastCount?: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface HourlyWeather {
  time: string;
  temperatureC: number;
  cloudCoverPct: number;
  humidityPct: number;
  windSpeedMs: number;
  ghiWm2: number;
  dniWm2?: number;
  dhiWm2?: number;
  precipitationMm?: number;
  overridden?: boolean;
}

export interface HourlyPrediction {
  time: string;
  powerKw: number;
  capacityFactor?: number;
  solarElevationDeg?: number;
}

export interface Forecast {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    country?: string;
  };
  targetDateTime: string;
  mode: 'single' | 'day';
  system: {
    capacityKw: number;
    tiltDeg?: number;
    azimuthDeg?: number;
  };
  weatherSnapshot: {
    source: string;
    fetchedAt: string;
    hourly: HourlyWeather[];
  };
  prediction?: {
    targetPowerKw: number;
    unit: string;
    hourly: HourlyPrediction[];
    dayEnergyKwh?: number;
    confidence?: {
      lowKw: number;
      highKw: number;
    };
  };
  model?: {
    name: string;
    version: string;
    trainedAt?: string;
  };
  status: 'pending' | 'completed' | 'failed';
  actualComparison?: {
    actualPowerKw: number;
    differenceKw: number;
    errorPct: number;
    source: string;
    recordedAt: string;
  } | null;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SolarDataRecord {
  _id: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  timestamp: string;
  ghiWm2: number;
  dniWm2?: number;
  dhiWm2?: number;
  temperatureC: number;
  cloudCoverPct?: number;
  humidityPct?: number;
  windSpeedMs?: number;
  acPowerKw?: number;
  capacityKw?: number;
  source: string;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'resolved';
  createdAt: string;
}

export interface SystemLog {
  _id: string;
  level: 'info' | 'warn' | 'error';
  type: 'auth' | 'forecast' | 'admin' | 'ml' | 'weather' | 'system';
  action: string;
  actorId?: { _id: string; name: string; email: string };
  targetType?: string;
  message: string;
  meta?: any;
  createdAt: string;
}

export interface SystemSetting {
  _id: string;
  key: string;
  value: any;
  type: 'number' | 'boolean' | 'string';
  description?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  latestForecast: Forecast | null;
  recentForecasts: Forecast[];
  stats: {
    totalForecasts: number;
    avgPowerKw: number;
    peakPowerKw: number;
    totalEnergyKwh: number;
    mostUsedLocation: string;
  };
  indicators: {
    temperatureC: number | null;
    cloudCoverPct: number | null;
    humidityPct: number | null;
    windSpeedMs: number | null;
    ghiWm2: number | null;
    source: string;
    locationName?: string;
  };
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    admins: number;
  };
  forecasts: {
    total: number;
    completed: number;
    failed: number;
    last24h: number;
    failureRatePct: number;
  };
  perDay: Array<{
    _id: string;
    total: number;
    completed: number;
    failed: number;
  }>;
  ml: {
    status: string;
    modelLoaded: boolean;
    modelVersion: string;
  };
  recentActivity: SystemLog[];
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
}
