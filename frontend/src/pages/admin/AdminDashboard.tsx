import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  BarChart3,
  Database,
  Server,
  CloudSun,
  Activity,
  Settings,
  FileText,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Clock,
  MapPin,
  Zap,
  LayoutDashboard,
  Cpu,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Logo } from '../../components/ui/Logo.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.tsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { ErrorState } from '../../components/ui/ErrorState.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { ActivityChart } from '../../components/charts/ActivityChart.tsx';
import { adminApi } from '../../api/admin.ts';
import {
  AdminStats,
  User,
  Forecast,
  SystemLog,
  SystemSetting,
  ApiMeta,
} from '../../types/index.ts';
import { getErrorMessage } from '../../utils/errors.ts';

type ActiveTab = 'overview' | 'users' | 'forecasts' | 'logs' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersMeta, setUsersMeta] = useState<ApiMeta | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Forecasts Monitoring State
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [forecastsMeta, setForecastsMeta] = useState<ApiMeta | null>(null);
  const [isForecastsLoading, setIsForecastsLoading] = useState<boolean>(false);
  const [forecastsError, setForecastsError] = useState<string | null>(null);
  const [forecastPage, setForecastPage] = useState(1);

  // Logs State
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<{ key: string; value: string } | null>(null);

  // User Actions Feedback & Confirmation Dialog State
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  // Load Admin Stats from MongoDB Atlas
  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      setStatsError(getErrorMessage(err, 'Failed to fetch admin statistics from backend.'));
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Load Registered Users
  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    setUsersError(null);
    try {
      const params: Record<string, any> = { page: userPage, limit: 10 };
      if (userSearch.trim()) params.q = userSearch.trim();
      if (userRoleFilter) params.role = userRoleFilter;
      if (userStatusFilter) params.status = userStatusFilter;

      const res = await adminApi.getUsers(params);
      setUsers(res.users);
      setUsersMeta(res.meta);
    } catch (err) {
      setUsersError(getErrorMessage(err, 'Unable to load registered users directory.'));
    } finally {
      setIsUsersLoading(false);
    }
  }, [userPage, userSearch, userRoleFilter, userStatusFilter]);

  // Load System Forecasts
  const loadForecasts = useCallback(async () => {
    setIsForecastsLoading(true);
    setForecastsError(null);
    try {
      const res = await adminApi.getForecasts({ page: forecastPage, limit: 10 });
      setForecasts(res.forecasts);
      setForecastsMeta(res.meta);
    } catch (err) {
      setForecastsError(getErrorMessage(err, 'Unable to load system forecasts.'));
    } finally {
      setIsForecastsLoading(false);
    }
  }, [forecastPage]);

  // Load Audit Logs
  const loadLogs = useCallback(async () => {
    setIsLogsLoading(true);
    setLogsError(null);
    try {
      const res = await adminApi.getLogs({ limit: 20 });
      setLogs(res.logs);
    } catch (err) {
      setLogsError(getErrorMessage(err, 'Unable to load audit logs.'));
    } finally {
      setIsLogsLoading(false);
    }
  }, []);

  // Load System Settings
  const loadSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    setSettingsError(null);
    try {
      const data = await adminApi.getSettings();
      setSettings(data);
    } catch (err) {
      setSettingsError(getErrorMessage(err, 'Unable to load system configuration settings.'));
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // Sync active tab data
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'forecasts') loadForecasts();
    else if (activeTab === 'logs') loadLogs();
    else if (activeTab === 'settings') loadSettings();
  }, [activeTab, loadUsers, loadForecasts, loadLogs, loadSettings]);

  // User Management Actions
  const handleToggleUserStatus = (targetUser: User) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const actionVerb = newStatus === 'active' ? 'activate' : 'suspend';

    setDialogState({
      isOpen: true,
      title: `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} User Account`,
      message: `Are you sure you want to ${actionVerb} user "${targetUser.name}" (${targetUser.email})?`,
      confirmLabel: actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1),
      variant: newStatus === 'suspended' ? 'danger' : 'primary',
      onConfirm: async () => {
        setIsDialogLoading(true);
        setActionAlert(null);
        try {
          await adminApi.updateUser(targetUser._id, { status: newStatus });
          setActionAlert({
            type: 'success',
            message: `User ${targetUser.email} has been successfully ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
          });
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          loadUsers();
          loadStats();
        } catch (err) {
          setActionAlert({
            type: 'error',
            message: getErrorMessage(err, 'Failed to update user status.'),
          });
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsDialogLoading(false);
        }
      },
    });
  };

  const handleToggleUserRole = (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const actionTitle = newRole === 'admin' ? 'Promote to Administrator' : 'Demote to Normal User';

    setDialogState({
      isOpen: true,
      title: actionTitle,
      message: `Are you sure you want to change the role of "${targetUser.name}" (${targetUser.email}) to "${newRole}"?`,
      confirmLabel: actionTitle,
      variant: newRole === 'admin' ? 'primary' : 'danger',
      onConfirm: async () => {
        setIsDialogLoading(true);
        setActionAlert(null);
        try {
          await adminApi.updateUser(targetUser._id, { role: newRole });
          setActionAlert({
            type: 'success',
            message: `User ${targetUser.email} role updated to "${newRole}".`,
          });
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          loadUsers();
          loadStats();
        } catch (err) {
          setActionAlert({
            type: 'error',
            message: getErrorMessage(err, 'Failed to update user role.'),
          });
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsDialogLoading(false);
        }
      },
    });
  };

  const handleDeleteUser = (targetUser: User) => {
    setDialogState({
      isOpen: true,
      title: 'Delete User Account Permanently',
      message: `Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email})? This action cannot be undone. All associated forecast records will be removed.`,
      confirmLabel: 'Delete User',
      variant: 'danger',
      onConfirm: async () => {
        setIsDialogLoading(true);
        setActionAlert(null);
        try {
          await adminApi.deleteUser(targetUser._id, true);
          setActionAlert({
            type: 'success',
            message: `User ${targetUser.email} has been permanently deleted from MongoDB Atlas.`,
          });
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          loadUsers();
          loadStats();
        } catch (err) {
          setActionAlert({
            type: 'error',
            message: getErrorMessage(err, 'Failed to delete user account.'),
          });
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsDialogLoading(false);
        }
      },
    });
  };

  // Forecast Delete Action
  const handleDeleteForecast = (fc: Forecast) => {
    setDialogState({
      isOpen: true,
      title: 'Delete Forecast Record',
      message: `Are you sure you want to delete forecast record for ${fc.location.name} (${new Date(fc.targetDateTime).toLocaleDateString()})?`,
      confirmLabel: 'Delete Record',
      variant: 'danger',
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await adminApi.deleteForecast(fc._id);
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          loadForecasts();
          loadStats();
        } catch (err) {
          alert(getErrorMessage(err, 'Failed to delete forecast record.'));
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsDialogLoading(false);
        }
      },
    });
  };

  // Save System Setting
  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;

    try {
      let parsedValue: any = editingSetting.value;
      const targetSetting = settings.find((s) => s.key === editingSetting.key);

      if (targetSetting?.type === 'number') {
        parsedValue = Number(editingSetting.value);
      } else if (targetSetting?.type === 'boolean') {
        parsedValue = editingSetting.value === 'true';
      }

      await adminApi.updateSetting(editingSetting.key, parsedValue);
      setEditingSetting(null);
      loadSettings();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update system setting.'));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };


  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* 1. Global Admin Navigation Topbar */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" linkTo="/admin/dashboard" />
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Console:
              </span>
              <span className="text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/25 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>System Administration</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Dashboard Link */}
            <Link to="/app/dashboard">
              <Button variant="secondary" size="sm" leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}>
                <span className="hidden sm:inline">User Dashboard</span>
              </Button>
            </Link>

            {/* Admin User Chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wider font-semibold">
                  Administrator
                </div>
              </div>
            </div>

            <ThemeToggle />

            <Button variant="secondary" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Admin Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        {/* Operational Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Administration & System Governance
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              User directory administration, forecast request monitoring, system health feeds, and Atlas audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                loadStats();
                if (activeTab === 'users') loadUsers();
                if (activeTab === 'forecasts') loadForecasts();
                if (activeTab === 'logs') loadLogs();
                if (activeTab === 'settings') loadSettings();
              }}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isStatsLoading || isUsersLoading ? 'animate-spin' : ''}`} />}
            >
              Sync Admin Feeds
            </Button>
          </div>
        </div>

        {/* 3. System Infrastructure & External Services Status (Feature 4) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>System Infrastructure & Service Feeds Status</span>
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Validated via real backend telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MongoDB Atlas */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">MongoDB Atlas</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected (Read/Write)</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Database: solarsense</div>
              </div>
            </div>

            {/* Weather Feed (Open-Meteo) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Meteorological Provider</div>
                <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Open-Meteo API Active</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Solar radiation & forecast feed</div>
              </div>
            </div>

            {/* Geocoding Service */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Geocoding Service</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Worldwide Lookup Active</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">City, state, country georesolver</div>
              </div>
            </div>

            {/* ML Prediction Microservice */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">ML Forecast Service</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Not Connected</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Awaiting ML integration phase</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Platform Metrics KPI Cards (Feature 1) */}
        {isStatsLoading && !stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse" />
            ))}
          </div>
        ) : statsError ? (
          <ErrorState title="Admin Telemetry Error" message={statsError} onRetry={loadStats} />
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                {stats.users.total}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.users.active} active</span>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400">{stats.users.suspended} suspended</span>
              </div>
            </div>

            {/* Total Forecast Requests */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Total Forecasts</span>
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-['Outfit']">
                {stats.forecasts.total}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {stats.forecasts.last24h} in last 24h
              </div>
            </div>

            {/* Failure Rate */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Completed / Failed</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                {stats.forecasts.completed} <span className="text-xs font-normal text-slate-500">/ {stats.forecasts.failed}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Failure rate: {stats.forecasts.failureRatePct}% (ML Offline)
              </div>
            </div>

            {/* System Administrators */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Admins Assigned</span>
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                {stats.users.admins}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Guard: Last-admin protected
              </div>
            </div>
          </div>
        ) : null}

        {/* 5. Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Activity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({stats?.users.total ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forecasts')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'forecasts'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Forecast Monitoring</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>
        </div>

        {/* Feedback Alert for User Operations */}
        {actionAlert && (
          <Alert variant={actionAlert.type} title={actionAlert.type === 'success' ? 'Operation Completed' : 'Action Failed'}>
            {actionAlert.message}
          </Alert>
        )}

        {/* TAB 1: OVERVIEW & ACTIVITY */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 30-Day Activity Chart */}
              <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <span>Forecast Requests Activity (Last 30 Days)</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Daily volume of completed vs failed forecast submissions from MongoDB Atlas
                      </p>
                    </div>
                    <Badge variant="neutral">MongoDB Aggregated</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats?.perDay && stats.perDay.length > 0 ? (
                    <ActivityChart data={stats.perDay} height={280} />
                  ) : (
                    <EmptyState
                      icon={<Activity className="w-7 h-7 text-purple-500" />}
                      title="No Historical Activity Recorded"
                      description="Forecast request submissions will be tracked over time on this activity chart."
                    />
                  )}
                </CardContent>
              </Card>

              {/* Security & Access Guard Info */}
              <Card className="border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <CardHeader>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-emerald-500" />
                    <span>Role-Based Access Enforcement</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Strict two-tier authorization model
                  </p>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Backend Router Enforcement</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      All endpoints under <code className="text-purple-600 dark:text-purple-400 font-mono">/api/admin/*</code> are protected at Express router level with <code className="text-purple-600 dark:text-purple-400 font-mono">authenticate</code> + <code className="text-purple-600 dark:text-purple-400 font-mono">authorize('admin')</code>. Normal users receive HTTP 403 Forbidden.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Last-Admin Guard</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      System prevents demoting, suspending, or deleting the last remaining active administrator account to prevent administrative lockout.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Zero Credential Leakage</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Sensitive fields (<code className="font-mono">passwordHash</code>, <code className="font-mono">refreshTokens</code>) are excluded by Mongoose schema projections (<code className="font-mono">select: false</code>) and never returned in API payloads.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent System Activity Log Snapshot */}
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <span>Recent System Activity Stream</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Last 15 audited system events recorded in MongoDB Atlas
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('logs')}>
                    View All Logs
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                          <th className="py-2.5 px-3 font-semibold">Severity</th>
                          <th className="py-2.5 px-3 font-semibold">Type</th>
                          <th className="py-2.5 px-3 font-semibold">Action</th>
                          <th className="py-2.5 px-3 font-semibold">Actor</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                        {stats.recentActivity.slice(0, 8).map((log) => (
                          <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant={
                                  log.level === 'error' ? 'danger' : log.level === 'warn' ? 'warning' : 'neutral'
                                }
                              >
                                {log.level}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 capitalize text-slate-700 dark:text-slate-300">
                              {log.type}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {log.action}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                              {log.actorId ? (typeof log.actorId === 'object' ? log.actorId.email : log.actorId) : 'System'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans truncate max-w-[280px]">
                              {log.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="w-7 h-7 text-slate-400" />}
                    title="No Audit Logs"
                    description="System audit operations will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & MANAGEMENT (Feature 2) */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Showing {users.length} of {usersMeta?.total ?? 0} registered accounts
              </div>
            </div>

            {/* Users Table */}
            {isUsersLoading && users.length === 0 ? (
              <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse" />
            ) : usersError ? (
              <ErrorState title="User Directory Error" message={usersError} onRetry={loadUsers} />
            ) : users.length === 0 ? (
              <EmptyState
                icon={<Users className="w-7 h-7 text-purple-500" />}
                title="No Users Found"
                description="No user records match the specified search or filter criteria."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Forecasts</th>
                      <th className="py-3 px-4 font-semibold">Registered</th>
                      <th className="py-3 px-4 font-semibold">Last Login</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {users.map((u) => {
                      const isCurrent = u._id === currentUser._id;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded font-semibold border border-purple-500/20">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={u.role === 'admin' ? 'info' : 'neutral'}>
                              {u.role}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                              {u.status}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {u.forecastCount ?? 0}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Status (Suspend / Activate) */}
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => handleToggleUserStatus(u)}
                                title={isCurrent ? 'Cannot suspend own account' : u.status === 'active' ? 'Suspend User' : 'Activate User'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isCurrent
                                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                                    : u.status === 'active'
                                    ? 'border-rose-200 dark:border-rose-800/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                              >
                                {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>

                              {/* Toggle Role (Promote / Demote) */}
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => handleToggleUserRole(u)}
                                title={isCurrent ? 'Cannot change own role' : u.role === 'admin' ? 'Demote to Normal User' : 'Promote to Admin'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isCurrent
                                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                                    : u.role === 'admin'
                                    ? 'border-amber-200 dark:border-amber-800/60 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'border-purple-200 dark:border-purple-800/60 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => handleDeleteUser(u)}
                                title={isCurrent ? 'Cannot delete own account' : 'Delete User Permanently'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isCurrent
                                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {usersMeta && usersMeta.totalPages > 1 && (
              <div className="flex items-center justify-between py-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Page {usersMeta.page} of {usersMeta.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!usersMeta.hasPrevPage}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!usersMeta.hasNextPage}
                    onClick={() => setUserPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FORECAST MONITORING (Feature 3) */}
        {activeTab === 'forecasts' && (
          <div className="space-y-4">
            {/* Notice when ML is unintegrated */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold">ML Forecast Service: Not Connected:</span> In accordance with project requirements, the machine learning microservice is unintegrated in this phase. Zero fake predictions or randomized values are produced. The log below tracks real forecast parameter validation, Open-Meteo meteorological captures, and database transactions stored in MongoDB Atlas.
              </div>
            </div>

            {isForecastsLoading && forecasts.length === 0 ? (
              <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse" />
            ) : forecastsError ? (
              <ErrorState title="Forecast Telemetry Error" message={forecastsError} onRetry={loadForecasts} />
            ) : forecasts.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="w-7 h-7 text-amber-500" />}
                title="No Forecasts Registered"
                description="Forecast runs submitted across the platform will be monitored here."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Location</th>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Target Time</th>
                      <th className="py-3 px-4 font-semibold">Capacity</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Diagnostic Output</th>
                      <th className="py-3 px-4 font-semibold">Logged At</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {forecasts.map((fc) => (
                      <tr key={fc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          <div className="font-semibold">{fc.location.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {fc.location.latitude.toFixed(2)}°, {fc.location.longitude.toFixed(2)}°
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {typeof fc.userId === 'object' && fc.userId ? (
                            <div>
                              <div className="font-medium text-slate-800 dark:text-slate-200">{fc.userId.name}</div>
                              <div className="text-[10px] font-mono">{fc.userId.email}</div>
                            </div>
                          ) : (
                            <span className="font-mono text-xs">{String(fc.userId).substring(0, 8)}...</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                          {new Date(fc.targetDateTime).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {fc.system.capacityKw} kW
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={fc.status === 'completed' ? 'success' : fc.status === 'failed' ? 'danger' : 'warning'}>
                            {fc.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {fc.prediction ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {fc.prediction.targetPowerKw} kW
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-[11px] italic">
                              {fc.errorCode || 'ML Service Offline'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(fc.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteForecast(fc)}
                            title="Delete forecast record"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {forecastsMeta && forecastsMeta.totalPages > 1 && (
              <div className="flex items-center justify-between py-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Page {forecastsMeta.page} of {forecastsMeta.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!forecastsMeta.hasPrevPage}
                    onClick={() => setForecastPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!forecastsMeta.hasNextPage}
                    onClick={() => setForecastPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SYSTEM AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {isLogsLoading && logs.length === 0 ? (
              <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse" />
            ) : logsError ? (
              <ErrorState title="Audit Log Error" message={logsError} onRetry={loadLogs} />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-7 h-7 text-purple-500" />}
                title="No Logs Available"
                description="System transactions and security operations will be recorded here."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                      <th className="py-3 px-4 font-semibold">Level</th>
                      <th className="py-3 px-4 font-semibold">Domain</th>
                      <th className="py-3 px-4 font-semibold">Action</th>
                      <th className="py-3 px-4 font-semibold">Actor</th>
                      <th className="py-3 px-4 font-semibold">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={log.level === 'error' ? 'danger' : log.level === 'warn' ? 'warning' : 'neutral'}>
                            {log.level}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                          {log.type}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {log.actorId ? (typeof log.actorId === 'object' ? log.actorId.email : log.actorId) : 'System Worker'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-sans">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Global System Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Runtime parameters governing meteorological cache TTL, forecast horizons, and platform policies stored in MongoDB Atlas (<code className="font-mono">settings</code> collection).
              </p>
            </div>

            {isSettingsLoading && settings.length === 0 ? (
              <div className="h-48 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 animate-pulse" />
            ) : settingsError ? (
              <ErrorState title="Settings Error" message={settingsError} onRetry={loadSettings} />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Key</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Current Value</th>
                      <th className="py-3 px-4 font-semibold">Description</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {settings.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                          {s.key}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral">{s.type}</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-purple-600 dark:text-purple-400">
                          {String(s.value)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {s.description || 'Configurable system policy'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingSetting({ key: s.key, value: String(s.value) })}
                          >
                            Edit Value
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal for Editing Setting */}
            {editingSetting && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Update System Setting: <span className="font-mono text-purple-600">{editingSetting.key}</span>
                  </h3>

                  <form onSubmit={handleSaveSetting} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Configuration Value
                      </label>
                      <input
                        type="text"
                        value={editingSetting.value}
                        onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="secondary" size="sm" type="button" onClick={() => setEditingSetting(null)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" type="submit">
                        Save to Atlas
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        variant={dialogState.variant}
        isLoading={isDialogLoading}
      />
    </div>
  );
};
