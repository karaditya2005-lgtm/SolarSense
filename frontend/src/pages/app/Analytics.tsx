import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Sun,
  Calendar,
  Layers,
  Gauge,
  Cpu,
  FileDown,
  RefreshCw,
  MapPin,
  ArrowLeft,
  Info,
  CheckCircle,
  AlertCircle,
  BatteryCharging,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.tsx';
import { weatherApi, DailyForecastRecord, ModelMetadata } from '../../api/weather.ts';
import { forecastApi } from '../../api/forecasts.ts';
import { publicApi } from '../../api/public.ts';
import { HourlyWeather, Forecast } from '../../types/index.ts';
import { LocationSearchSelector, ResolvedLocation } from '../../components/ui/LocationSearchSelector.tsx';
import { AdvancedStorageCalculator } from '../../components/dashboard/AdvancedStorageCalculator.tsx';
import { generateSolarAnalysisPdf, SolarReportData } from '../../utils/pdfReportGenerator.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { getErrorMessage } from '../../utils/errors.ts';

export const Analytics: React.FC = () => {
  const { user } = useAuth();

  // Location State (defaults to user preference or Kolkata)
  const [selectedLocation, setSelectedLocation] = useState<ResolvedLocation>(() => {
    if (user?.preferences?.defaultLocation?.latitude && user?.preferences?.defaultLocation?.longitude) {
      const parts = (user.preferences.defaultLocation.name || '').split(',').map((p) => p.trim());
      return {
        city: parts[0] || 'Default Location',
        state: parts[1] || '',
        country: parts[2] || '',
        name: user.preferences.defaultLocation.name || 'Default Location',
        latitude: user.preferences.defaultLocation.latitude,
        longitude: user.preferences.defaultLocation.longitude,
        timezone: user.preferences.defaultLocation.timezone || 'UTC',
      };
    }
    return {
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      name: 'Kolkata, West Bengal, India',
      latitude: 22.5626,
      longitude: 88.3630,
      timezone: 'Asia/Kolkata',
    };
  });

  // Telemetry & ML State
  const [sevenDayForecast, setSevenDayForecast] = useState<DailyForecastRecord[]>([]);
  const [isForecastLoading, setIsForecastLoading] = useState<boolean>(true);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [currentWeather, setCurrentWeather] = useState<HourlyWeather | null>(null);
  const [weatherMeta, setWeatherMeta] = useState<{ source?: string; fetchedAt?: string } | null>(null);

  const [locationPrediction, setLocationPrediction] = useState<Forecast | null>(null);
  const [mlModelInfo, setMlModelInfo] = useState<ModelMetadata | null>(null);
  const [mlStatus, setMlStatus] = useState<'Active' | 'Unavailable' | 'Checking'>('Checking');

  const [batteryCapacity, setBatteryCapacity] = useState<number | null>(() => {
    return user?.preferences?.batteryCapacityKwh ?? null;
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const lastLocationKeyRef = useRef<string>('');

  const systemCapacityKw = user?.preferences?.defaultCapacityKw || 25;

  // Fetch 7-Day Forecast & Live Weather for Location
  const loadLocationTelemetry = useCallback(
    async (loc: ResolvedLocation) => {
      setIsForecastLoading(true);
      setForecastError(null);
      try {
        const [sevenDayRes, currentRes, modelRes] = await Promise.allSettled([
          weatherApi.get7DayForecast(loc.latitude, loc.longitude, loc.timezone, systemCapacityKw),
          weatherApi.getCurrent(loc.latitude, loc.longitude),
          forecastApi.getModelInfo(),
        ]);

        if (sevenDayRes.status === 'fulfilled') {
          setSevenDayForecast(sevenDayRes.value.daily || []);
          if (sevenDayRes.value.model) {
            setMlModelInfo(sevenDayRes.value.model);
            if (sevenDayRes.value.model.status === 'Active') setMlStatus('Active');
          }
        } else {
          setForecastError(getErrorMessage(sevenDayRes.reason, 'Unable to load 7-day solar telemetry.'));
        }

        if (currentRes.status === 'fulfilled') {
          setCurrentWeather(currentRes.value.current);
          setWeatherMeta({ source: currentRes.value.source, fetchedAt: currentRes.value.fetchedAt });
        }

        if (modelRes.status === 'fulfilled') {
          setMlModelInfo(modelRes.value);
          setMlStatus('Active');
        }

        // Also run real ML prediction for target coordinate to check ground-truth sensor comparison
        try {
          const pred = await forecastApi.create({
            locationQuery: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            targetDateTime: new Date().toISOString(),
            systemCapacityKw,
            mode: 'day',
          });
          setLocationPrediction(pred);
          setMlStatus('Active');
        } catch {
          // If individual prediction call fails, 7-day forecast model results remain visible
        }
      } finally {
        setIsForecastLoading(false);
      }
    },
    [systemCapacityKw]
  );

  useEffect(() => {
    const locKey = `${selectedLocation.latitude.toFixed(4)}_${selectedLocation.longitude.toFixed(4)}`;
    if (lastLocationKeyRef.current === locKey) return;
    lastLocationKeyRef.current = locKey;

    loadLocationTelemetry(selectedLocation);
  }, [selectedLocation, loadLocationTelemetry]);

  // Analytics Metrics (Calculated exclusively from authentic returned data)
  const daysWithPredictions = sevenDayForecast.filter(
    (d) => d.expectedSolarGenerationKwh !== null && d.expectedSolarGenerationKwh !== undefined
  );
  const hasRealMlPredictions = daysWithPredictions.length > 0;

  const totalPredictedGenerationKwh = hasRealMlPredictions
    ? Number(daysWithPredictions.reduce((acc, d) => acc + (d.expectedSolarGenerationKwh || 0), 0).toFixed(2))
    : null;

  const avgDailyPredictedGenerationKwh =
    hasRealMlPredictions && daysWithPredictions.length
      ? Number((totalPredictedGenerationKwh! / daysWithPredictions.length).toFixed(2))
      : null;

  const totalIrradianceKwh = Number(
    sevenDayForecast.reduce((acc, d) => acc + (d.solarIrradianceKwhM2 || 0), 0).toFixed(2)
  );
  const avgDailyIrradianceKwh = sevenDayForecast.length
    ? Number((totalIrradianceKwh / sevenDayForecast.length).toFixed(2))
    : 0;

  const highestDay = sevenDayForecast.length
    ? sevenDayForecast.reduce((max, d) =>
        (d.expectedSolarGenerationKwh ?? d.solarIrradianceKwhM2) >
        (max.expectedSolarGenerationKwh ?? max.solarIrradianceKwhM2)
          ? d
          : max
      )
    : null;

  const lowestDay = sevenDayForecast.length
    ? sevenDayForecast.reduce((min, d) =>
        (d.expectedSolarGenerationKwh ?? d.solarIrradianceKwhM2) <
        (min.expectedSolarGenerationKwh ?? min.solarIrradianceKwhM2)
          ? d
          : min
      )
    : null;

  // Storage Analytics Data Structure for PDF & UI
  const usableDailyKwh = batteryCapacity ? Number((batteryCapacity * 0.9).toFixed(2)) : null;
  const storageSummary = {
    configured: !!batteryCapacity,
    nameplateKwh: batteryCapacity,
    usableDailyKwh,
    totalPotentialStoredKwh:
      batteryCapacity && usableDailyKwh
        ? Number(
            sevenDayForecast
              .reduce((sum, d) => sum + Math.min(d.expectedSolarGenerationKwh ?? 0, usableDailyKwh), 0)
              .toFixed(2)
          )
        : null,
    totalPotentialExcessKwh:
      batteryCapacity && usableDailyKwh
        ? Number(
            sevenDayForecast
              .reduce((sum, d) => sum + Math.max(0, (d.expectedSolarGenerationKwh ?? 0) - usableDailyKwh), 0)
              .toFixed(2)
          )
        : null,
    averageUtilizationPct:
      batteryCapacity && usableDailyKwh && sevenDayForecast.length
        ? Number(
            (
              sevenDayForecast.reduce((sum, d) => {
                const stored = Math.min(d.expectedSolarGenerationKwh ?? 0, usableDailyKwh);
                return sum + (stored / usableDailyKwh) * 100;
              }, 0) / sevenDayForecast.length
            ).toFixed(1)
          )
        : null,
    dailyStorage: sevenDayForecast.map((d) => {
      const gen = d.expectedSolarGenerationKwh ?? 0;
      const dateObj = new Date(d.date);
      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const stored = usableDailyKwh ? Number(Math.min(gen, usableDailyKwh).toFixed(2)) : 0;
      const excess = usableDailyKwh ? Number(Math.max(0, gen - usableDailyKwh).toFixed(2)) : gen;
      const util = usableDailyKwh ? Number(((stored / usableDailyKwh) * 100).toFixed(1)) : 0;
      return {
        date: d.date,
        dayLabel,
        predictedKwh: gen,
        potentialStoredKwh: stored,
        potentialExcessKwh: excess,
        utilizationPct: util,
      };
    }),
  };

  // PDF Export Trigger
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const reportPayload: SolarReportData = {
        user,
        location: selectedLocation,
        currentWeather,
        weatherMeta,
        sevenDayForecast,
        locationPrediction,
        mlModelInfo,
        batteryCapacityKwh: batteryCapacity,
        storageSummary,
        systemCapacityKw,
      };
      generateSolarAnalysisPdf(reportPayload);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Chart Data for 7-Day Trend
  const chartData = sevenDayForecast.map((d) => {
    const dateObj = new Date(d.date);
    const dayLabel = `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })} (${d.date.split('-').slice(1).join('/')})`;
    return {
      date: d.date,
      dayLabel,
      predictedKwh: d.expectedSolarGenerationKwh,
      actualKwh: d.actualGenerationKwh ?? null,
      irradianceKwhM2: d.solarIrradianceKwhM2,
      precipitationMm: d.precipitationMm,
      tempMaxC: d.tempMaxC,
    };
  });
  const hasRealActualTrendData = chartData.some((d) => d.actualKwh !== null && d.actualKwh !== undefined);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-500 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Live Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-500" />
            <span>Solar Generation Analytics & Optimization</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            High-fidelity evaluation of 7-day solar generation profiles, storage buffering, and predictive trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadLocationTelemetry(selectedLocation)}
            isLoading={isForecastLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isForecastLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Telemetry
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isGeneratingPdf}
            leftIcon={<FileDown className="w-4 h-4 text-emerald-300" />}
          >
            Download Solar Analysis Report
          </Button>
        </div>
      </div>

      {/* 2. Global Location Selection Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Analytics Location & Physical Coordinates</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
              Coordinates dynamically feed meteorological instances into the ML prediction microservice. Supports all global regions.
            </p>
          </div>

          <LocationSearchSelector
            currentLocation={selectedLocation}
            onLocationSelect={(loc) => setSelectedLocation(loc)}
            isLoading={isForecastLoading}
          />
        </div>

        {/* Location Breakdown Metadata Chips */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Region / City</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{selectedLocation.city || selectedLocation.name}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">State / Province</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{selectedLocation.state || 'N/A'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Country</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{selectedLocation.country || 'N/A'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Latitude</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white block">{selectedLocation.latitude.toFixed(4)}°N</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Longitude</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white block">{selectedLocation.longitude.toFixed(4)}°E</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Timezone</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate block">{selectedLocation.timezone || 'UTC'}</span>
          </div>
        </div>
      </div>

      {/* 3. Analytics Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Expected Solar Generation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <span>Total Expected Gen</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
            {totalPredictedGenerationKwh !== null ? (
              `${totalPredictedGenerationKwh} `
            ) : (
              <span className="text-slate-400 text-sm">Offline</span>
            )}
            <span className="text-xs font-normal text-slate-500">
              {totalPredictedGenerationKwh !== null ? 'kWh' : ''}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            7-day aggregate ML output ({systemCapacityKw} kW array)
          </div>
        </div>

        {/* KPI 2: Average Daily Expected Generation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <span>Average Daily Gen</span>
            <Gauge className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
            {avgDailyPredictedGenerationKwh !== null ? (
              `${avgDailyPredictedGenerationKwh} `
            ) : (
              <span className="text-slate-400 text-sm">Offline</span>
            )}
            <span className="text-xs font-normal text-slate-500">
              {avgDailyPredictedGenerationKwh !== null ? 'kWh/day' : ''}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Mean daily solar generation
          </div>
        </div>

        {/* KPI 3: Highest Generation Day */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            <span>Highest Generation Day</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-['Outfit'] truncate">
            {highestDay
              ? new Date(highestDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {highestDay?.expectedSolarGenerationKwh
              ? `${highestDay.expectedSolarGenerationKwh} kWh (${highestDay.solarIrradianceKwhM2} kWh/m²)`
              : highestDay
              ? `${highestDay.solarIrradianceKwhM2} kWh/m² irradiance`
              : '-'}
          </div>
        </div>

        {/* KPI 4: Lowest Generation Day */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
            <span>Lowest Generation Day</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-['Outfit'] truncate">
            {lowestDay
              ? new Date(lowestDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {lowestDay?.expectedSolarGenerationKwh
              ? `${lowestDay.expectedSolarGenerationKwh} kWh (${lowestDay.precipitationMm}mm rain)`
              : lowestDay
              ? `${lowestDay.solarIrradianceKwhM2} kWh/m² irradiance`
              : '-'}
          </div>
        </div>
      </div>

      {/* 4. 7-Day Generation Trend Chart & Comparison (Feature 1 Requirement 5) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>7-Day Solar Generation Trend & Meteorological Profile</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuous 168-hour ML predicted power vs satellite global solar irradiance
            </p>
          </div>

          <Badge variant={hasRealMlPredictions ? 'success' : 'warning'}>
            {hasRealMlPredictions ? 'ML Forecast Active' : 'ML Microservice Offline'}
          </Badge>
        </div>

        {isForecastLoading && sevenDayForecast.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            <span>Evaluating location telemetry...</span>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsIrradGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsActualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
                <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="gen"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v} kWh`}
                  width={55}
                />
                <YAxis
                  yAxisId="irrad"
                  orientation="right"
                  stroke="#f59e0b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  yAxisId="gen"
                  type="monotone"
                  dataKey="predictedKwh"
                  name="Predicted Generation (kWh)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsGenGrad)"
                />
                {hasRealActualTrendData && (
                  <Area
                    yAxisId="gen"
                    type="monotone"
                    dataKey="actualKwh"
                    name="Actual Generation (kWh)"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#analyticsActualGrad)"
                  />
                )}
                <Area
                  yAxisId="irrad"
                  type="monotone"
                  dataKey="irradianceKwhM2"
                  name="Solar Irradiance (kWh/m²)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#analyticsIrradGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="w-7 h-7 text-amber-500" />}
            title="Telemetry Unavailable"
            description="No 7-day data available for the selected coordinates."
          />
        )}
      </div>

      {/* 5. 7-Day Trend Table: Date | Predicted Generation | Actual Generation (Feature 1 Requirement 5) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>7-Day Generation & Actual Comparison Table</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Ground-Truth Rule: Actual values are displayed only when physical sensor telemetry exists.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Solar Irradiance</th>
                <th className="py-2.5 px-3">Predicted Generation</th>
                <th className="py-2.5 px-3">Actual Generation</th>
                <th className="py-2.5 px-3">Comparison Status</th>
                <th className="py-2.5 px-3">Temperature</th>
                <th className="py-2.5 px-3">Precipitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sevenDayForecast.map((d) => {
                const dateObj = new Date(d.date);
                const dayLabel = `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })}, ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                return (
                  <tr key={d.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {dayLabel}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {d.solarIrradianceKwhM2} kWh/m²
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {d.expectedSolarGenerationKwh !== null ? `${d.expectedSolarGenerationKwh} kWh` : 'Offline'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {/* In accordance with feature prompt: If actual data is unavailable for a date, show "Actual: Not Available" */}
                      {d.actualGenerationKwh !== null && d.actualGenerationKwh !== undefined ? (
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {d.actualGenerationKwh} kWh
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Actual: Not Available
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {d.actualGenerationKwh !== null && d.actualGenerationKwh !== undefined
                        ? 'Ground-Truth Sensor Verified'
                        : 'Awaiting Pyranometer Telemetry'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {d.tempMinC}° – {d.tempMaxC}°C
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sky-600 dark:text-sky-400">
                      {d.precipitationMm} mm
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Feature 2: Enhanced Battery / Storage Recommendation Section */}
      <AdvancedStorageCalculator
        sevenDayForecast={sevenDayForecast}
        batteryCapacityKwh={batteryCapacity}
        onCapacityUpdated={(newCap) => setBatteryCapacity(newCap)}
      />

      {/* 7. Ground Truth & ML Verification Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Predicted vs Actual Sensor Telemetry (Feature 1 Requirement 6) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-teal-500" />
              <span>Ground-Truth Sensor Telemetry Verification</span>
            </h4>
            <Badge variant={locationPrediction?.actualComparison ? 'success' : 'neutral'}>
              {locationPrediction?.actualComparison ? 'Sensor Telemetry Linked' : 'Ground-Truth Not Recorded'}
            </Badge>
          </div>

          {locationPrediction?.actualComparison ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80">
                <span className="text-slate-500 font-medium">ML Predicted Power:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {locationPrediction.prediction?.targetPowerKw} kW
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80">
                <span className="text-slate-500 font-medium">Actual Ground-Truth Power:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {locationPrediction.actualComparison.actualPowerKw} kW
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80">
                <span className="text-slate-500 font-medium">Variance (Delta):</span>
                <span className="font-mono font-bold text-amber-500">
                  {locationPrediction.actualComparison.differenceKw > 0 ? '+' : ''}
                  {locationPrediction.actualComparison.differenceKw} kW
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80">
                <span className="text-slate-500 font-medium">Error Percentage:</span>
                <span className="font-mono font-bold text-sky-500">
                  {locationPrediction.actualComparison.errorPct}%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 font-mono">
                Source: {locationPrediction.actualComparison.source}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500" />
                <span>Actual: Not Available for these coordinates</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ground-truth physical sensor measurements (such as pyranometer or inverter exports) are not available for coordinates ({selectedLocation.latitude.toFixed(2)}°N, {selectedLocation.longitude.toFixed(2)}°E).
              </p>
              <p className="text-[10px] text-slate-500">
                In strict compliance with SolarSense system requirements, no synthetic, random, or placeholder actual figures are fabricated.
              </p>
            </div>
          )}
        </div>

        {/* Card: ML Model Specification (Feature 1 Requirement 7) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>Model Intelligence & Validation Metrics</span>
            </h4>
            <Badge variant="solar">v1.0.0 Microservice</Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Model Name:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {mlModelInfo?.name || 'GradientBoostingSolarEstimator'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Architecture:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Gradient Boosting Regressor (168-hr Horizon)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Telemetry Provider:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Open-Meteo & Historical Reference Records
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80">
                <span className="text-[10px] text-slate-500 block">MAE</span>
                <strong className="text-slate-900 dark:text-white text-xs">
                  {mlModelInfo?.metrics?.mae !== undefined ? mlModelInfo.metrics.mae : 'Unavailable'}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80">
                <span className="text-[10px] text-slate-500 block">R² Score</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-xs">
                  {mlModelInfo?.metrics?.r2 !== undefined ? mlModelInfo.metrics.r2 : 'Unavailable'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
