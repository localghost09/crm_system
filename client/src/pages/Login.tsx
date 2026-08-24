import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, Sparkles, Users, Target, TrendingUp, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex bg-surface-50 dark:bg-dark-950">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden text-white flex-col justify-between p-12">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.25),transparent_50%)]" />
        {/* Decorative orbs */}
        <div className="absolute top-20 right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl animate-float" />
        <div className="absolute bottom-32 left-10 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-display font-bold tracking-tight">CRM Pro</span>
            <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest -mt-0.5">Enterprise</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight">
              Run your entire sales
              <br />
              <span className="text-white/90">operation from one place</span>
            </h1>
            <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-md">
              Manage leads, customers, deals, and your team — all in a beautiful, modern interface.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { icon: Users, text: 'Track every lead and customer interaction' },
              { icon: Target, text: 'Visual sales pipeline with drag-and-drop' },
              { icon: TrendingUp, text: 'Real-time analytics and revenue insights' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/8 backdrop-blur-sm ring-1 ring-white/10"
              >
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-sm">© 2026 CRM Pro. Enterprise-grade customer management.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="pointer-events-none absolute inset-0 bg-mesh dark:bg-mesh-dark opacity-60" aria-hidden />

        <div className="relative w-full max-w-[420px] animate-slide-up">
          <div className="mb-8 lg:hidden flex items-center gap-2.5 justify-center">
            <div className="w-10 h-10 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-surface-900 dark:text-white">CRM Pro</span>
          </div>

          <div className="card p-8 sm:p-9 shadow-elevated">
            <div className="mb-7">
              <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
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
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="you@company.com"
                    className="input-field pl-11"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label-field">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Enter your password"
                    className="input-field pl-11"
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
