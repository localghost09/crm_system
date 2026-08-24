import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Moon, Sun, LogOut, User as UserIcon, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/customers': 'Customers',
  '/pipeline': 'Pipeline',
  '/tasks': 'Tasks',
  '/followups': 'Follow-ups',
  '/notifications': 'Notifications',
  '/reports': 'Reports',
  '/team': 'Team',
  '/audit': 'Audit Logs',
  '/settings': 'Settings',
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentPage = pageTitles[location.pathname] || 'CRM Pro';

  return (
    <header className="sticky top-0 z-30 h-16 flex-shrink-0 glass border-b border-surface-200/60 dark:border-dark-800/80">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden btn-icon"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-surface-400 dark:text-dark-500 font-medium">CRM Pro</span>
            <ChevronRight className="w-3.5 h-3.5 text-surface-300 dark:text-dark-600 flex-shrink-0" />
            <span className="font-semibold text-surface-800 dark:text-dark-100 truncate">
              {currentPage}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search hint */}
          <button
            onClick={() => navigate('/leads')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl
              bg-surface-100/80 dark:bg-dark-800/80 border border-surface-200/60 dark:border-dark-700
              text-surface-400 dark:text-dark-500 text-sm hover:border-surface-300
              dark:hover:border-dark-600 transition-colors w-52"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-dark-700 border border-surface-200 dark:border-dark-600 text-surface-400">
              /
            </kbd>
          </button>

          <button
            onClick={toggleDarkMode}
            className="btn-icon"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="btn-icon relative"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white dark:ring-dark-900" />
          </button>

          <div className="w-px h-6 bg-surface-200 dark:bg-dark-700 mx-1 hidden sm:block" />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 pr-2 rounded-xl
                hover:bg-surface-100 dark:hover:bg-dark-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">
                  {user?.name}
                </p>
                <p className="text-[11px] text-surface-500 dark:text-dark-400 capitalize leading-tight">
                  {user?.role}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-dark-800 rounded-2xl shadow-elevated border border-surface-200 dark:border-dark-700 z-20 py-1.5 animate-scale-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-100 dark:border-dark-700">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-surface-700 dark:text-dark-200 rounded-xl hover:bg-surface-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-surface-400" />
                      <span>Profile & Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
