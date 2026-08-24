import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, DollarSign, TrendingUp, Users, Target, Trophy, RotateCcw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { PageSkeleton } from '../components/common/Skeleton';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import DonutBreakdown from '../components/common/DonutBreakdown';
import { formatCurrency, downloadCSV, getInitials } from '../utils/helpers';

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

const rankStyles = (i: number) => {
  if (i === 0) return 'bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/30';
  if (i === 1) return 'bg-slate-200 text-slate-700 dark:bg-dark-600 dark:text-dark-200';
  if (i === 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400';
  return 'bg-surface-100 text-surface-500 dark:bg-dark-700 dark:text-dark-400';
};

// Spline chart dot: small dot on every point, ring highlight on the latest one
const splineDot = (color: string, dataLength: number) => (props: any) => {
  const { cx, cy, index } = props;
  if (cx == null || cy == null) return <g />;
  const isLast = index === dataLength - 1;
  return (
    <g>
      {isLast && <circle cx={cx} cy={cy} r={11} fill={color} fillOpacity={0.15} />}
      <circle cx={cx} cy={cy} r={isLast ? 5 : 3} fill={color} stroke="#fff" strokeWidth={2} />
    </g>
  );
};

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employee, setEmployee] = useState('');

  const { data: perfData, isLoading } = useQuery({
    queryKey: ['reports', 'performance', { startDate, endDate }],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
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

  const performance = useMemo(
    () => (perfData || []).filter((p: any) => (employee ? p.user?._id === employee : true)),
    [perfData, employee],
  );

  const leaderboard = useMemo(
    () => [...performance].sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0)),
    [performance],
  );
  const maxRevenue = Math.max(1, ...leaderboard.map((p: any) => p.revenue || 0));

  if (isLoading) return <PageSkeleton />;

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
  const hasFilters = startDate || endDate || employee;

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setEmployee('');
  };

  const exportPerformance = () => {
    downloadCSV('sales-performance', leaderboard.map((p: any) => ({
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" className="w-full sm:w-48" />
          <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" className="w-full sm:w-48" />
          <Select
            value={employee}
            onChange={setEmployee}
            options={[
              { value: '', label: 'All Employees' },
              ...(perfData || [])
                .filter((p: any) => p.user?._id)
                .map((p: any) => ({ value: p.user._id as string, label: (p.user.name as string) || 'Unknown' })),
            ]}
            className="w-full sm:w-48"
          />
          {hasFilters && (
            <button onClick={resetFilters} className="btn-ghost !text-xs shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
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
        {/* Revenue by Employee — leaderboard */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-surface-900 dark:text-white">Revenue by Employee</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">Winners are highlighted</p>
            </div>
          </div>
          <div className="divide-y divide-surface-50 dark:divide-dark-800">
            {leaderboard.length === 0 && (
              <p className="p-6 text-sm text-surface-400 dark:text-dark-500 text-center">No performance data yet</p>
            )}
            {leaderboard.map((p: any, i: number) => {
              const name = p.user?.name || 'Unknown';
              const winRate = p.totalDeals > 0 ? Math.round((p.wonDeals / p.totalDeals) * 100) : 0;
              return (
                <div
                  key={p._id || name}
                  className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                    i === 0
                      ? 'bg-gradient-to-r from-amber-50/80 to-transparent dark:from-amber-500/10 dark:to-transparent'
                      : 'hover:bg-surface-50/60 dark:hover:bg-dark-800/30'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankStyles(i)}`}>
                    {i === 0 ? <Trophy className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-sm shadow-primary-600/20 flex-shrink-0">
                    <span className="text-xs font-bold text-white">{getInitials(name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{name}</p>
                      {i === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          Top
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 dark:text-dark-500 truncate">{p.user?.email}</p>
                  </div>
                  <div className="hidden md:block w-28 lg:w-36 flex-shrink-0">
                    <div className="h-1.5 rounded-full bg-surface-100 dark:bg-dark-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                        style={{ width: `${Math.round(((p.revenue || 0) / maxRevenue) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-surface-400 dark:text-dark-500 mt-1 text-right">
                      {p.pipelineValue > 0 ? `${formatCurrency(p.pipelineValue)} pipeline` : '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-display text-surface-900 dark:text-white tabular-nums">
                      {formatCurrency(p.revenue || 0)}
                    </p>
                    <p className="text-[11px] text-surface-400 dark:text-dark-500 tabular-nums">
                      {p.wonDeals}/{p.totalDeals} won · {winRate}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-surface-900 dark:text-white">Monthly Revenue Trend</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">Won deal revenue over time</p>
            </div>
          </div>
          <div className="p-4 h-[348px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#7c3aed" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={6} />
                <YAxis tickFormatter={(v) => `$${Number(v) / 1000}k`} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} {...chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fill="url(#reportRevenueGrad)"
                  dot={splineDot('#7c3aed', monthlyRevenue.length)}
                  activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Source — donut breakdown */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-surface-900 dark:text-white">Leads by Source</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">Where your leads come from</p>
            </div>
          </div>
          <div className="p-5">
            <DonutBreakdown data={leadSourceData} centerLabel="Leads" valueSuffix="" />
          </div>
        </div>

        {/* Customer Growth */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-surface-900 dark:text-white">Customer Growth</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">New customers per month</p>
            </div>
          </div>
          <div className="p-4 h-[348px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerGrowthData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#06b6d4" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={6} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                <Tooltip {...chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="customers"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#customerGrad)"
                  dot={splineDot('#06b6d4', customerGrowthData.length)}
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
