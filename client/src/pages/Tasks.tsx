import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, CheckCircle2, Circle, Clock, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate, getPriorityColor, getStatusColor, getErrorMessage } from '../utils/helpers';
import type { Task, User } from '../types';

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Overdue'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

interface TaskForm {
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
  status: string;
}

const emptyForm: TaskForm = {
  title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '', status: 'Pending',
};

const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { page, status, priority, search: debouncedSearch }],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (debouncedSearch) params.search = debouncedSearch;
      return (await api.get('/tasks', { params })).data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'assign'],
    queryFn: async () => (await api.get('/users', { params: { limit: 100 } })).data.data as User[],
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskForm) => (await api.post('/tasks', data)).data,
    onSuccess: () => {
      toast.success('Task created');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/tasks/${id}`, data)).data,
    onSuccess: () => {
      toast.success('Task updated');
      setModalOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/tasks/${id}`)).data,
    onSuccess: () => {
      toast.success('Task deleted');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const toggleStatus = (task: Task) => {
    const next = task.status === 'Completed' ? 'Pending' : 'Completed';
    updateMutation.mutate({ id: task._id, data: { status: next } });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      status: task.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  const inputCls = 'input-field';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Track and manage your team's tasks</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search tasks..." className="input-field pl-10" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field sm:w-40">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="input-field sm:w-40">
            <option value="">All Priority</option>
            {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton />
        ) : tasksData?.data?.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Create a task to keep your team on track."
            action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Add Task</button>}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-900">
                    <th className="w-10"></th>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksData?.data?.map((task: Task) => (
                    <tr key={task._id}>
                      <td>
                        <button onClick={() => toggleStatus(task)} className="text-gray-400 hover:text-green-600 transition-colors">
                          {task.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </td>
                      <td>
                        <p className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
                        {task.description && <p className="text-xs text-gray-500 dark:text-dark-400 truncate max-w-xs">{task.description}</p>}
                      </td>
                      <td>{task.assignedTo?.name || <span className="text-gray-400">Unassigned</span>}</td>
                      <td><Badge color={getPriorityColor(task.priority)}>{task.priority}</Badge></td>
                      <td>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td><Badge color={getStatusColor(task.status)}>{task.status}</Badge></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleting(task)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tasksData?.pagination && <Pagination pagination={tasksData.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Assign To</label>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className={inputCls}>
                <option value="">Unassigned</option>
                {usersQuery.data?.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        title="Delete Task"
        message={`Delete task "${deleting?.title}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Tasks;
