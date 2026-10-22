import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Topbar } from './Topbar.tsx';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageMeta = () => {
    const path = location.pathname;
    if (path.includes('/app/forecasts/')) return { title: 'Forecast Report', subtitle: 'Detailed hourly predictions and meteorological snapshot' };
    if (path === '/app/forecast') return { title: 'Generate Solar Forecast', subtitle: 'Target location and array parameters' };
    if (path === '/app/history') return { title: 'Forecast History', subtitle: 'Review and compare historical solar predictions' };
    if (path === '/app/profile') return { title: 'User Profile', subtitle: 'Personal credentials and solar array preferences' };
    if (path === '/app/settings') return { title: 'Account Settings', subtitle: 'Security and system preferences' };
    return { title: 'Energy Dashboard', subtitle: 'Real-time solar generation metrics and weather indicators' };
  };

  const meta = getPageMeta();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar isAdminPanel={false} />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 h-full animate-in slide-in-from-left duration-200">
            <Sidebar isAdminPanel={false} onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          isAdmin={false}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
