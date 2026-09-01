import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell, UserPlus, CalendarClock, AlertTriangle, TrendingUp,
  RefreshCw, Users, CheckCheck, MessageSquare
} from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { timeAgo } from '../utils/helpers';
import type { Notification } from '../types';

const typeMeta: Record<string, { icon: any; color: string }> = {
  lead_assigned: { icon: UserPlus, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  follow_up_reminder: { icon: CalendarClock, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400' },
  task_overdue: { icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
  deal_status_change: { icon: TrendingUp, color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' },
  lead_conversion: { icon: RefreshCw, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' },
  customer_activity: { icon: Users, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' },
  task_assigned: { icon: CheckCheck, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400' },
};

const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications', { params: { limit: 50 } })).data.data,
  });

  const markAllRead = useMutation({
    mutationFn: async () => (await api.patch('/notifications/all/read')).data,
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.notifications || [];

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {data?.unreadCount || 0} unread • {notifications.length} total
          </p>
        </div>
        <button
          onClick={() => markAllRead.mutate()}
          disabled={!data?.unreadCount}
          className="btn-secondary"
        >
          <CheckCheck className="w-4 h-4 mr-1" /> Mark all as read
        </button>
      </div>

      <div className="card overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="divide-y divide-surface-50 dark:divide-dark-800">
            {notifications.map((n) => {
              const meta = typeMeta[n.type] || { icon: MessageSquare, color: 'bg-surface-100 text-surface-600 dark:bg-dark-700 dark:text-dark-300' };
              const Icon = meta.icon;
              return (
                <button
                  key={n._id}
                  onClick={() => !n.isRead && markRead.mutate(n._id)}
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors duration-100 hover:bg-surface-50 dark:hover:bg-dark-800/50 ${
                    !n.isRead ? 'bg-primary-50/40 dark:bg-primary-500/5' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{n.title}</p>
                      <span className="text-[11px] font-medium text-surface-400 dark:text-dark-500 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-dark-300 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
