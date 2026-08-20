import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, TrendingUp, Users, Target } from 'lucide-react';

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
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-900">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">CRM Pro</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Run your entire sales
            <br />
            operation from one place
          </h1>
          <p className="text-primary-100 text-lg">
            Manage leads, customers, deals, and your team — all in a beautiful, modern interface.
          </p>

          <div className="space-y-4 pt-6">
            {[
              { icon: Users, text: 'Track every lead and customer interaction' },
              { icon: Target, text: 'Visual sales pipeline with drag-and-drop' },
              { icon: TrendingUp, text: 'Real-time analytics and revenue insights' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-primary-50">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-200 text-sm">© 2026 CRM Pro. Enterprise-grade customer management.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2 justify-center">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">CRM Pro</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-400">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="you@company.com"
                    className="input-field pl-10"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Enter your password"
                    className="input-field pl-10"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-600 dark:text-dark-300 text-center">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
