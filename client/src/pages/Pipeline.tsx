import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, DollarSign, Calendar, User as UserIcon, GripVertical, Search } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import EmptyState from '../components/common/EmptyState';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers';
import type { Opportunity, User, Customer, Lead } from '../types';

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const STAGE_STYLES: Record<string, { header: string; dot: string; badge: string }> = {
  'New Lead': { header: 'text-surface-700 dark:text-dark-200', dot: 'bg-surface-400', badge: 'gray' },
  'Contacted': { header: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', badge: 'info' },
  'Qualified': { header: 'text-primary-700 dark:text-primary-300', dot: 'bg-primary-500', badge: 'primary' },
  'Proposal Sent': { header: 'text-primary-700 dark:text-primary-300', dot: 'bg-primary-500', badge: 'primary' },
  'Negotiation': { header: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', badge: 'warning' },
  'Won': { header: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', badge: 'success' },
  'Lost': { header: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', badge: 'danger' },
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
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [expanded, setExpanded] = useState<Opportunity | null>(null);

  // Deep-link support: /pipeline?search=foo (used by the global search box)
  const urlSearch = searchParams.get('search');
  useEffect(() => {
    if (urlSearch !== null) setSearch(urlSearch);
  }, [urlSearch]);

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
  const labelCls = 'label-field';

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
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
          <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Pipeline Value</p>
          <p className="text-lg font-semibold text-surface-900 dark:text-white mt-1">
            {formatCurrency(Object.values(stageTotals).reduce((a, b) => a + b, 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Open Deals</p>
          <p className="text-lg font-semibold text-surface-900 dark:text-white mt-1">
            {opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Won</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{stageCounts['Won'] || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Lost</p>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400 mt-1">{stageCounts['Lost'] || 0}</p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stage === stage);
          const style = STAGE_STYLES[stage];
          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-[280px] rounded transition-colors duration-100 border ${
                dragOver === stage
                  ? 'bg-primary-50/80 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600 ring-1 ring-primary-400/40'
                  : 'bg-surface-100/60 dark:bg-dark-900/60 border-surface-200/60 dark:border-dark-800'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(stage)}
            >
              <div className={`px-3.5 py-3 flex items-center justify-between ${style.header}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-sm font-semibold">{stage}</span>
                </div>
                <span className="text-[11px] font-semibold bg-white dark:bg-dark-800 text-surface-600 dark:text-dark-300 px-2 py-0.5 rounded-lg shadow-soft">
                  {stageOpps.length}
                </span>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {stageOpps.map((opp) => (
                  <div
                    key={opp._id}
                    draggable
                    onDragStart={() => setDragging(opp)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setExpanded(expanded?._id === opp._id ? null : opp)}
                    className="bg-white dark:bg-dark-800 rounded shadow-soft border border-surface-200 dark:border-dark-700 p-3.5 cursor-grab active:cursor-grabbing hover:border-surface-300 dark:hover:border-dark-600 transition-colors duration-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white line-clamp-2 leading-snug">{opp.title}</p>
                      <GripVertical className="w-4 h-4 text-surface-300 dark:text-dark-600 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-surface-500 dark:text-dark-400 mt-1.5 truncate">
                      {opp.customer?.name || opp.lead?.name || 'No customer'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-surface-900 dark:text-white">{formatCurrency(opp.expectedValue)}</span>
                      <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-1.5 py-0.5 rounded-md">{opp.probability}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 text-[11px] text-surface-400 dark:text-dark-500">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {opp.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(opp.expectedClosingDate)}
                      </span>
                    </div>

                    {expanded?._id === opp._id && (
                      <div className="mt-3 pt-3 border-t border-surface-200 dark:border-dark-700 space-y-2 animate-fade-in">
                        <div className="flex gap-2 items-center">
                          <Badge color={stage === 'Won' ? 'success' : stage === 'Lost' ? 'danger' : 'info'}>{opp.stage}</Badge>
                          <span className="text-[11px] text-surface-500 dark:text-dark-400">Created {formatDate(opp.createdAt)}</span>
                        </div>
                        {opp.lostReason && (
                          <p className="text-xs text-red-600 dark:text-red-400">Lost reason: {opp.lostReason}</p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(opp); }}
                          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Edit deal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {stageOpps.length === 0 && (
                  <div className="border-2 border-dashed border-surface-200 dark:border-dark-700 rounded py-8 text-center">
                    <p className="text-xs text-surface-400 dark:text-dark-500">Drop deals here</p>
                  </div>
                )}
              </div>
              <div className="px-3.5 py-2.5 text-[11px] font-medium text-surface-400 dark:text-dark-500 border-t border-surface-200/60 dark:border-dark-800">
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
            <Select
              value={form.customer}
              onChange={(v) => setForm({ ...form, customer: v })}
              options={[{ value: '', label: '—' }, ...(customersQuery.data || []).map((c) => ({ value: c._id, label: c.name }))]}
            />
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
            <label className={labelCls}>Stage</label>
            <Select value={form.stage} onChange={(v) => setForm({ ...form, stage: v })} options={STAGES} />
          </div>
          <div>
            <label className={labelCls}>Assigned To</label>
            <Select
              value={form.assignedTo}
              onChange={(v) => setForm({ ...form, assignedTo: v })}
              options={[{ value: '', label: 'Unassigned' }, ...(usersQuery.data || []).map((u) => ({ value: u._id, label: u.name }))]}
            />
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
            <DatePicker value={form.expectedClosingDate} onChange={(v) => setForm({ ...form, expectedClosingDate: v })} placeholder="Select closing date" />
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
