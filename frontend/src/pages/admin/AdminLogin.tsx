import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, ShieldAlert, ArrowRight, Lock, Mail, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.ts';
import { Input } from '../../components/ui/Input.tsx';
import { PasswordInput } from '../../components/ui/PasswordInput.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { Logo } from '../../components/ui/Logo.tsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.tsx';

const adminLoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid administrator email address'),
  password: z.string().min(1, 'Administrator password is required'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export const AdminLogin: React.FC = () => {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState<string | null>(null);

  // If redirected with an explicit access denied error
  const locationError = (location.state as { error?: string })?.error;

  // If already authenticated as admin, proceed directly to Admin Dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setServerError(null);

    try {
      const loggedInUser = await login(data.email, data.password);

      if (loggedInUser.role !== 'admin') {
        // Immediately invalidate normal session from admin gateway
        await logout();
        setServerError(
          'Access Denied: Account lacks administrator privileges. Standard users must sign in through the primary user portal.'
        );
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Invalid administrator credentials. Access denied.');
      setServerError(msg);

      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, fieldMsg]) => {
        if (field in data) {
          setError(field as keyof AdminLoginFormData, { message: fieldMsg });
        }
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" linkTo="/" />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Gateway</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>User Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Center Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Security Badge Container */}
          <div className="relative mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 mb-4 ring-4 ring-purple-500/20">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Administrative Console
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with your designated system administrator credentials to access platform governance.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {locationError && (
              <Alert variant="warning" className="mb-6">
                {locationError}
              </Alert>
            )}

            {serverError && (
              <Alert variant="error" className="mb-6" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input
                label="Administrator ID / Email"
                type="email"
                placeholder="admin@solarsense.internal"
                leftIcon={<Mail className="w-4 h-4 text-purple-400" />}
                error={errors.email?.message}
                {...register('email')}
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />

              <PasswordInput
                label="Master Security Password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4 text-purple-400" />}
                error={errors.password?.message}
                {...register('password')}
                disabled={isSubmitting}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none shadow-lg shadow-purple-500/20 mt-2"
                isLoading={isSubmitting}
                size="lg"
                leftIcon={<Shield className="w-4 h-4" />}
              >
                {isSubmitting ? 'Verifying Credentials...' : 'Authenticate Admin Access'}
              </Button>
            </form>

            {/* Audit & Compliance Disclaimer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Restricted gateway. All authentication attempts and administrative operations are verified by MongoDB Atlas and audit-logged with timestamp and IP origin.
              </span>
            </div>
          </div>

          {/* Return link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to SolarSense Public Homepage</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        SolarSense Governance Infrastructure • MongoDB Atlas Secured
      </footer>
    </div>
  );
};
