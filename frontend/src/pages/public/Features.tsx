import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Cpu,
  ShieldCheck,
  BarChart3,
  Clock,
  Compass,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  Database,
  CloudLightning,
} from 'lucide-react';
import { Section } from '../../components/ui/Section.tsx';
import { Reveal } from '../../components/ui/Reveal.tsx';
import { Button } from '../../components/ui/Button.tsx';

export const Features: React.FC = () => {
  const featureList = [
    {
      icon: <Sun className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Atmospheric & Irradiance Analysis',
      badge: 'Meteorology',
      description:
        'Pulls real Global Horizontal Irradiance (GHI), Direct Normal Irradiance (DNI), Diffuse Horizontal Irradiance (DHI), cloud cover percentages, temperature, and wind speed from numerical weather prediction models.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Decoupled ML Inference Engine',
      badge: 'Machine Learning',
      description:
        'A dedicated Python FastAPI microservice executes trained regression models. Heavy matrix mathematics are isolated from the web gateway, ensuring rapid, reliable inference.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Diurnal Generation Curves',
      badge: 'Visual Analytics',
      description:
        'Interactive charts display 24-hour power curves against incident solar radiation, pinpointing solar noon peak generation (kW) and estimated cumulative daily energy production (kWh).',
    },
    {
      icon: <Compass className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Array Geometry Calibration',
      badge: 'Customization',
      description:
        'Tailor forecasts to your exact physical solar installation. Specify system peak capacity (kW), installation tilt angle (0°–90°), and compass azimuth orientation (0°–360°).',
    },
    {
      icon: <Clock className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Persistent Forecast Archive',
      badge: 'History & Auditing',
      description:
        'Every created forecast is permanently stored in MongoDB Atlas with complete meteorological snapshots, enabling longitudinal accuracy tracking, re-runs, and search filtering.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Role-Based Access Control',
      badge: 'Security',
      description:
        'Enterprise-grade dual-token JWT security. In-memory access tokens protect against XSS, while httpOnly cookie refresh rotation features token reuse detection and instant revocation.',
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Data Portability & Export',
      badge: 'Interoperability',
      description:
        'Export predicted hourly values and atmospheric factors into standard CSV or JSON files. Seamlessly feed generation estimates into third-party modeling tools or spreadsheets.',
    },
    {
      icon: <Database className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Intelligent Weather Caching',
      badge: 'Performance',
      description:
        'Automated server-side caching of weather snapshots with TTL expiration indexes drastically reduces redundant API calls and accelerates repeat queries.',
    },
    {
      icon: <CloudLightning className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: 'Administrative Tooling',
      badge: 'Administration',
      description:
        'Comprehensive admin suite for monitoring platform metrics, managing user accounts, auditing system logs, inspecting ML health, and managing solar benchmark datasets.',
    },
  ];

  return (
    <div className="w-full pt-28 md:pt-32 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 md:mb-20">
        <Reveal direction="up" delay={150}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
            Comprehensive <span className="text-cyan-600 dark:text-cyan-400">Forecasting Features</span>
          </h1>
        </Reveal>
        <Reveal direction="up" delay={250}>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            From atmospheric irradiance data acquisition to responsive chart visualization,
            SolarSense provides a complete toolset for solar energy estimation.
          </p>
        </Reveal>
      </div>

      {/* Grid of Features */}
      <Section
        id="feature-grid"
        className="bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((feature, idx) => (
            <Reveal key={feature.title} direction="up" delay={50 + (idx % 3) * 75}>
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:border-cyan-500/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2.5">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Call to action */}
      <div className="max-w-4xl mx-auto px-4 text-center mt-12">
        <Reveal direction="up" delay={100}>
          <div className="p-8 md:p-12 rounded-3xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              Experience Precision Solar Forecasting
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8">
              Register for a free account to generate your first forecast or explore the end-to-end data pipeline.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="md" variant="secondary">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
