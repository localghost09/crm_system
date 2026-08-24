import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NotFound: React.FC = () => {
  const { user } = useAuth();
  const homePath = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-dark-950 bg-mesh dark:bg-mesh-dark p-6">
      <div className="text-center animate-scale-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-white dark:bg-dark-800 border border-surface-200 dark:border-dark-700 shadow-card flex items-center justify-center">
          <Compass className="w-8 h-8 text-primary-500" />
        </div>

        <p className="mt-8 font-display text-[90px] leading-none font-bold tracking-tight bg-gradient-to-b from-primary-500 to-primary-700 bg-clip-text text-transparent select-none">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-surface-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-3 max-w-sm mx-auto text-sm text-surface-500 dark:text-dark-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Check the
          address, or head back to your dashboard.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={homePath} className="btn-primary">
            <Home className="w-4 h-4" /> Back to {user ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
