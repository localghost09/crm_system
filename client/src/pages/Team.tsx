import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, UserCircle, Shield, Briefcase } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [role, setRole] = useState('');
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
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5';

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members..." className="input-field pl-10" />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field sm:w-44">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user._id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{getInitials(user.name)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">{user.email}</p>
                </div>
              </div>
              <Badge color={roleColor[user.role]}>{user.role}</Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-dark-300">
                <Briefcase className="w-4 h-4 text-gray-400" />
                {user.title || 'No title'} {user.department ? `• ${user.department}` : ''}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-dark-300">
                <Shield className="w-4 h-4 text-gray-400" />
                Status: <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-dark-700 pt-3">
              <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                user.isActive
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'text-red-600 bg-red-50 dark:bg-red-900/20'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleting(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
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
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                <option value="executive">Executive</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
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
