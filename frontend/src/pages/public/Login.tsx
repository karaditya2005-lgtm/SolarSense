import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, ShieldCheck, Zap, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.ts';
import { Input } from '../../components/ui/Input.tsx';
import { PasswordInput } from '../../components/ui/PasswordInput.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { Logo } from '../../components/ui/Logo.tsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.tsx';
import { SolarPanelBackdrop } from '../../components/graphics/SolarPanelBackdrop.tsx';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState<string | null>(null);

  // Check if routed with a success notification (e.g. from Register)
  const incomingSuccess = (location.state as { successMessage?: string })?.successMessage;
  const returnPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      await login(data.email, data.password);
      navigate(returnPath, { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid email or password.');
      setServerError(msg);

      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, fieldMsg]) => {
        if (field in data) {
          setError(field as keyof LoginFormData, { message: fieldMsg });
        }
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Left side: Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-12 z-10">
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between mb-12">
            <Logo size="md" />
            <ThemeToggle />
          </div>

          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
              Sign in to manage your solar power forecasts and historical predictions.
            </p>

            {incomingSuccess && (
              <Alert variant="success" className="mb-6">
                {incomingSuccess}
              </Alert>
            )}

            {serverError && (
              <Alert variant="error" className="mb-6" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="analyst@domain.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register('email')}
              />

              <PasswordInput
                label="Password"
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                disabled={isSubmitting}
                {...register('password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-600 dark:text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
                Create an account
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 pt-8">
          Protected by role-based access control & token encryption.
        </div>
      </div>

      {/* Right side: Split-Screen Solar Scene (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <SolarPanelBackdrop imageSrc="/images/panels-sky.jpg" className="w-full h-full flex flex-col justify-end p-16">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
              Precision Irradiance Modeling & Machine Learning
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
              Seamlessly connect live numerical weather simulations with trained regression estimators
              to anticipate photovoltaic generation curves with confidence.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-800 dark:text-slate-300">
              <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl backdrop-blur-sm shadow-sm dark:shadow-none">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Mock Data</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl backdrop-blur-sm shadow-sm dark:shadow-none">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Strict JWT Privacy</span>
              </div>
            </div>
          </div>
        </SolarPanelBackdrop>
      </div>
    </div>
  );
};
