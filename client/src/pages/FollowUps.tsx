import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Phone, Video, Mail, Users as UsersIcon, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { formatDateTime, getStatusColor, getErrorMessage } from '../utils/helpers';
import type { FollowUp, User, Lead, Customer, Opportunity } from '../types';

const STATUSES = ['Pending', 'Completed', 'Cancelled', 'Overdue'];

interface FollowUpForm {
  title: string;
  type: string;
  description: string;
  assignedTo: string;
  lead: string;
  customer: string;
  opportunity: string;
  followUpDate: string;
  status: string;
}

const emptyForm: FollowUpForm = {
  title: '', type: 'Follow-up', description: '', assignedTo: '', lead: '', customer: '', opportunity: '',
  followUpDate: '', status: 'Pending',
};

const typeIcons: Record<string, any> = {
  'Phone Call': Phone,
  'Meeting': UsersIcon,
  'Email': Mail,
  'Product Demo': Video,
  'Follow-up': UsersIcon,
};

const FollowUps: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [form, setForm] = useState<FollowUpForm>(emptyForm);

  const { data: followupsData, isLoading } = useQuery({
    queryKey: ['followups', { page, status }],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (status) params.status = status;
      return (await api.get('/followups', { params })).data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'assign'],
    queryFn: async () => (await api.get('/users', { params: { limit: 100 } })).data.data as User[],
  });
  const leadsQuery = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: async () => (await api.get('/leads', { params: { limit: 100 } })).data.data as Lead[],
  });
  const customersQuery = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/customers', { params: { limit: 100 } })).data.data as Customer[],
  });
  const oppsQuery = useQuery({
    queryKey: ['opportunities', 'all'],
    queryFn: async () => (await api.get('/opportunities', { params: { limit: 100 } })).data.data as Opportunity[],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FollowUpForm) => (await api.post('/followups', data)).data,
    onSuccess: () => {
      toast.success('Follow-up scheduled');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/followups/${id}`, data)).data,
    onSuccess: () => {
      toast.success('Follow-up updated');
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (fu: FollowUp) => {
    setEditing(fu);
    setForm({
      title: fu.title,
      type: fu.type || 'Follow-up',
      description: fu.description || '',
      assignedTo: fu.assignedTo?._id || '',
      lead: fu.lead?._id || '',
      customer: fu.customer?._id || '',
      opportunity: fu.opportunity?._id || '',
      followUpDate: fu.followUpDate ? fu.followUpDate.slice(0, 16) : '',
      status: fu.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  const inputCls = 'input-field';
  const labelCls = 'label-field';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">Never miss a follow-up again</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Schedule Follow-up
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search follow-ups..." className="input-field pl-10" />
          </div>
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUSES} placeholder="All Status" className="sm:w-44" />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton />
        ) : followupsData?.data?.length === 0 ? (
          <EmptyState
            title="No follow-ups scheduled"
            description="Schedule follow-ups for your leads and customers."
            action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Schedule Follow-up</button>}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-900">
                    <th>Follow-up</th>
                    <th>Contact</th>
                    <th>Assignee</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followupsData?.data?.map((fu: FollowUp) => (
                    <tr key={fu._id} className={fu.status === 'Overdue' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                      <td>
                        <p className="font-medium text-surface-900 dark:text-white">{fu.title}</p>
                        <p className="text-xs text-surface-500 dark:text-dark-400">
                          {fu.type || 'Follow-up'}{fu.description ? ' • ' + fu.description.substring(0, 50) : ''}
                        </p>
                      </td>
                      <td>{fu.customer?.name || fu.lead?.name || fu.opportunity?.title || '—'}</td>
                      <td>{fu.assignedTo?.name || <span className="text-surface-400">Unassigned</span>}</td>
                      <td>{formatDateTime(fu.followUpDate)}</td>
                      <td><Badge color={getStatusColor(fu.status)}>{fu.status}</Badge></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {fu.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => updateMutation.mutate({ id: fu._id, data: { status: 'Completed' } })}
                                className="p-1.5 rounded-xl text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Mark completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateMutation.mutate({ id: fu._id, data: { status: 'Cancelled' } })}
                                className="p-1.5 rounded-xl text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => openEdit(fu)} className="p-1.5 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                            <span className="text-xs font-medium">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {followupsData?.pagination && <Pagination pagination={followupsData.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Follow-up' : 'Schedule Follow-up'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={['Phone Call', 'Meeting', 'Email', 'Product Demo', 'Follow-up', 'Other']} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Assign To</label>
            <Select
              value={form.assignedTo}
              onChange={(v) => setForm({ ...form, assignedTo: v })}
              options={[{ value: '', label: 'Unassigned' }, ...(usersQuery.data || []).map((u) => ({ value: u._id, label: u.name }))]}
            />
          </div>
          <div>
            <label className={labelCls}>Date & Time *</label>
            <DatePicker value={form.followUpDate} onChange={(v) => setForm({ ...form, followUpDate: v })} withTime placeholder="Pick date & time" />
          </div>
          <div>
            <label className={labelCls}>Lead</label>
            <Select
              value={form.lead}
              onChange={(v) => setForm({ ...form, lead: v })}
              options={[{ value: '', label: '—' }, ...(leadsQuery.data || []).map((l) => ({ value: l._id, label: l.name }))]}
            />
          </div>
          <div>
            <label className={labelCls}>Customer</label>
            <Select
              value={form.customer}
              onChange={(v) => setForm({ ...form, customer: v })}
              options={[{ value: '', label: '—' }, ...(customersQuery.data || []).map((c) => ({ value: c._id, label: c.name }))]}
            />
          </div>
          <div>
            <label className={labelCls}>Opportunity</label>
            <Select
              value={form.opportunity}
              onChange={(v) => setForm({ ...form, opportunity: v })}
              options={[{ value: '', label: '—' }, ...(oppsQuery.data || []).map((o) => ({ value: o._id, label: o.title }))]}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Schedule'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FollowUps;
