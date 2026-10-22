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

export interface ForecastChartPoint {
  time: string;
  powerKw: number;
  ghiWm2?: number;
  cloudCoverPct?: number;
  temperatureC?: number;
}

export interface ForecastLineChartProps {
  data: ForecastChartPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const timeFormatted = label.includes('T') ? label.split('T')[1].substring(0, 5) : label;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs">
        <p className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-solar-500" />
          Time: {timeFormatted}
        </p>
        <div className="space-y-1">
          <p className="text-amber-400 font-medium">
            Power: <span className="text-slate-100 font-bold">{data.powerKw} kW</span>
          </p>
          {data.ghiWm2 !== undefined && (
            <p className="text-sky-400">
              Irradiance: <span className="text-slate-200">{data.ghiWm2} W/m²</span>
            </p>
          )}
          {data.cloudCoverPct !== undefined && (
            <p className="text-slate-400">
              Cloud Cover: <span className="text-slate-200">{data.cloudCoverPct}%</span>
            </p>
          )}
          {data.temperatureC !== undefined && (
            <p className="text-emerald-400">
              Temperature: <span className="text-slate-200">{data.temperatureC}°C</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ForecastLineChart: React.FC<ForecastLineChartProps> = ({ data, height = 320 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No forecast curve data available.
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    timeDisplay: d.time.includes('T') ? d.time.split('T')[1].substring(0, 5) : d.time,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="solarPowerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="irradianceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="timeDisplay"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            yAxisId="power"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            unit=" kW"
          />
          <YAxis
            yAxisId="ghi"
            orientation="right"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            unit=" W"
            hide
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Area
            yAxisId="power"
            type="monotone"
            dataKey="powerKw"
            name="Predicted Power (kW)"
            stroke="#f59e0b"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#solarPowerGradient)"
          />
          {formattedData.some((d) => d.ghiWm2 !== undefined) && (
            <Area
              yAxisId="ghi"
              type="monotone"
              dataKey="ghiWm2"
              name="Solar Irradiance (W/m²)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#irradianceGradient)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
