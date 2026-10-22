import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { Reveal } from '../../components/ui/Reveal.tsx';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="max-w-md w-full text-center">
        <Reveal direction="down" delay={50}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-8 shadow-sm">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>
        </Reveal>

        <Reveal direction="up" delay={150}>
          <div className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 font-['Outfit'] mb-4">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            The coordinates you requested do not correspond to any active SolarSense page or API endpoint.
          </p>
        </Reveal>

        <Reveal direction="up" delay={250}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
                Return to Home
              </Button>
            </Link>
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
