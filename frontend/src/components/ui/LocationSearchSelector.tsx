import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Globe,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Loader2,
  X,
  Navigation,
} from 'lucide-react';
import { weatherApi, GeocodeResult } from '../../api/weather.ts';
import { getErrorMessage } from '../../utils/errors.ts';

export interface ResolvedLocation {
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  name: string;
}

interface LocationSearchSelectorProps {
  currentLocation: ResolvedLocation;
  onLocationSelect: (location: ResolvedLocation) => void;
  isLoading?: boolean;
}

const COMMON_COUNTRIES = [
  'India',
  'United States',
  'Germany',
  'United Kingdom',
  'Australia',
  'Canada',
  'Japan',
  'France',
  'Spain',
  'Brazil',
];

export const LocationSearchSelector: React.FC<LocationSearchSelectorProps> = ({
  currentLocation,
  onLocationSelect,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'structured'>('search');

  // Search Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Structured Mode State
  const [country, setCountry] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [cityLocality, setCityLocality] = useState('');
  const [structuredError, setStructuredError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Execute Real Geocoding Search
  const handlePerformSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (trimmed.length < 2) {
      setSearchError('Search query must be at least 2 characters.');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await weatherApi.geocode(trimmed);
      if (!results || results.length === 0) {
        setSearchError(`No locations found matching "${trimmed}".`);
        setSearchResults([]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      setSearchError(getErrorMessage(err, 'Geocoding service unavailable. Please check your query or network.'));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Structured Search Resolver
  const handleStructuredResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setStructuredError(null);

    if (!country.trim()) {
      setStructuredError('Country is required.');
      return;
    }
    if (!cityLocality.trim()) {
      setStructuredError('City / Locality is required.');
      return;
    }

    // Compound query to geocoding API
    const compound = [cityLocality.trim(), stateRegion.trim(), country.trim()]
      .filter(Boolean)
      .join(', ');

    setIsSearching(true);
    try {
      const results = await weatherApi.geocode(compound);
      if (!results || results.length === 0) {
        setStructuredError(`Could not resolve coordinates for ${compound}. Please check spelling.`);
      } else {
        // Automatically select top match or show in search list
        setSearchResults(results);
        setMode('search');
        setSearchQuery(compound);
      }
    } catch (err) {
      setStructuredError(getErrorMessage(err, 'Failed to resolve location coordinates.'));
    } finally {
      setIsSearching(false);
    }
  };

  const selectResolved = (item: GeocodeResult) => {
    const resolved: ResolvedLocation = {
      city: item.name,
      state: item.admin1 || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone || 'UTC',
      name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country ? ', ' + item.country : ''}`,
    };

    onLocationSelect(resolved);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      {/* Current Location Display Card / Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>Monitored Solar Site</span>
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
            </div>

            <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                📍 {currentLocation.city}
                {currentLocation.state ? `, ${currentLocation.state}` : ''}
                {currentLocation.country ? `, ${currentLocation.country}` : ''}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 font-mono">
              <span>Lat: {currentLocation.latitude.toFixed(4)}°</span>
              <span>Lon: {currentLocation.longitude.toFixed(4)}°</span>
              {currentLocation.timezone && <span>TZ: {currentLocation.timezone}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
            {isOpen ? 'Close' : 'Change Location'}
          </span>
          <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {/* Dropdown Modal / Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 backdrop-blur-xl">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('search')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'search'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Global Search</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('structured')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'structured'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Country • State • City</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode 1: Global Search */}
          {mode === 'search' && (
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePerformSearch(searchQuery);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any city or region worldwide (e.g. Kolkata, Los Angeles, Berlin, Tokyo)..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  <span>Find</span>
                </button>
              </form>

              {searchError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Search Results List */}
              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.map((item, idx) => (
                    <div
                      key={`${item.latitude}-${item.longitude}-${idx}`}
                      onClick={() => selectResolved(item)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{item.name}</span>
                          {item.admin1 && (
                            <span className="text-slate-500 dark:text-slate-400 font-normal">
                              ({item.admin1})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.country} • Lat: {item.latitude.toFixed(2)}°, Lon: {item.longitude.toFixed(2)}°
                        </div>
                      </div>

                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        Select
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Structured Country / State / City Form */}
          {mode === 'structured' && (
            <form onSubmit={handleStructuredResolve} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Country */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India or United States"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {COMMON_COUNTRIES.slice(0, 4).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCountry(c)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. State / Province / Region */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. State / Region
                  </label>
                  <input
                    type="text"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="e.g. West Bengal, California"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Province or federal region</span>
                </div>

                {/* 3. City / Locality */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. City / Locality <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cityLocality}
                    onChange={(e) => setCityLocality(e.target.value)}
                    placeholder="e.g. Kolkata, Los Angeles"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Urban area or settlement</span>
                </div>
              </div>

              {structuredError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{structuredError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-colors flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Resolve Coordinates & Select</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
