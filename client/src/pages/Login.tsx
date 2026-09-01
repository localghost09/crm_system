import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, Users, Target, TrendingUp, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-100 dark:bg-dark-950">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden text-white flex-col justify-between p-10">
        <div className="absolute inset-0 bg-primary-900" />

        <div className="relative flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-white/15 flex items-center justify-center">
            <span className="text-xs font-semibold">C</span>
          </div>
          <span className="text-base font-semibold tracking-tight">CRM Pro</span>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-2xl font-semibold leading-snug max-w-sm">
              One place for your leads, customers and deals.
            </h1>
            <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-sm">
              Used daily by sales, support and management teams to keep every account moving.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { icon: Users, text: 'Track every lead and customer interaction' },
              { icon: Target, text: 'Visual sales pipeline with drag-and-drop' },
              { icon: TrendingUp, text: 'Real-time analytics and revenue insights' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-white/50 flex-shrink-0" strokeWidth={1.75} />
                <span className="text-sm text-white/80">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs">© 2026 CRM Pro</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="relative w-full max-w-[420px] animate-slide-up">
          <div className="mb-8 lg:hidden flex items-center gap-2.5 justify-center">
            <div className="w-7 h-7 rounded-sm bg-primary-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">C</span>
            </div>
            <span className="text-base font-semibold text-surface-900 dark:text-white">CRM Pro</span>
          </div>

          <div className="card p-6 sm:p-7">
            <div className="mb-7">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-surface-500 dark:text-dark-400">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label-field">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="you@company.com"
                    className="input-field pl-9"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label-field">Password</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Enter your password"
                    className="input-field pl-9"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-surface-100 dark:border-dark-800">
              <p className="text-sm text-surface-600 dark:text-dark-300 text-center">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline underline-offset-2">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Demo hint */}
          <p className="mt-6 text-center text-xs text-surface-400 dark:text-dark-500">
            Demo: admin@crm.com / Admin@123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
