import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, ArrowRight, ShieldCheck, Sun, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.ts';
import { Input } from '../../components/ui/Input.tsx';
import { PasswordInput } from '../../components/ui/PasswordInput.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { Logo } from '../../components/ui/Logo.tsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.tsx';
import { SolarPanelBackdrop } from '../../components/graphics/SolarPanelBackdrop.tsx';

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      await registerUser(data.name, data.email, data.password);
      // Redirect to login with success message as mandated by PRD
      navigate('/login', {
        replace: true,
        state: {
          successMessage: 'Account created successfully! Please sign in with your credentials.',
        },
      });
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to create your account. Please try again.');
      setServerError(msg);

      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, fieldMsg]) => {
        if (field in data) {
          setError(field as keyof RegisterFormData, { message: fieldMsg });
        }
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Left Column: Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-12 z-10">
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between mb-8">
            <Logo size="md" />
            <ThemeToggle />
          </div>

          <div className="max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Create an Account
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Join SolarSense to run custom solar forecasts, archive predictions, and analyze generation curves.
            </p>

            {serverError && (
              <Alert variant="error" className="mb-6" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                id="name"
                autoComplete="name"
                placeholder="Jane Doe"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.name?.message}
                disabled={isSubmitting}
                {...register('name')}
              />

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
                autoComplete="new-password"
                placeholder="At least 8 chars, 1 letter, 1 number"
                helperText="Min 8 chars with letters & numbers"
                error={errors.password?.message}
                disabled={isSubmitting}
                {...register('password')}
              />

              <PasswordInput
                label="Confirm Password"
                id="confirm-password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
                {...register('confirmPassword')}
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
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
                Sign in here
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-[11px] text-slate-500 pt-8">
          By registering, you agree to our fair usage and scientific attribution standards.
        </div>
      </div>

      {/* Right Column: Split-Screen Solar Scene (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <SolarPanelBackdrop imageSrc="/images/weather-station.jpg" className="w-full h-full flex flex-col justify-end p-16">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
              Scientific Photovoltaic Forecasts at Your Fingertips
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
              Calibrate system capacity, tilt, and azimuth to simulate generation for your specific
              installation with live weather modeling.
            </p>
            <div className="space-y-3 text-xs text-slate-800 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>24-hour diurnal generation curves & peak kW predictions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Export predictions to standard CSV and JSON formats</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Secure in-memory authentication & password hashing</span>
              </div>
            </div>
          </div>
        </SolarPanelBackdrop>
      </div>
    </div>
  );
};
