import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { formatDateTime } from '../utils/helpers';
import type { AuditLog } from '../types';

const Audit: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { page, search, entity }],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (search) params.action = search;
      if (entity) params.entity = entity;
      return (await api.get('/audit', { params })).data;
    },
  });

  const logs: AuditLog[] = data?.data || [];

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('created')) return 'success';
    if (action.toLowerCase().includes('deleted')) return 'danger';
    if (action.toLowerCase().includes('login')) return 'info';
    if (action.toLowerCase().includes('role')) return 'warning';
    return 'gray';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Track all important actions in the system</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2">
          <Shield className="w-4 h-4" />
          <span>{data?.pagination?.total || 0} events logged</span>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by action..." className="input-field pl-10" />
          </div>
          <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="input-field sm:w-44">
            <option value="">All Entities</option>
            {['Lead', 'Customer', 'Opportunity', 'Task', 'FollowUp', 'User', 'Auth'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs found" description="Actions will appear here as they happen." />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-900">
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-xs">{formatDateTime(log.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600 dark:text-dark-300">
                              {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="text-sm">{log.user?.name || 'System'}</span>
                        </div>
                      </td>
                      <td><Badge color={getActionColor(log.action)}>{log.action}</Badge></td>
                      <td><span className="text-xs font-medium text-gray-500">{log.entity}</span></td>
                      <td className="text-xs max-w-md truncate">{log.description}</td>
                      <td className="text-xs text-gray-400">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Audit;
