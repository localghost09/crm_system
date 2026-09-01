import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCircle, TrendingUp, CheckSquare,
  Calendar, Bell, BarChart3, Settings, Shield, X, Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const mainNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'executive'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'manager', 'executive'] },
  { path: '/customers', label: 'Customers', icon: Building2, roles: ['admin', 'manager', 'executive'] },
  { path: '/pipeline', label: 'Pipeline', icon: TrendingUp, roles: ['admin', 'manager', 'executive'] },
];

const workNav = [
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'executive'] },
  { path: '/followups', label: 'Follow-ups', icon: Calendar, roles: ['admin', 'manager', 'executive'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'executive'] },
];

const adminNav = [
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { path: '/team', label: 'Team', icon: UserCircle, roles: ['admin', 'manager'] },
  { path: '/audit', label: 'Audit Logs', icon: Shield, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const NavSection: React.FC<{
  label?: string;
  items: typeof mainNav;
  role: string;
  onClose: () => void;
}> = ({ label, items, role, onClose }) => {
  const filtered = items.filter((item) => item.roles.includes(role));
  if (filtered.length === 0) return null;

  return (
    <div className="mb-4">
      {label && <p className="section-label">{label}</p>}
      <div className="space-y-0.5">
        {filtered.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500" />
                )}
                <item.icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:text-dark-500 dark:group-hover:text-dark-300'
                  }`}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'executive';

  return (
    <>
      {open && (
        <div className="overlay z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[236px]
          bg-white dark:bg-dark-900 border-r border-surface-200 dark:border-dark-800
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-[52px] border-b border-surface-200 dark:border-dark-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-primary-600 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white">C</span>
            </div>
            <span className="font-semibold text-sm text-surface-800 dark:text-white">
              CRM Pro
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden btn-icon"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <NavSection items={mainNav} role={role} onClose={onClose} label="Main" />
          <NavSection items={workNav} role={role} onClose={onClose} label="Workspace" />
          <NavSection items={adminNav} role={role} onClose={onClose} label="Manage" />
        </nav>

        {/* User footer */}
        <div className="p-2 border-t border-surface-200 dark:border-dark-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded bg-transparent">
            <div className="w-8 h-8 rounded bg-surface-200 text-surface-700 dark:bg-dark-700 dark:text-dark-100 flex items-center justify-center">
              <span className="text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-surface-500 dark:text-dark-400 capitalize truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
