import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCircle, TrendingUp, CheckSquare,
  Calendar, Bell, BarChart3, Settings, Shield, X, Menu,
  ChevronDown, Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'executive'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'manager', 'executive'] },
  { path: '/customers', label: 'Customers', icon: Building2, roles: ['admin', 'manager', 'executive'] },
  { path: '/pipeline', label: 'Pipeline', icon: TrendingUp, roles: ['admin', 'manager', 'executive'] },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'manager', 'executive'] },
  { path: '/followups', label: 'Follow-ups', icon: Calendar, roles: ['admin', 'manager', 'executive'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'executive'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { path: '/team', label: 'Team', icon: UserCircle, roles: ['admin', 'manager'] },
  { path: '/audit', label: 'Audit Logs', icon: Shield, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'executive'));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CRM</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">CRM Pro</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-dark-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-dark-300 dark:hover:bg-dark-700'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
