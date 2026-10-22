import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DailyForecastRecord } from '../../api/weather.ts';

export interface SevenDayForecastChartProps {
  data: DailyForecastRecord[];
  batteryCapacityKwh?: number | null;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item: DailyForecastRecord = payload[0].payload;
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs">
        <p className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span>{formattedDate}</span>
          <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
        </p>

        <div className="space-y-1">
          <p className="text-amber-400 font-semibold flex items-center justify-between">
            <span>Solar Irradiance:</span>
            <span className="text-slate-100 font-bold font-mono">
              {item.solarIrradianceKwhM2} kWh/m²
            </span>
          </p>
          <p className="text-sky-400 text-[11px] flex items-center justify-between">
            <span>Radiation Sum:</span>
            <span className="text-slate-200 font-mono">{item.solarIrradianceSumMjM2} MJ/m²</span>
          </p>
          <p className="text-rose-400 text-[11px] flex items-center justify-between">
            <span>Temperature:</span>
            <span className="text-slate-200 font-mono">{item.tempMinC}°C – {item.tempMaxC}°C</span>
          </p>
          <p className="text-teal-400 text-[11px] flex items-center justify-between">
            <span>Precipitation:</span>
            <span className="text-slate-200 font-mono">{item.precipitationMm} mm</span>
          </p>
          <p className="text-indigo-400 text-[11px] flex items-center justify-between">
            <span>Peak Wind:</span>
            <span className="text-slate-200 font-mono">{item.windSpeedMaxMs} m/s</span>
          </p>
          {item.expectedSolarGenerationKwh !== null && item.expectedSolarGenerationKwh !== undefined ? (
            <p className="text-emerald-400 font-semibold flex items-center justify-between border-t border-slate-800 pt-1">
              <span>Expected Output:</span>
              <span className="text-slate-100 font-bold font-mono">
                {item.expectedSolarGenerationKwh} kWh
              </span>
            </p>
          ) : (
            <p className="text-amber-500/80 text-[10px] italic border-t border-slate-800 pt-1">
              ML Generation Prediction: Offline
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const SevenDayForecastChart: React.FC<SevenDayForecastChartProps> = ({
  data,
  batteryCapacityKwh,
  height = 320,
}) => {
  const [viewMode, setViewMode] = React.useState<'all' | 'generation' | 'irradiance'>('all');

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No 7-day forecast data available.
      </div>
    );
  }

  // Format chart data with weekday labels and optional storage potential
  const chartPoints = data.map((d) => {
    const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
    const dayDate = d.date.split('-').slice(1).join('/'); // "10/22"

    // If real battery capacity exists: usable capacity is batteryCapacity * 0.90
    const usableBatteryKwh = batteryCapacityKwh ? Number((batteryCapacityKwh * 0.90).toFixed(2)) : null;

    return {
      ...d,
      dayLabel: `${dayName} (${dayDate})`,
      usableStorageKwh: usableBatteryKwh,
    };
  });

  const hasPredictions = data.some((d) => d.expectedSolarGenerationKwh !== null && d.expectedSolarGenerationKwh !== undefined);

  const showIrradiance = viewMode === 'all' || viewMode === 'irradiance';
  const showGeneration = (viewMode === 'all' || viewMode === 'generation') && hasPredictions;

  return (
    <div className="w-full space-y-2">
      {/* View Mode Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {viewMode === 'all' && (
            <span>Left axis: <strong className="text-amber-500">Irradiance (kWh/m²)</strong> • Right axis: <strong className="text-emerald-500">Predicted Generation (kWh)</strong></span>
          )}
          {viewMode === 'generation' && (
            <span>Single axis view: <strong className="text-emerald-500">ML Predicted Generation (kWh)</strong></span>
          )}
          {viewMode === 'irradiance' && (
            <span>Single axis view: <strong className="text-amber-500">Daily Solar Irradiance (kWh/m²)</strong></span>
          )}
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              viewMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All (Comparison)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('generation')}
            disabled={!hasPredictions}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              viewMode === 'generation'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
            }`}
          >
            Generation (kWh)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('irradiance')}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              viewMode === 'irradiance'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Irradiance (kWh/m²)
          </button>
        </div>
      </div>

      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 12, right: showGeneration && viewMode === 'all' ? 35 : 15, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="irradianceKwhGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="generationKwhGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />

            <XAxis
              dataKey="dayLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            {showIrradiance && (
              <YAxis
                yAxisId="irradiance"
                stroke="#f59e0b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(v) => `${v}`}
                width={38}
                domain={[0, 'auto']}
              />
            )}

            {showGeneration && (
              <YAxis
                yAxisId="energy"
                orientation={viewMode === 'all' ? 'right' : 'left'}
                stroke="#10b981"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(v) => `${v}`}
                width={38}
                domain={[0, 'auto']}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />

            {showIrradiance && (
              <Area
                yAxisId="irradiance"
                type="monotone"
                dataKey="solarIrradianceKwhM2"
                name="Daily Solar Irradiance (kWh/m²)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#irradianceKwhGradient)"
              />
            )}

            {showGeneration && (
              <Area
                yAxisId="energy"
                type="monotone"
                dataKey="expectedSolarGenerationKwh"
                name="Predicted Solar Generation (kWh)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#generationKwhGradient)"
              />
            )}

            {batteryCapacityKwh && viewMode !== 'irradiance' ? (
              <Area
                yAxisId="energy"
                type="step"
                dataKey="usableStorageKwh"
                name="Usable Storage Limit (kWh)"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#storageGradient)"
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
