import React from 'react';
import { Menu, Activity, SunMedium } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button.tsx';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobileSidebar?: () => void;
  isAdmin?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  onOpenMobileSidebar,
  isAdmin = false,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
            {isAdmin && (
              <span className="text-[10px] bg-solar-500/15 text-solar-400 border border-solar-500/30 px-2 py-0.5 rounded-full font-semibold uppercase">
                Admin
              </span>
            )}
          </h1>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health / Real-time Status */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Services Operational</span>
        </div>

        {/* Quick action: New Forecast (for user app) */}
        {!isAdmin && (
          <Link to="/app/forecast">
            <Button variant="primary" size="sm" leftIcon={<SunMedium className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">New Forecast</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
