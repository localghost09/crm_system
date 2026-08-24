import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, User as UserIcon, Sparkles, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase and number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-dark-950 p-6 relative">
      <div className="pointer-events-none absolute inset-0 bg-mesh dark:bg-mesh-dark" aria-hidden />

      <div className="relative w-full max-w-[420px] animate-slide-up">
        <div className="mb-8 flex items-center gap-2.5 justify-center">
          <div className="w-10 h-10 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-surface-900 dark:text-white">CRM Pro</span>
        </div>

        <div className="card p-8 sm:p-9 shadow-elevated">
          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-surface-500 dark:text-dark-400">
              Start managing your sales today
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label-field">Full name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" {...register('name')} placeholder="John Smith" className="input-field pl-11" />
              </div>
              {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label-field">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="email" {...register('email')} placeholder="you@company.com" className="input-field pl-11" />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="password" {...register('password')} placeholder="Min 8 characters" className="input-field pl-11" />
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label-field">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="password" {...register('confirmPassword')} placeholder="Repeat your password" className="input-field pl-11" />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-surface-100 dark:border-dark-800">
            <p className="text-sm text-surface-600 dark:text-dark-300 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
