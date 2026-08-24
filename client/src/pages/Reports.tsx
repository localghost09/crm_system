import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, FileText, DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatCurrency, downloadCSV } from '../utils/helpers';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

const chartTooltipStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e4e4e7',
    borderRadius: '12px',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.12)',
    fontSize: '12px',
    padding: '10px 14px',
  },
};

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employee, setEmployee] = useState('');

  const { data: perfData, isLoading } = useQuery({
    queryKey: ['reports', 'performance', { startDate, endDate, employee }],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (employee) params.employee = employee;
      const res = await api.get('/dashboard/performance', { params });
      return res.data.data.performance;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['reports', 'revenue', { startDate, endDate }],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/dashboard/revenue', { params });
      return res.data.data.monthlyRevenue;
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['reports', 'charts'],
    queryFn: async () => (await api.get('/dashboard/charts')).data.data,
  });

  if (isLoading) return <PageSkeleton />;

  const performance = perfData || [];
  const monthlyRevenue = (revenueData || []).map((item: any) => ({
    month: item._id,
    revenue: item.revenue,
  }));

  const leadSourceData = (chartData?.leadsBySource || []).map((item: any) => ({
    name: item._id,
    value: item.count,
  }));

  const customerGrowthData = (chartData?.customerGrowth || []).map((item: any) => ({
    month: item._id,
    customers: item.count,
  }));

  const totalRevenue = performance.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
  const totalWon = performance.reduce((sum: number, p: any) => sum + (p.wonDeals || 0), 0);
  const avgDealValue = totalWon > 0 ? totalRevenue / totalWon : 0;

  const exportPerformance = () => {
    downloadCSV('sales-performance', performance.map((p: any) => ({
      'Employee': p.user?.name || 'Unknown',
      'Email': p.user?.email || '',
      'Total Deals': p.totalDeals,
      'Won Deals': p.wonDeals,
      'Lost Deals': p.lostDeals,
      'Revenue': p.revenue,
      'Pipeline Value': p.pipelineValue,
    })));
    toast.success('Performance report exported');
  };

  const exportRevenue = () => {
    downloadCSV('monthly-revenue', monthlyRevenue.map((m: any) => ({
      'Month': m.month,
      'Revenue': m.revenue,
    })));
    toast.success('Revenue report exported');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Deep-dive into your sales performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPerformance} className="btn-secondary">
            <Download className="w-4 h-4 mr-1" /> Export Performance
          </button>
          <button onClick={exportRevenue} className="btn-secondary">
            <Download className="w-4 h-4 mr-1" /> Export Revenue
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field sm:w-48" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field sm:w-48" />
          <select value={employee} onChange={(e) => setEmployee(e.target.value)} className="input-field sm:w-48">
            <option value="">All Employees</option>
            {performance.map((p: any) => (
              <option key={p._id || p.user?._id} value={p.user?._id}>{p.user?.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-well bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Total Revenue</p>
              <p className="text-xl font-display font-bold text-surface-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-well bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Deals Won</p>
              <p className="text-xl font-display font-bold text-surface-900 dark:text-white">{totalWon}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-well bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Avg Deal Value</p>
              <p className="text-xl font-display font-bold text-surface-900 dark:text-white">{formatCurrency(avgDealValue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="icon-well bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-dark-400">Active Reps</p>
              <p className="text-xl font-display font-bold text-surface-900 dark:text-white">{performance.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-display font-bold text-surface-900 dark:text-white">Revenue by Employee</h3>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance.map((p: any) => ({
                name: p.user?.name?.split(' ')[0] || 'Unknown',
                revenue: p.revenue || 0,
                pipeline: p.pipelineValue || 0,
              }))} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${v/1000}k`} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} {...chartTooltipStyle} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pipeline" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-display font-bold text-surface-900 dark:text-white">Monthly Revenue Trend</h3>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${v/1000}k`} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} {...chartTooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3.5, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-display font-bold text-surface-900 dark:text-white">Leads by Source</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {leadSourceData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-display font-bold text-surface-900 dark:text-white">Customer Growth</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerGrowthData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="customers" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
