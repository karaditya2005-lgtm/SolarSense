import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Zap,
  CloudSun,
  Cpu,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Building2,
  Home as HomeIcon,
  Activity,
  CheckCircle2,
  Gauge,
  ThermometerSun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Section } from '../../components/ui/Section.tsx';
import { Reveal } from '../../components/ui/Reveal.tsx';
import { SolarPanelBackdrop } from '../../components/graphics/SolarPanelBackdrop.tsx';
import { publicApi } from '../../api/public.ts';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<{ totalForecasts?: number; activeUsers?: number; avgLatencyMs?: number } | null>(null);

  useEffect(() => {
    publicApi
      .getStats()
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch(() => {
        // Gracefully ignore if offline
      });
  }, []);

  return (
    <div className="w-full transition-colors duration-300">
      {/* 1. Full-Screen Hero with Real Solar Panel Photo & Dual Light/Dark Atmosphere */}
      <SolarPanelBackdrop
        imageSrc="/images/hero-solar.jpg"
        className="min-h-screen flex flex-col justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto w-full relative z-10 text-center">

          {/* Headline */}
          <Reveal direction="up" delay={150}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900 dark:text-white">
              Precision Solar Power <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200">
                Forecasting Engine
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal direction="up" delay={200}>
            <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-slate-700 dark:text-slate-200 mb-8 leading-relaxed font-normal">
              Anticipate photovoltaic generation curves hour by hour. SolarSense connects real-time
              numerical weather models with machine learning estimators to forecast clean solar yield
              for any geographic coordinate worldwide.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal direction="up" delay={250}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              {isAuthenticated ? (
                <Link to="/app/dashboard">
                  <Button size="lg" variant="primary" leftIcon={<Zap className="w-5 h-5" />}>
                    Enter Forecaster Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Start Forecasting Free
                    </Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-white text-slate-800 hover:bg-slate-100 border-slate-300 shadow-sm dark:bg-slate-900/80 dark:text-white dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Explore Prediction Pipeline
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          {/* Key capability indicators */}
          <Reveal direction="up" delay={300}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4">
              <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-sm flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">GHI & DNI Irradiance</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Open-Meteo atmospheric feeds</div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-sm flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Machine Learning</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Trained regression & XGBoost</div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-sm flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">24h / 7d Horizons</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Hourly generation forecasts</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Real Backend Stats (if available) */}
          {stats && (stats.totalForecasts !== undefined || stats.activeUsers !== undefined) && (
            <Reveal direction="up" delay={350}>
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {stats.totalForecasts !== undefined && (
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                      {stats.totalForecasts.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                      Forecasts Generated
                    </div>
                  </div>
                )}
                {stats.activeUsers !== undefined && (
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                      {stats.activeUsers.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                      Registered Analysts
                    </div>
                  </div>
                )}
                {stats.avgLatencyMs !== undefined && (
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                      {stats.avgLatencyMs} ms
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                      Model Latency
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </SolarPanelBackdrop>

      {/* 2. What Is Solar Forecasting Section (Dual Light & Full Dark) */}
      <Section
        id="what-is-solar-forecasting"
        title={
          <span>
            Understanding <span className="text-emerald-600 dark:text-emerald-400">Solar Power Forecasting</span>
          </span>
        }
        subtitle="Solar generation is governed by minute-by-minute atmospheric fluctuations. Predicting power requires decoding irradiance physics."
        className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Reveal direction="up" delay={100}>
            <div className="h-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Solar Irradiance Components</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Global Horizontal Irradiance (GHI) is divided into Direct Normal Irradiance (DNI) traveling directly from the sun disk and Diffuse Horizontal Irradiance (DHI) scattered by cloud water droplets and aerosols.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                Tracking beam and diffuse ratios is crucial for calculating actual tilted panel absorption.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={200}>
            <div className="h-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <CloudSun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Atmospheric Attenuation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Cloud optical thickness, relative humidity, and ambient air temperature govern real panel thermal losses. Photovoltaic panel efficiency degrades with elevated cell operating temperatures.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                Weather parameters are continuously normalized before feeding into inference pipelines.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={300}>
            <div className="h-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Machine Learning Modeling</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Rather than relying solely on simplistic geometrical formulas, machine learning models map non-linear meteorological interactions into verified power output values across the diurnal cycle.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                Models predict instantaneous generation curves for 24-hour and 7-day future horizons.
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 3. Why It Is Useful (Benefits) Section (Dual Light & Full Dark, No Yellow) */}
      <Section
        id="benefits"
        title={
          <span>
            Why Solar Forecasting <span className="text-emerald-600 dark:text-emerald-400">Matters</span>
          </span>
        }
        subtitle="Accurate power predictions eliminate grid uncertainty for residential owners, commercial facilities, and utility grid operators."
        className="bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Reveal direction="left" delay={100}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <HomeIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Residential & Rooftop Solar</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Homeowners with rooftop photovoltaic panels and battery energy storage systems (BESS) can proactively optimize self-consumption. Knowing midday production allows intelligent scheduling of EV charging, heat pumps, and domestic appliances.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Maximize battery charge cycles before cloudy weather periods</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Minimize expensive peak-rate utility grid electricity purchases</span>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal direction="right" delay={150}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/25">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Commercial & Industrial (C&I)</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Large facilities, logistics hubs, and industrial campuses face high peak demand charges. Accurate generation forecasts enable facilities managers to balance factory loads and avoid expensive threshold penalties.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Targeted peak shaving during anticipated irradiance slumps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Synchronized backup generator dispatch planning</span>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal direction="left" delay={200}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Grid Operators & Dispatchers</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Transmission and distribution system operators must balance generation with demand every second. High solar penetration without forecasting causes voltage instability and costly rapid reserve ramping.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Efficient spinning reserve allocation and dispatch scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Mitigation of sudden solar generation ramp-down risks</span>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal direction="right" delay={250}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/25">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Solar Farm Asset Managers</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Utility-scale solar plant developers and asset owners must submit day-ahead generation schedules to energy markets. Penalties for deviation can severely impact financial returns.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Regulatory scheduling compliance and deviation settlement optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Proactive maintenance window scheduling during low-irradiance days</span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 4. How It Works (4 Steps) Section */}
      <Section
        id="how-it-works"
        title={
          <span>
            How the Solar Forecasting <span className="text-emerald-600 dark:text-emerald-400">Engine Operates</span>
          </span>
        }
        subtitle="A four-stage scientific pipeline transforming physical solar radiation into validated generation forecasts."
        className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Reveal direction="up" delay={100}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">01</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Location & Horizon</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Specify geographic coordinates (latitude, longitude) and array parameters (capacity in kW, tilt angle, azimuth) alongside a 24-hour or multi-day time horizon.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Supports international coordinates & local solar time.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={200}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">02</span>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <CloudSun className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Meteorological Fetch</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The backend contacts Open-Meteo's numerical weather models, retrieving hourly GHI, direct irradiance, cloud cover percentages, and ambient temperature readings.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Validated against atmospheric physics ranges.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={300}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">03</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">ML Inference</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The FastAPI machine learning service formats normalized feature vectors and computes power generation curves through the trained regression model.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Trained on verified PV generation datasets.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={400}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">04</span>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Persistence & Analytics</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Calculated records, peak yield estimates, and hourly curves are stored in MongoDB Atlas, visualized through interactive charts, and ready for CSV/JSON export.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Audited historical records available to signed-in users.
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 5. Features Grid Section */}
      <Section
        id="features"
        title={
          <span>
            Engineered for <span className="text-emerald-600 dark:text-emerald-400">Solar Yield Reliability</span>
          </span>
        }
        subtitle="Built from the ground up for meteorological precision, compliance, and actionable solar intelligence."
        className="bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Reveal direction="up" delay={100}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Sun className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Multi-Irradiance Analysis</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingests Global Horizontal, Direct Normal, and Diffuse Irradiance together with solar zenith angles to calculate true incident solar flux.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={150}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Dedicated ML Microservice</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Isolated FastAPI inference engine keeps heavy matrix transformations decoupled from core web transactions, ensuring sub-second response times.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={200}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure Multi-Role Access</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Production-grade JWT security featuring in-memory access tokens, httpOnly refresh rotation, and fine-grained User/Admin authorization tiers.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={250}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Historical Audit Trail</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Every generated forecast is permanently archived per user with complete meteorological parameters, enabling longitudinal performance verification.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={300}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <ThermometerSun className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Thermal Degradation Loss</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Adjusts nominal generation with real-time cell operating temperature calculations, accounting for photovoltaic negative temperature coefficients.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={350}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-emerald-500/40 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Standardized Data Export</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Directly export hourly predicted energy outputs and raw meteorological variables in structured CSV or JSON formats for downstream modeling.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 6. Final Call to Action Section with Weather Station & Panels Background */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 dark:opacity-25 pointer-events-none"
          style={{ backgroundImage: 'url(/images/weather-station.jpg)' }}
        />
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/85 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <Reveal direction="up" delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
              Empower Your Solar Decision Making Today
            </h2>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create an account in seconds to start generating high-fidelity solar irradiance forecasts for any geographic location worldwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-slate-800 hover:bg-slate-100 border-slate-300 shadow-sm dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-700"
                >
                  Contact Technical Team
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
