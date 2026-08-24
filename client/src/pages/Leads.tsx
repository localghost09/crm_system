import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Eye, RefreshCw, UserPlus, FileOutput } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor, downloadCSV, getErrorMessage } from '../utils/helpers';
import type { Lead, User } from '../types';

const SOURCES = ['Website', 'Referral', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Cold Call', 'Email', 'Other'];
const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

interface LeadForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  industry: string;
  status: string;
  priority: string;
  estimatedValue: number;
  assignedTo: string;
  tags: string;
}

const emptyForm: LeadForm = {
  name: '', company: '', email: '', phone: '', source: 'Website',
  industry: '', status: 'New', priority: 'Medium', estimatedValue: 0,
  assignedTo: '', tags: '',
};

const Leads: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  // Deep-link support: /leads?search=foo (used by the global search box)
  const urlSearch = searchParams.get('search');
  useEffect(() => {
    if (urlSearch !== null) {
      setSearch(urlSearch);
      setPage(1);
    }
  }, [urlSearch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [duplicateWarning, setDuplicateWarning] = useState<Lead | null>(null);
  const [formError, setFormError] = useState('');
  const [interactionForm, setInteractionForm] = useState({ type: 'Phone Call', subject: '', description: '' });
  const [noteText, setNoteText] = useState('');

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/users', { params: { limit: 100 } })).data.data as User[],
    enabled: false, // lazy, fetch when needed
  });

  const { data: leadData, isLoading, isError, refetch } = useQuery({
    queryKey: ['leads', { page, status, source, priority, search: debouncedSearch }],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (status) params.status = status;
      if (source) params.source = source;
      if (priority) params.priority = priority;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/leads', { params });
      return res.data;
    },
  });

  // This query is used when modal opens
  const usersQuery = useQuery({
    queryKey: ['users', 'assign'],
    queryFn: async () => (await api.get('/users', { params: { limit: 100 } })).data.data as User[],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadForm) => {
      const payload = { ...data, tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [] };
      return (await api.post('/leads', payload)).data;
    },
    onSuccess: (res) => {
      if (res.data?.duplicate) {
        setDuplicateWarning(res.data.existingLead);
        return;
      }
      toast.success('Lead created successfully');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
      setFormError(getErrorMessage(err));
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await api.patch(`/leads/${id}`, data)).data,
    onSuccess: () => {
      toast.success('Lead updated successfully');
      setModalOpen(false);
      setEditingLead(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/leads/${id}`)).data,
    onSuccess: () => {
      toast.success('Lead deleted');
      setDeleteLead(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/leads/${id}/convert`)).data,
    onSuccess: () => {
      toast.success('Lead converted to customer & opportunity!');
      setViewingLead(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/interactions', data)).data,
    onSuccess: () => {
      toast.success('Interaction recorded');
      setInteractionForm({ type: 'Phone Call', subject: '', description: '' });
      if (viewingLead) queryClient.invalidateQueries({ queryKey: ['leads', viewingLead._id] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) =>
      (await api.post(`/leads/${id}/notes`, { text })).data,
    onSuccess: () => {
      toast.success('Note added');
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const openCreateModal = () => {
    setEditingLead(null);
    setForm(emptyForm);
    setFormError('');
    setDuplicateWarning(null);
    setModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source,
      industry: lead.industry || '',
      status: lead.status,
      priority: lead.priority,
      estimatedValue: lead.estimatedValue,
      assignedTo: lead.assignedTo?._id || '',
      tags: lead.tags?.join(', ') || '',
    });
    setFormError('');
    setDuplicateWarning(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead._id, data: form });
    } else {
      createLeadMutation.mutate(form);
    }
  };

  const handleConvert = () => {
    if (viewingLead) convertMutation.mutate(viewingLead._id);
  };

  const handleExport = () => {
    const rows = (leadData?.data || []).map((lead: Lead) => ({
      Name: lead.name,
      Company: lead.company || '',
      Email: lead.email || '',
      Phone: lead.phone || '',
      Source: lead.source,
      Status: lead.status,
      Priority: lead.priority,
      'Assigned To': lead.assignedTo?.name || '',
      'Estimated Value': lead.estimatedValue,
      'Created At': new Date(lead.createdAt).toLocaleDateString(),
    }));
    downloadCSV('leads', rows);
    toast.success('Leads exported to CSV');
  };

  const inputCls = 'input-field';
  const labelCls = 'label-field';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Manage and track your sales leads</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <FileOutput className="w-4 h-4 mr-1" /> Export
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="w-4 h-4 mr-1" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, company, email, phone..."
              className="input-field pl-10"
            />
          </div>
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUSES} placeholder="All Status" className="sm:w-40" />
          <Select value={source} onChange={(v) => { setSource(v); setPage(1); }} options={SOURCES} placeholder="All Sources" className="sm:w-40" />
          <Select value={priority} onChange={(v) => { setPriority(v); setPage(1); }} options={PRIORITIES} placeholder="All Priorities" className="sm:w-40" />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <EmptyState
            title="Couldn't load leads"
            description="Something went wrong while fetching data. Check your connection and try again."
            action={<button onClick={() => refetch()} className="btn-primary"><RefreshCw className="w-4 h-4 mr-1" /> Retry</button>}
          />
        ) : leadData?.data?.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="Start by adding your first lead or adjust your filters."
            action={<button onClick={openCreateModal} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Add Lead</button>}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-900">
                    <th>Lead</th>
                    <th>Contact</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Value</th>
                    <th>Next Follow-up</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leadData?.data?.map((lead: Lead) => (
                    <tr key={lead._id}>
                      <td>
                        <button onClick={() => setViewingLead(lead)} className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                          {lead.name}
                        </button>
                        <p className="text-xs text-surface-500 dark:text-dark-400">{lead.company || '—'}</p>
                      </td>
                      <td>
                        <p>{lead.email || '—'}</p>
                        <p className="text-xs text-surface-500 dark:text-dark-400">{lead.phone || ''}</p>
                      </td>
                      <td><Badge color="info">{lead.source}</Badge></td>
                      <td><Badge color={getStatusColor(lead.status)}>{lead.status}</Badge></td>
                      <td><Badge color={getPriorityColor(lead.priority)}>{lead.priority}</Badge></td>
                      <td>{lead.assignedTo?.name || <span className="text-surface-400">Unassigned</span>}</td>
                      <td className="font-medium">{formatCurrency(lead.estimatedValue)}</td>
                      <td>{formatDate(lead.nextFollowUp)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingLead(lead)}
                            className="p-1.5 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors dark:hover:bg-primary-900/20"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors dark:hover:bg-primary-900/20"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteLead(lead)}
                            className="p-1.5 rounded-xl text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leadData?.pagination && (
              <Pagination pagination={leadData.pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setDuplicateWarning(null); }}
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        size="lg"
      >
        {duplicateWarning && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              ⚠️ A similar lead already exists: <strong>{duplicateWarning.name}</strong> ({duplicateWarning.email || duplicateWarning.phone || duplicateWarning.company})
            </p>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
              You can still continue if this is a different contact.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  createLeadMutation.mutate({ ...form, force: true } as any);
                  setDuplicateWarning(null);
                }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                Continue Anyway
              </button>
              <button onClick={() => setDuplicateWarning(null)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Source</label>
            <Select value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={SOURCES} />
          </div>
          <div>
            <label className={labelCls}>Industry</label>
            <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={PRIORITIES} />
          </div>
          <div>
            <label className={labelCls}>Estimated Value ($)</label>
            <input type="number" min="0" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Assign To</label>
            <Select
              value={form.assignedTo}
              onChange={(v) => setForm({ ...form, assignedTo: v })}
              options={[{ value: '', label: 'Unassigned' }, ...(usersQuery.data || []).map((u: User) => ({ value: u._id, label: `${u.name} (${u.role})` }))]}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="hot, enterprise, tech" className={inputCls} />
          </div>
          {formError && <p className="sm:col-span-2 text-sm text-red-600">{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createLeadMutation.isPending || updateLeadMutation.isPending} className="btn-primary">
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewingLead} onClose={() => setViewingLead(null)} title="Lead Details" size="lg">
        {viewingLead && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white">{viewingLead.name}</h3>
                <p className="text-sm text-surface-500 dark:text-dark-400">{viewingLead.company} • {viewingLead.industry}</p>
              </div>
              <div className="flex gap-2">
                <Badge color={getStatusColor(viewingLead.status)}>{viewingLead.status}</Badge>
                <Badge color={getPriorityColor(viewingLead.priority)}>{viewingLead.priority}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-surface-500 dark:text-dark-400">Email</p>
                <p className="font-medium">{viewingLead.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-dark-400">Phone</p>
                <p className="font-medium">{viewingLead.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-dark-400">Source</p>
                <p className="font-medium">{viewingLead.source}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-dark-400">Estimated Value</p>
                <p className="font-medium">{formatCurrency(viewingLead.estimatedValue)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-dark-400">Assigned To</p>
                <p className="font-medium">{viewingLead.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-dark-400">Created</p>
                <p className="font-medium">{formatDate(viewingLead.createdAt)}</p>
              </div>
            </div>

            {viewingLead.tags?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {viewingLead.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-surface-700 dark:text-dark-200 mb-2">Notes</h4>
              <div className="flex gap-2 mb-2">
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && noteText.trim()) {
                      addNoteMutation.mutate({ id: viewingLead._id, text: noteText.trim() });
                    }
                  }}
                  placeholder="Add a note and press Enter..."
                  className="input-field flex-1"
                />
                <button
                  onClick={() => noteText.trim() && addNoteMutation.mutate({ id: viewingLead._id, text: noteText.trim() })}
                  disabled={!noteText.trim()}
                  className="btn-primary text-sm px-3"
                >
                  Add
                </button>
              </div>
              {viewingLead.notes?.length === 0 ? (
                <p className="text-sm text-surface-400">No notes yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {viewingLead.notes.map((n, i) => (
                    <div key={i} className="bg-surface-50 dark:bg-dark-700 p-3 rounded-lg text-sm">
                      <p>{n.text}</p>
                      <p className="text-xs text-surface-400 mt-1">{formatDate(n.addedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Record interaction */}
            <div>
              <h4 className="text-sm font-semibold text-surface-700 dark:text-dark-200 mb-2">Record Interaction</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  value={interactionForm.type}
                  onChange={(v) => setInteractionForm({ ...interactionForm, type: v })}
                  options={['Phone Call', 'Email', 'Meeting', 'Note', 'Other']}
                />
                <input
                  value={interactionForm.subject}
                  onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                  placeholder="Subject"
                  className="input-field"
                />
                <button
                  onClick={() =>
                    addInteractionMutation.mutate({
                      type: interactionForm.type,
                      subject: interactionForm.subject || interactionForm.type,
                      description: interactionForm.description,
                      lead: viewingLead._id,
                    })
                  }
                  disabled={addInteractionMutation.isPending}
                  className="btn-primary text-sm"
                >
                  Record
                </button>
              </div>
              <textarea
                value={interactionForm.description}
                onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
                placeholder="Details about the interaction (optional)"
                rows={2}
                className="input-field mt-2"
              />
            </div>

            {!viewingLead.convertedToCustomer && ['Qualified', 'Proposal Sent', 'Negotiation', 'Won'].includes(viewingLead.status) && (
              <button onClick={handleConvert} disabled={convertMutation.isPending} className="btn-primary w-full">
                <RefreshCw className="w-4 h-4 mr-1" /> Convert to Customer & Opportunity
              </button>
            )}
            {viewingLead.convertedToCustomer && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-300">
                ✓ This lead has been converted to a customer and opportunity
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteLead}
        onClose={() => setDeleteLead(null)}
        onConfirm={() => deleteLead && deleteMutation.mutate(deleteLead._id)}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${deleteLead?.name}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Leads;
