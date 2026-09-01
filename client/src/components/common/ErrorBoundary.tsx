import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Root-level error boundary: if any page throws while rendering, the user
 * sees a friendly card instead of a completely blank white page.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI crashed — caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-dark-950 p-6">
        <div className="w-full max-w-md card p-6 text-center animate-scale-in">
          <div className="w-14 h-14 mx-auto rounded bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-surface-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-dark-400">
            An unexpected error occurred while rendering this page. Your data is safe — try reloading.
          </p>
          <p className="mt-3 text-xs text-surface-400 dark:text-dark-500 bg-surface-50 dark:bg-dark-800 rounded-lg px-3 py-2 truncate">
            {this.state.error.message}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary">
              <RefreshCw className="w-4 h-4" /> Reload page
            </button>
            <button onClick={() => { this.setState({ error: null }); window.location.href = '/dashboard'; }} className="btn-secondary">
              <Home className="w-4 h-4" /> Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
