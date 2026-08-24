import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, UserCircle, Shield, Briefcase } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useDebounce } from '../hooks/useDebounce';
import { getErrorMessage, getInitials } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  department: string;
  title: string;
}

const emptyForm: UserForm = {
  name: '', email: '', password: '', role: 'executive', phone: '', department: '', title: '',
};

const roleColor: Record<string, any> = {
  admin: 'danger',
  manager: 'warning',
  executive: 'info',
};

const Team: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);
  const [role, setRole] = useState('');

  // Deep-link support: /team?search=foo (used by the global search box)
  const urlSearch = searchParams.get('search');
  useEffect(() => {
    if (urlSearch !== null) setSearch(urlSearch);
  }, [urlSearch]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const { data: teamData } = useQuery({
    queryKey: ['users', { search: debouncedSearch, role }],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (role) params.role = role;
      if (debouncedSearch) params.search = debouncedSearch;
      return (await api.get('/users', { params })).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserForm) => (await api.post('/users', data)).data,
    onSuccess: () => {
      toast.success('User created');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserForm> }) => (await api.patch(`/users/${id}`, data)).data,
    onSuccess: () => {
      toast.success('User updated');
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => {
      toast.success('User deleted');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const toggleActive = (user: User) => {
    updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } as any });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      title: user.title || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (!payload.password) delete payload.password;
    if (editing) updateMutation.mutate({ id: editing._id, data: payload });
    else createMutation.mutate(payload);
  };

  const inputCls = 'input-field';
  const labelCls = 'label-field';

  const users: User[] = teamData?.data || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage your team members and roles</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-1" /> Add Member
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members..." className="input-field pl-10" />
          </div>
          <Select
            value={role}
            onChange={(v) => setRole(v)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'manager', label: 'Manager' },
              { value: 'executive', label: 'Executive' },
            ]}
            className="sm:w-44"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user._id} className="card p-5 hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-sm shadow-primary-600/20">
                  <span className="text-base font-bold text-white">{getInitials(user.name)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-surface-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-surface-500 dark:text-dark-400 truncate">{user.email}</p>
                </div>
              </div>
              <Badge color={roleColor[user.role]}>{user.role}</Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-surface-600 dark:text-dark-300">
                <Briefcase className="w-4 h-4 text-surface-400" />
                <span className="truncate">{user.title || 'No title'}{user.department ? ` · ${user.department}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-surface-600 dark:text-dark-300">
                <Shield className="w-4 h-4 text-surface-400" />
                Status:{' '}
                <span className={user.isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-surface-100 dark:border-dark-800 pt-3.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ring-1 ring-inset ${
                user.isActive
                  ? 'text-emerald-700 bg-emerald-50 ring-emerald-600/10 dark:text-emerald-400 dark:bg-emerald-500/10 dark:ring-emerald-500/20'
                  : 'text-red-700 bg-red-50 ring-red-600/10 dark:text-red-400 dark:bg-red-500/10 dark:ring-red-500/20'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              {isAdmin && (
                <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(user)} className="p-1.5 rounded-xl text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleting(user)} className="p-1.5 rounded-xl text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Team Member' : 'Add Team Member'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Role *</label>
              <Select
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v })}
                options={[
                  { value: 'executive', label: 'Executive' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sales Executive" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Sales" className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        title="Delete User"
        message={`Are you sure you want to delete ${deleting?.name}?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Team;
