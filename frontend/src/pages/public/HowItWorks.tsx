import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  CloudSun,
  Cpu,
  BarChart3,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  Workflow,
  Sparkles,
  Server,
  Code2,
} from 'lucide-react';
import { Section } from '../../components/ui/Section.tsx';
import { Reveal } from '../../components/ui/Reveal.tsx';
import { Button } from '../../components/ui/Button.tsx';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Geocoding & Location Resolution',
      tag: 'Input Phase',
      icon: <MapPin className="w-6 h-6 text-solar-400" />,
      description:
        'The process begins when a user enters a location name or specific geographic coordinates (latitude and longitude). The server resolves the name to verified latitude, longitude, and local timezone coordinates.',
      details: [
        'Forward geocoding with Open-Meteo geocoding service',
        'Automatic timezone detection for accurate diurnal alignment',
        'Validation of coordinate boundaries (−90° to 90°, −180° to 180°)',
      ],
      techNote: 'Frontend submits query → Backend coordinates handler',
    },
    {
      step: '02',
      title: 'Meteorological Data Acquisition',
      tag: 'Weather Proxy',
      icon: <CloudSun className="w-6 h-6 text-solar-400" />,
      description:
        'The backend server communicates with external numerical weather prediction services. It requests hourly forecasts for Global Horizontal Irradiance (GHI), Direct Normal Irradiance (DNI), Diffuse Irradiance (DHI), cloud cover, ambient temperature, and wind speed.',
      details: [
        'Server-side proxying ensures API keys remain confidential',
        'Weather caching with TTL expiration prevents duplicate external queries',
        'Range-checking ensures values conform to physical atmospheric limits',
      ],
      techNote: 'Open-Meteo REST API → Weather cache (MongoDB) → Validation',
    },
    {
      step: '03',
      title: 'Machine Learning Vector & Inference',
      tag: 'Prediction Engine',
      icon: <Cpu className="w-6 h-6 text-solar-400" />,
      description:
        'The backend packages normalized meteorological factors and system specifications (installed capacity, tilt angle, azimuth) into a structured feature vector. This vector is sent to the Python FastAPI microservice.',
      details: [
        'Standardized feature scaling matching trained model distributions',
        'Trained gradient-boosted / regression estimator calculates output (kW)',
        'Model returns hourly power curve and inference execution metadata',
      ],
      techNote: 'FastAPI /predict endpoint → scikit-learn / XGBoost model',
    },
    {
      step: '04',
      title: 'Persistence & Interactive Visualization',
      tag: 'Client Presentation',
      icon: <BarChart3 className="w-6 h-6 text-solar-400" />,
      description:
        'The complete forecast—including input parameters, weather snapshot, prediction curve, and model version—is stored in MongoDB Atlas. The client receives the response and renders interactive charts and summary metrics.',
      details: [
        'Forecast saved per user for historical audits and longitudinal analysis',
        'Hourly generation curves plotted against solar radiation values',
        'Instant export options for structured CSV and JSON downloads',
      ],
      techNote: 'MongoDB Atlas collection → React Recharts interactive graphs',
    },
  ];

  return (
    <div className="w-full pt-28 md:pt-32 pb-20">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 md:mb-24">
        <Reveal direction="up" delay={150}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
            How SolarSense <span className="text-emerald-600 dark:text-emerald-400">Works</span>
          </h1>
        </Reveal>
        <Reveal direction="up" delay={250}>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Follow the journey of a solar power prediction request: from user input coordinates
            through atmospheric weather APIs and machine learning models to real-time charts.
          </p>
        </Reveal>
      </div>

      {/* Visual Pipeline Walkthrough */}
      <Section
        id="pipeline-steps"
        className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900"
      >
        <div className="space-y-12 max-w-5xl mx-auto">
          {steps.map((item, idx) => (
            <Reveal key={item.step} direction="up" delay={idx * 100}>
              <div className="relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none hover:border-emerald-500/40 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Step Header & Badge */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl sm:text-5xl font-black text-emerald-600/80 dark:text-emerald-400/80 font-['Outfit']">
                        {item.step}
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Step Content & Bullets */}
                  <div className="lg:col-span-8 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-2 pt-2">
                      {item.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <Code2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.techNote}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Architecture Highlights */}
      <Section
        id="architecture-notes"
        title={
          <span>
            The Governing Principle: <span className="text-emerald-600 dark:text-emerald-400">Zero Fake Data</span>
          </span>
        }
        subtitle="SolarSense follows a strict truth-in-data rule. No mock responses, random generator fallbacks, or synthetic predictions exist in the codebase."
        className="bg-white dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-900"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Reveal direction="up" delay={100}>
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-full shadow-sm dark:shadow-none">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Real Model Origins</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Predictions reflect real calculations computed by the ML microservice from physical weather variables. No numbers are fabricated in the client or server.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={200}>
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-full shadow-sm dark:shadow-none">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Transparent Failure Modes</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                If the weather service or ML service is unreachable, SolarSense presents explicit, user-friendly diagnostic errors rather than masking errors with fake predictions.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delay={300}>
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-full shadow-sm dark:shadow-none">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Scientific Transparency</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Model performance metrics (MAE, RMSE, R²) displayed in the application are derived directly from documented offline training evaluation metadata.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 text-center mt-12">
        <Reveal direction="up" delay={100}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Your Account
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="secondary">
                Contact Project Team
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
