import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  GraduationCap,
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Code2,
  ExternalLink,
  ArrowRight,
  Server,
  CloudSun,
} from 'lucide-react';
import { Section } from '../../components/ui/Section.tsx';
import { Reveal } from '../../components/ui/Reveal.tsx';
import { Button } from '../../components/ui/Button.tsx';

export const About: React.FC = () => {
  return (
    <div className="w-full pt-28 md:pt-32 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 md:mb-24">
        <Reveal direction="up" delay={150}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
            About <span className="text-cyan-600 dark:text-cyan-400">SolarSense</span>
          </h1>
        </Reveal>
        <Reveal direction="up" delay={250}>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            SolarSense is a full-stack, production-engineered solar power forecasting platform
            developed as an MCA final-year capstone project. It bridges live satellite meteorological
            irradiance data with machine learning inference to predict photovoltaic generation curves.
          </p>
        </Reveal>
      </div>

      {/* Problem & Motivation */}
      <Section
        id="problem"
        title={
          <span>
            The Challenge of <span className="text-cyan-600 dark:text-cyan-400">Solar Intermittency</span>
          </span>
        }
        subtitle="Solar energy is inherently intermittent. Variations in cloud cover, aerosols, and temperature create sudden generation swings that challenge modern power infrastructure."
        className="bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <Reveal direction="left" delay={100}>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                As worldwide electricity grids rapidly transition toward renewable energy, the unpredictability of solar photovoltaic (PV) generation presents acute operational challenges. Rapid cloud transients can cause multi-megawatt generation ramps within minutes.
              </p>
              <p>
                Without accurate forward-looking forecasts, power grid operators must maintain expensive fossil-fuel spinning reserves to guard against sudden drop-offs. Simultaneously, commercial solar asset managers face steep financial penalties for day-ahead scheduling deviations.
              </p>
              <p>
                SolarSense was conceived to provide a transparent, accessible, and mathematically grounded forecasting pipeline that transforms open meteorological forecasts into actionable solar power predictions.
              </p>
            </div>
          </Reveal>

          <Reveal direction="right" delay={150}>
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Key Project Objectives
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">End-to-End Pipeline:</strong> Seamless integration across browser UI, Express gateway, Open-Meteo API, Python ML service, and MongoDB Atlas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Zero Mock Policy:</strong> All predictions originate from real meteorological vectors and genuine model inference — no synthetic hardcoded results.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Production Security:</strong> Dual-token JWT authentication with memory-only access tokens and httpOnly refresh rotation with reuse protection.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Academic Rigour:</strong> Fully documented API contracts, database schemas, and reproducible ML training artifacts.</span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Architecture & Tech Stack */}
      <Section
        id="architecture"
        title={
          <span>
            Modern Full-Stack <span className="text-cyan-600 dark:text-cyan-400">Engineering</span>
          </span>
        }
        subtitle="Designed with clean separation of concerns, microservice decoupling, and resilient error recovery."
        className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Reveal direction="up" delay={100}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Frontend SPA</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  React 18 with Vite, Tailwind CSS v3, React Router v6, Axios interceptors, React Hook Form, and Zod validation.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3 font-mono">
                WCAG AA compliant, responsive 360px–1920px.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={200}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Backend Gateway</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Node.js and Express REST API gateway managing routing, JWT auth, input validation, external API proxying, and caching.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3 font-mono">
                Layered controller/service pattern with structured logging.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={300}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">ML Microservice</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Python FastAPI service wrapping trained scikit-learn / XGBoost estimators with reproducible model metadata.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3 font-mono">
                Dedicated feature vector scaling & latency metrics.
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={400}>
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">MongoDB Atlas</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Cloud document database storing users, forecast history, weather snapshots with TTL caching, settings, and audit logs.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3 font-mono">
                Compound indexes for high-speed filtered queries.
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Attribution & Open Science */}
      <Section
        id="attribution"
        title={
          <span>
            Meteorological <span className="text-cyan-600 dark:text-cyan-400">Attribution</span>
          </span>
        }
        subtitle="SolarSense relies on open scientific data and numerical weather models."
        className="bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <CloudSun className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Open-Meteo Weather API</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Solar irradiance parameters (Global Horizontal Irradiance, Direct Beam Irradiance, Diffuse Irradiance), ambient temperature, relative humidity, wind speed, and cloud cover are fetched from Open-Meteo. Open-Meteo aggregates numerical weather predictions from national weather services (NOAA GFS, DWD ICON, MeteoFrance) and distributes them under Creative Commons Attribution 4.0 International (CC-BY 4.0).
              </p>
              <div className="pt-2">
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
                >
                  <span>Explore Open-Meteo Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 text-center mt-12">
        <Reveal direction="up" delay={100}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/features">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Platform Features
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="md" variant="secondary">
                View Prediction Pipeline
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
