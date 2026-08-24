import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Eye, FileOutput, Building2, Mail, Phone, MapPin } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatDate, timeAgo, getStatusColor, downloadCSV, getErrorMessage } from '../utils/helpers';
import type { Customer, User } from '../types';

const STATUSES = ['Active', 'Inactive', 'Lead', 'Churned', 'VIP'];

interface CustomerForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  status: string;
  assignedTo: string;
  tags: string;
  address: { street: string; city: string; state: string; zipCode: string; country: string };
}

const emptyForm: CustomerForm = {
  name: '', company: '', email: '', phone: '', industry: '', status: 'Active',
  assignedTo: '', tags: '',
  address: { street: '', city: '', state: '', zipCode: '', country: '' },
};

const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', { page, status, search: debouncedSearch }],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      return (await api.get('/customers', { params })).data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'assign'],
    queryFn: async () => (await api.get('/users', { params: { limit: 100 } })).data.data as User[],
  });

  // Customer detail (360 view)
  const customerDetailQuery = useQuery({
    queryKey: ['customers', viewing?._id, 'detail'],
    queryFn: async () => {
      if (!viewing?._id) return null;
      return (await api.get(`/customers/${viewing._id}`)).data.data;
    },
    enabled: !!viewing?._id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CustomerForm) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };
      return (await api.post('/customers', payload)).data;
    },
    onSuccess: () => {
      toast.success('Customer created successfully');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
      setFormError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerForm }) =>
      (await api.patch(`/customers/${id}`, data)).data,
    onSuccess: () => {
      toast.success('Customer updated');
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/customers/${id}`)).data,
    onSuccess: () => {
      toast.success('Customer deleted');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      company: customer.company || '',
      email: customer.email || '',
      phone: customer.phone || '',
      industry: customer.industry || '',
      status: customer.status,
      assignedTo: customer.assignedTo?._id || '',
      tags: customer.tags?.join(', ') || '',
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || '',
      },
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  const handleExport = () => {
    const rows = (customersData?.data || []).map((c: Customer) => ({
      Name: c.name,
      Company: c.company || '',
      Email: c.email || '',
      Phone: c.phone || '',
      Status: c.status,
      Industry: c.industry || '',
      'Total Purchases': c.totalPurchases,
      'Assigned To': c.assignedTo?.name || '',
    }));
    downloadCSV('customers', rows);
    toast.success('Customers exported to CSV');
  };

  const inputCls = 'input-field';
  const labelCls = 'label-field';

  const detail = customerDetailQuery.data;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <FileOutput className="w-4 h-4 mr-1" /> Export
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-1" /> Add Customer
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customers..."
              className="input-field pl-10"
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field sm:w-44">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton />
        ) : customersData?.data?.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Add your first customer to start managing relationships."
            action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Add Customer</button>}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-surface-50 dark:bg-dark-900">
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Industry</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Total Purchases</th>
                    <th>Last Purchase</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customersData?.data?.map((c: Customer) => (
                    <tr key={c._id}>
                      <td>
                        <button onClick={() => setViewing(c)} className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                          {c.name}
                        </button>
                        <p className="text-xs text-surface-500 dark:text-dark-400">{c.company || '—'}</p>
                      </td>
                      <td>
                        <p>{c.email || '—'}</p>
                        <p className="text-xs text-surface-500 dark:text-dark-400">{c.phone || ''}</p>
                      </td>
                      <td>{c.industry || '—'}</td>
                      <td><Badge color={getStatusColor(c.status)}>{c.status}</Badge></td>
                      <td>{c.assignedTo?.name || <span className="text-surface-400">Unassigned</span>}</td>
                      <td className="font-medium">{formatCurrency(c.totalPurchases)}</td>
                      <td>{formatDate(c.lastPurchase)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewing(c)} className="p-1.5 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleting(c)} className="p-1.5 rounded-xl text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customersData?.pagination && <Pagination pagination={customersData.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
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
            <label className={labelCls}>Industry</label>
            <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assign To</label>
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className={inputCls}>
              <option value="">Unassigned</option>
              {usersQuery.data?.map((u: User) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tags</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vip, tech" className={inputCls} />
          </div>
          <div className="sm:col-span-2 border-t border-surface-100 dark:border-dark-700 pt-3">
            <p className="text-xs font-medium text-surface-500 uppercase mb-3">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} placeholder="Street" className={inputCls} />
              <input value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="City" className={inputCls} />
              <input value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} placeholder="State" className={inputCls} />
              <input value={form.address.zipCode} onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} placeholder="ZIP" className={inputCls} />
              <input value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} placeholder="Country" className={inputCls} />
            </div>
          </div>
          {formError && <p className="sm:col-span-2 text-sm text-red-600">{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {editing ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 360 View Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Customer 360° Profile" size="xl">
        {detail && (
          <div className="space-y-6">
            {/* Profile header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-gradient rounded-2xl shadow-sm flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white">{detail.customer.name}</h3>
                  <p className="text-sm text-surface-500 dark:text-dark-400">
                    {detail.customer.company} • Customer since {formatDate(detail.customer.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={getStatusColor(detail.customer.status)}>{detail.customer.status}</Badge>
                {detail.customer.tags?.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">#{t}</span>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-surface-600 dark:text-dark-300">
                <Mail className="w-4 h-4 text-surface-400" /> {detail.customer.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-surface-600 dark:text-dark-300">
                <Phone className="w-4 h-4 text-surface-400" /> {detail.customer.phone || '—'}
              </div>
              <div className="flex items-center gap-2 text-surface-600 dark:text-dark-300">
                <MapPin className="w-4 h-4 text-surface-400" />
                {detail.customer.address?.city || '—'}{detail.customer.address?.country ? ', ' + detail.customer.address.country : ''}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface-50 dark:bg-dark-800/60 rounded-xl p-4 ring-1 ring-surface-100 dark:ring-dark-700">
                <p className="text-xs text-surface-500 dark:text-dark-400">Total Purchases</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{formatCurrency(detail.customer.totalPurchases)}</p>
              </div>
              <div className="bg-surface-50 dark:bg-dark-800/60 rounded-xl p-4 ring-1 ring-surface-100 dark:ring-dark-700">
                <p className="text-xs text-surface-500 dark:text-dark-400">Active Opportunities</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{detail.opportunities?.length || 0}</p>
              </div>
              <div className="bg-surface-50 dark:bg-dark-800/60 rounded-xl p-4 ring-1 ring-surface-100 dark:ring-dark-700">
                <p className="text-xs text-surface-500 dark:text-dark-400">Interactions</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{detail.interactions?.length || 0}</p>
              </div>
              <div className="bg-surface-50 dark:bg-dark-800/60 rounded-xl p-4 ring-1 ring-surface-100 dark:ring-dark-700">
                <p className="text-xs text-surface-500 dark:text-dark-400">Open Tasks</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{detail.tasks?.length || 0}</p>
              </div>
            </div>

            {/* Opportunities */}
            <div>
              <h4 className="text-sm font-semibold text-surface-700 dark:text-dark-200 mb-3">Active Opportunities</h4>
              {detail.opportunities?.length === 0 ? (
                <p className="text-sm text-surface-400">No active opportunities</p>
              ) : (
                <div className="space-y-2">
                  {detail.opportunities?.map((opp: any) => (
                    <div key={opp._id} className="flex items-center justify-between bg-surface-50 dark:bg-dark-700 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white">{opp.title}</p>
                        <p className="text-xs text-surface-500 dark:text-dark-400">Assigned to {opp.assignedTo?.name || '—'}</p>
                      </div>
                      <div className="text-right">
                        <Badge color={getStatusColor(opp.stage)}>{opp.stage}</Badge>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(opp.expectedValue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactions timeline */}
            <div>
              <h4 className="text-sm font-semibold text-surface-700 dark:text-dark-200 mb-3">Activity Timeline</h4>
              {detail.interactions?.length === 0 ? (
                <p className="text-sm text-surface-400">No interactions recorded</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {detail.interactions?.map((i: any) => (
                    <div key={i._id} className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm">
                          <span className="font-medium text-surface-900 dark:text-white">{i.subject}</span>{' '}
                          <span className="text-surface-500 dark:text-dark-400">— {i.type}</span>
                        </p>
                        <p className="text-xs text-surface-500 dark:text-dark-400">{i.description}</p>
                        <p className="text-xs text-surface-400 mt-0.5">{i.performedBy?.name} • {timeAgo(i.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-ups */}
            <div>
              <h4 className="text-sm font-semibold text-surface-700 dark:text-dark-200 mb-3">Upcoming Follow-ups</h4>
              {detail.followups?.filter((f: any) => f.status === 'Pending').length === 0 ? (
                <p className="text-sm text-surface-400">No pending follow-ups</p>
              ) : (
                <div className="space-y-2">
                  {detail.followups?.filter((f: any) => f.status === 'Pending').map((f: any) => (
                    <div key={f._id} className="flex items-center justify-between bg-surface-50 dark:bg-dark-700 p-3 rounded-lg">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{f.title}</p>
                      <Badge color={getStatusColor(f.status)}>{f.status} • {formatDate(f.followUpDate)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deleting?.name}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Customers;
