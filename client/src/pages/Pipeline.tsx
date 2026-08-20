import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, DollarSign, Calendar, User as UserIcon, GripVertical, Search } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers';
import type { Opportunity, User, Customer, Lead } from '../types';

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const STAGE_STYLES: Record<string, { header: string; badge: string }> = {
  'New Lead': { header: 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300', badge: 'gray' },
  'Contacted': { header: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300', badge: 'info' },
  'Qualified': { header: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300', badge: 'primary' },
  'Proposal Sent': { header: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300', badge: 'primary' },
  'Negotiation': { header: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', badge: 'warning' },
  'Won': { header: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', badge: 'success' },
  'Lost': { header: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', badge: 'danger' },
};

interface OppForm {
  title: string;
  customer: string;
  lead: string;
  assignedTo: string;
  stage: string;
  expectedValue: number;
  probability: number;
  expectedClosingDate: string;
}

const emptyForm: OppForm = {
  title: '', customer: '', lead: '', assignedTo: '', stage: 'New Lead',
  expectedValue: 0, probability: 10, expectedClosingDate: '',
};

const Pipeline: React.FC = () => {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [form, setForm] = useState<OppForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Opportunity | null>(null);

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ['opportunities', 'pipeline'],
    queryFn: async () => (await api.get('/dashboard/pipeline')).data.data,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'assign'],
    queryFn: async () => (await api.get('/users', { params: { limit: 100 } })).data.data as User[],
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/customers', { params: { limit: 100 } })).data.data as Customer[],
  });

  const leadsQuery = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: async () => (await api.get('/leads', { params: { limit: 100 } })).data.data as Lead[],
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) =>
      (await api.patch(`/opportunities/${id}/stage`, { stage })).data,
    onSuccess: () => {
      toast.success('Deal moved');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: async (data: OppForm) => (await api.post('/opportunities', data)).data,
    onSuccess: () => {
      toast.success('Opportunity created');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OppForm> }) =>
      (await api.patch(`/opportunities/${id}`, data)).data,
    onSuccess: () => {
      toast.success('Opportunity updated');
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const opportunities: Opportunity[] = (pipelineData?.opportunities || []).filter((o: Opportunity) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.title.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q);
  });

  const handleDrop = (stage: string) => {
    setDragOver(null);
    if (dragging && dragging.stage !== stage) {
      updateStageMutation.mutate({ id: dragging._id, stage });
    }
    setDragging(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (opp: Opportunity) => {
    setEditing(opp);
    setExpanded(null);
    setForm({
      title: opp.title,
      customer: opp.customer?._id || '',
      lead: opp.lead?._id || '',
      assignedTo: opp.assignedTo?._id || '',
      stage: opp.stage,
      expectedValue: opp.expectedValue,
      probability: opp.probability,
      expectedClosingDate: opp.expectedClosingDate ? opp.expectedClosingDate.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (!form.expectedClosingDate) delete payload.expectedClosingDate;
    if (editing) updateMutation.mutate({ id: editing._id, data: payload });
    else createMutation.mutate(payload);
  };

  const inputCls = 'input-field';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5';

  if (isLoading) return <PageSkeleton />;

  const stageCounts: Record<string, number> = {};
  opportunities.forEach((o) => { stageCounts[o.stage] = (stageCounts[o.stage] || 0) + 1; });

  const stageTotals: Record<string, number> = {};
  opportunities.forEach((o) => {
    if (o.stage !== 'Won' && o.stage !== 'Lost') {
      stageTotals[o.stage] = (stageTotals[o.stage] || 0) + o.expectedValue;
    }
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p className="page-subtitle">Drag deals between stages to update the pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deals..." className="input-field pl-10 w-64" />
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-1" /> New Deal
          </button>
        </div>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-dark-400">Pipeline Value</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(Object.values(stageTotals).reduce((a, b) => a + b, 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-dark-400">Open Deals</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-dark-400">Won</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{stageCounts['Won'] || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-dark-400">Lost</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{stageCounts['Lost'] || 0}</p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stage === stage);
          const style = STAGE_STYLES[stage];
          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-72 rounded-xl transition-colors ${
                dragOver === stage ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400' : 'bg-gray-100/70 dark:bg-dark-800'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(stage)}
            >
              <div className={`p-3 rounded-t-xl flex items-center justify-between ${style.header}`}>
                <span className="text-sm font-semibold">{stage}</span>
                <span className="text-xs font-bold bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
                  {stageOpps.length}
                </span>
              </div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {stageOpps.map((opp) => (
                  <div
                    key={opp._id}
                    draggable
                    onDragStart={() => setDragging(opp)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setExpanded(expanded?._id === opp._id ? null : opp)}
                    className="bg-white dark:bg-dark-700 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{opp.title}</p>
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1 truncate">
                      {opp.customer?.name || opp.lead?.name || 'No customer'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(opp.expectedValue)}</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-dark-400">{opp.probability}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400 dark:text-dark-500">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {opp.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(opp.expectedClosingDate)}
                      </span>
                    </div>

                    {expanded?._id === opp._id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-600 space-y-2 animate-fade-in">
                        <div className="flex gap-2">
                          <Badge color={stage === 'Won' ? 'success' : stage === 'Lost' ? 'danger' : 'info'}>{opp.stage}</Badge>
                          <span className="text-xs text-gray-500 dark:text-dark-400">Created {formatDate(opp.createdAt)}</span>
                        </div>
                        {opp.lostReason && (
                          <p className="text-xs text-red-600 dark:text-red-400">Lost reason: {opp.lostReason}</p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(opp); }}
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Edit deal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {stageOpps.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-dark-500 text-center py-6">Drop deals here</p>
                )}
              </div>
              <div className="p-2 text-xs text-gray-400 dark:text-dark-500 border-t border-gray-200 dark:border-dark-700">
                {stage !== 'Won' && stage !== 'Lost' ? `${formatCurrency(stageTotals[stage] || 0)} total` : `${stageOpps.length} deals`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Deal' : 'New Deal'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Customer</label>
            <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={inputCls}>
              <option value="">—</option>
              {customersQuery.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Lead</label>
            <select value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} className={inputCls}>
              <option value="">—</option>
              {leadsQuery.data?.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputCls}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assigned To</label>
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className={inputCls}>
              <option value="">Unassigned</option>
              {usersQuery.data?.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Expected Value ($)</label>
            <input type="number" min="0" value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Probability (%)</label>
            <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Expected Closing Date</label>
            <input type="date" value={form.expectedClosingDate} onChange={(e) => setForm({ ...form, expectedClosingDate: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update Deal' : 'Create Deal'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pipeline;
