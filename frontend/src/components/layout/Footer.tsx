import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Logo } from '../ui/Logo.tsx';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <Logo size="md" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Precision solar energy forecasting platform uniting live satellite meteorological irradiance data with trained machine learning estimators.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/features" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">How It Works</Link></li>
              <li><Link to="/app/forecast" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Run Solar Forecast</Link></li>
              <li><Link to="/app/history" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Historical Records</Link></li>
            </ul>
          </div>

          {/* Project & Tech */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">About MCA Project</Link></li>
              <li><a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Open-Meteo Solar API</a></li>
              <li><span className="text-slate-400 dark:text-slate-500">FastAPI ML Microservice</span></li>
              <li><span className="text-slate-400 dark:text-slate-500">MongoDB Atlas Distributed DB</span></li>
            </ul>
          </div>

          {/* Legal / Attribution */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Data Attribution</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Meteorological forecasts provided by Open-Meteo under CC-BY 4.0. Predictions are statistical estimates and should not be used as the sole basis for safety-critical grid infrastructure operations.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} SolarSense. Aditya Kar. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for clean solar energy intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
};
