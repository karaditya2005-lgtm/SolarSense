import React, { useState } from 'react';
import {
  BatteryCharging,
  Battery,
  Zap,
  Info,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Sliders,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DailyForecastRecord } from '../../api/weather.ts';
import { userApi } from '../../api/users.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { getErrorMessage } from '../../utils/errors.ts';

export interface AdvancedStorageCalculatorProps {
  sevenDayForecast: DailyForecastRecord[];
  batteryCapacityKwh: number | null;
  onCapacityUpdated: (capacity: number | null) => void;
  className?: string;
}

const COMMON_CAPACITIES = [
  { label: '5 kWh (Compact)', value: 5 },
  { label: '10 kWh (Home)', value: 10 },
  { label: '13.5 kWh (Standard)', value: 13.5 },
  { label: '20 kWh (Dual Stack)', value: 20 },
];

export const AdvancedStorageCalculator: React.FC<AdvancedStorageCalculatorProps> = ({
  sevenDayForecast,
  batteryCapacityKwh,
  onCapacityUpdated,
  className = '',
}) => {
  const { user, fetchMe } = useAuth();
  const [customInput, setCustomInput] = useState<string>(
    batteryCapacityKwh ? String(batteryCapacityKwh) : ''
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Business Rule: Usable depth of discharge buffer = 90% (0.90)
  const usableDailyKwh = batteryCapacityKwh ? Number((batteryCapacityKwh * 0.90).toFixed(2)) : 0;
  const totalWeeklyBufferKwh = Number((usableDailyKwh * 7).toFixed(2));

  // Calculate daily storage potential from real 7-day ML predictions
  const dailyBreakdown = sevenDayForecast.map((d) => {
    const genKwh = d.expectedSolarGenerationKwh ?? 0;
    const dateObj = new Date(d.date);
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

    if (!batteryCapacityKwh || usableDailyKwh <= 0) {
      return {
        date: d.date,
        dayLabel,
        predictedKwh: genKwh,
        potentialStoredKwh: 0,
        potentialExcessKwh: genKwh,
        utilizationPct: 0,
      };
    }

    const potentialStoredKwh = Number(Math.min(genKwh, usableDailyKwh).toFixed(2));
    const potentialExcessKwh = Number(Math.max(0, genKwh - usableDailyKwh).toFixed(2));
    const utilizationPct = usableDailyKwh > 0 ? Number(Math.min(100, (potentialStoredKwh / usableDailyKwh) * 100).toFixed(1)) : 0;

    return {
      date: d.date,
      dayLabel,
      predictedKwh: genKwh,
      potentialStoredKwh,
      potentialExcessKwh,
      utilizationPct,
    };
  });

  const totalPredictedGenKwh = Number(
    dailyBreakdown.reduce((sum, d) => sum + d.predictedKwh, 0).toFixed(2)
  );
  const totalPotentialStoredKwh = Number(
    dailyBreakdown.reduce((sum, d) => sum + d.potentialStoredKwh, 0).toFixed(2)
  );
  const totalPotentialExcessKwh = Number(
    dailyBreakdown.reduce((sum, d) => sum + d.potentialExcessKwh, 0).toFixed(2)
  );

  const averageUtilizationPct =
    batteryCapacityKwh && dailyBreakdown.length > 0
      ? Number((dailyBreakdown.reduce((sum, d) => sum + d.utilizationPct, 0) / dailyBreakdown.length).toFixed(1))
      : 0;

  // Persist updated capacity to MongoDB Atlas user preferences
  const saveCapacity = async (capacityVal: number) => {
    if (!user) return;
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      await userApi.updateMe({
        preferences: {
          ...user.preferences,
          batteryCapacityKwh: capacityVal,
        },
      });
      await fetchMe();
      onCapacityUpdated(capacityVal);
      setCustomInput(String(capacityVal));
      setStatusMessage({
        type: 'success',
        text: `Battery storage capacity (${capacityVal} kWh) saved to your profile in MongoDB Atlas.`,
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update battery capacity.') });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCapacity = async () => {
    if (!user) return;
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      await userApi.updateMe({
        preferences: {
          ...user.preferences,
          batteryCapacityKwh: undefined,
        },
      });
      await fetchMe();
      onCapacityUpdated(null);
      setCustomInput('');
      setStatusMessage({
        type: 'success',
        text: 'Battery capacity cleared. Storage estimate now shows unavailable state.',
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err, 'Failed to clear battery capacity.') });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customInput);
    if (isNaN(parsed) || parsed <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid battery capacity greater than 0 kWh.' });
      return;
    }
    saveCapacity(parsed);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Header Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BatteryCharging className="w-5 h-5 text-emerald-500" />
              <span>Battery Storage Recommendation & Potential Analysis</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated using authentic 7-day ML solar generation predictions and user-configured BESS capacity
            </p>
          </div>

          <Badge variant={batteryCapacityKwh ? 'success' : 'neutral'}>
            {batteryCapacityKwh ? `${batteryCapacityKwh} kWh Configured` : 'Storage Estimate Unavailable'}
          </Badge>
        </div>

        {/* Capacity Selector Form */}
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select or Input Battery Storage Capacity:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {COMMON_CAPACITIES.map((cap) => (
                <button
                  key={cap.value}
                  type="button"
                  onClick={() => saveCapacity(cap.value)}
                  disabled={isUpdating}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col justify-between ${
                    batteryCapacityKwh === cap.value
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/30'
                  }`}
                >
                  <span className="font-bold">{cap.value} kWh</span>
                  <span className="text-[10px] text-slate-500 font-normal">{cap.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0.5"
                  max="5000"
                  step="0.5"
                  placeholder="Custom capacity (e.g. 15.0)"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">kWh</span>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                leftIcon={<Sliders className="w-3.5 h-3.5" />}
              >
                Apply
              </Button>
              {batteryCapacityKwh && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCapacity}
                  disabled={isUpdating}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  Clear
                </Button>
              )}
            </form>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Storage Calculation Output */}
      {batteryCapacityKwh ? (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Expected Solar Generation */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                <span>Expected Solar Gen</span>
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                {totalPredictedGenKwh} <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                7-Day cumulative ML yield
              </div>
            </div>

            {/* Card 2: Potential Stored Energy */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                <span>Potential Stored Energy</span>
                <BatteryCharging className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                {totalPotentialStoredKwh} <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                7-Day estimated storage capture
              </div>
            </div>

            {/* Card 3: Potential Excess Energy */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                <span>Potential Excess Energy</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-['Outfit']">
                {totalPotentialExcessKwh} <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Unstored generation buffer
              </div>
            </div>

            {/* Card 4: Storage Utilization Rate */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">
                <span>Storage Utilization</span>
                <Layers className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-['Outfit']">
                {averageUtilizationPct}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Average buffer capture rate
              </div>
            </div>
          </div>

          {/* Daily Storage Breakdown Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Daily Storage Breakdown & Buffer Utilization</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Daily Usable Limit: {usableDailyKwh} kWh (90% DoD)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Predicted Generation</th>
                    <th className="py-2.5 px-3">Usable Buffer</th>
                    <th className="py-2.5 px-3">Potential Stored</th>
                    <th className="py-2.5 px-3">Potential Excess</th>
                    <th className="py-2.5 px-3">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {dailyBreakdown.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {row.dayLabel}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.predictedKwh} kWh
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {usableDailyKwh} kWh
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {row.potentialStoredKwh} kWh
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-600 dark:text-amber-400">
                        {row.potentialExcessKwh} kWh
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${row.utilizationPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {row.utilizationPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Transparent Calculation Business Rules Callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-500" />
                <span>Transparent Business Logic & Engineering Formulas:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px]">
                <li>Usable Daily Buffer = Nameplate Capacity ({batteryCapacityKwh} kWh) × 90% DoD = {usableDailyKwh} kWh</li>
                <li>Potential Stored Energy = min(Daily Predicted Generation, Usable Daily Buffer)</li>
                <li>Potential Excess Energy = max(0, Daily Predicted Generation - Usable Daily Buffer)</li>
                <li>Storage Utilization Rate = (Potential Stored / Usable Buffer) × 100%</li>
                <li>Note: Refers to Estimated Storage Potential based on ML simulations. Zero physical storage claimed without hardware telemetry.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Unconfigured State: In compliance with PRD, show "Storage estimate unavailable" */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Battery className="w-6 h-6" />
          </div>
          <div className="font-extrabold text-base text-slate-900 dark:text-white">
            Storage estimate unavailable
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Please configure or select a battery storage capacity above to compute energy capture, storage utilization, and unstored excess generation. SolarSense never fabricates fake battery values.
          </p>
        </div>
      )}
    </div>
  );
};
