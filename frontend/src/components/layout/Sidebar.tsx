import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Sun,
  LayoutDashboard,
  SunMedium,
  History,
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Database,
  BarChart3,
  Users,
  MessageSquare,
  FileText,
  Sliders,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Badge } from '../ui/Badge.tsx';

interface SidebarProps {
  isAdminPanel?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdminPanel = false, onCloseMobile }) => {
  const { user, logout, isAdmin } = useAuth();

  const userLinks = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Advanced Analytics', path: '/app/analytics', icon: BarChart3 },
    { label: 'Solar Forecast', path: '/app/forecast', icon: SunMedium },
    { label: 'Forecast History', path: '/app/history', icon: History },
    { label: 'User Profile', path: '/app/profile', icon: UserIcon },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const adminLinks = [
    { label: 'Overview', path: '/admin', icon: BarChart3, end: true },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Solar Data', path: '/admin/solar-data', icon: Database },
    { label: 'Forecasts', path: '/admin/forecasts', icon: History },
    { label: 'Messages', path: '/admin/messages', icon: MessageSquare },
    { label: 'System Logs', path: '/admin/logs', icon: FileText },
    { label: 'Model Info', path: '/admin/model', icon: Cpu },
    { label: 'Settings', path: '/admin/settings', icon: Sliders },
  ];

  const links = isAdminPanel ? adminLinks : userLinks;

  return (
    <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-solar-400 flex items-center justify-center text-slate-950 font-bold shadow-solar-sm">
              <Sun className="w-4.5 h-4.5 fill-slate-950 stroke-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold font-['Outfit'] tracking-tight text-white leading-tight">
                Solar<span className="text-solar-400">Sense</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {isAdminPanel ? 'Admin Workspace' : 'Forecast Platform'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isAdminPanel ? 'Administration' : 'Forecast Operations'}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={(link as any).end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}

          {/* Switch Workspace Link */}
          <div className="pt-4 mt-4 border-t border-slate-800/80 px-2 space-y-1">
            {isAdmin && !isAdminPanel && (
              <Link
                to="/admin"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Switch to Admin Panel</span>
              </Link>
            )}

            {isAdminPanel && (
              <Link
                to="/app/dashboard"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to User App</span>
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-solar-400 shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <Badge variant={user?.role === 'admin' ? 'solar' : 'neutral'} size="sm">
                {user?.role}
              </Badge>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
