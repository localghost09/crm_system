import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, UserPlus, TrendingUp, CheckSquare, Target, DollarSign,
  BarChart3, ArrowRight, Clock, AlertTriangle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import { formatCurrency, formatDate, formatTime, timeAgo, getStatusColor, getPriorityColor } from '../utils/helpers';
import type { DashboardSummary, ChartData } from '../types';
import { PageSkeleton } from '../components/common/Skeleton';

const PIPELINE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

const Dashboard: React.FC = () => {
  const [range, setRange] = useState('30d');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data as DashboardSummary;
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => {
      const res = await api.get('/dashboard/charts');
      return res.data.data as ChartData;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['dashboard', 'revenue', range],
    queryFn: async () => {
      const res = await api.get('/dashboard/revenue', { params: { range } });
      return res.data.data.monthlyRevenue;
    },
  });

  if (isLoading) return <PageSkeleton />;

  const kpi = summary?.kpi;
  const upcoming = summary?.upcoming;

  const revenueChartData = (revenueData || []).map((item: any) => ({
    month: item._id,
    revenue: item.revenue,
  }));

  const pipelineChartData = (chartData?.leadStatus || []).map((item: any) => ({
    name: item._id,
    value: item.count,
  }));

  const leadSourceData = (chartData?.leadsBySource || []).map((item: any) => ({
    name: item._id,
    value: item.count,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your sales overview.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-1">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === r ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-dark-400'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={kpi?.totalCustomers || 0} icon={Users} color="blue" subtext="Active accounts" />
        <StatCard label="Total Leads" value={kpi?.totalLeads || 0} icon={UserPlus} color="indigo" subtext={`${kpi?.conversionRate || 0}% conversion rate`} />
        <StatCard label="Active Opportunities" value={kpi?.pipelineOpportunities || 0} icon={Target} color="purple" subtext={`${formatCurrency(kpi?.pipelineValue || 0)} pipeline`} />
        <StatCard label="Revenue" value={formatCurrency(kpi?.revenue || 0)} icon={DollarSign} color="green" subtext={`${kpi?.wonOpportunities || 0} deals won`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 dark:text-white">Lead Status</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pipelineChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pipelineChartData.map((_: any, index: number) => (
                    <Cell key={index} fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Lead Sources</h3>
          </div>
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadSourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {/* Today's follow-ups */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Follow-ups</h3>
              </div>
              <Link to="/followups" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-dark-700">
              {upcoming?.followUps?.length === 0 && (
                <p className="p-4 text-sm text-gray-500 dark:text-dark-400 text-center">No upcoming follow-ups</p>
              )}
              {upcoming?.followUps?.slice(0, 3).map((fu) => (
                <div key={fu._id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fu.title}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {fu.customer?.name || fu.lead?.name || '—'} • {formatTime(fu.followUpDate)}
                    </p>
                  </div>
                  <Badge color={fu.status === 'Pending' ? 'warning' : 'success'}>{fu.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue tasks */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Overdue Tasks</h3>
              </div>
              <Link to="/tasks" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-dark-700">
              {upcoming?.overdueTasks?.length === 0 && (
                <p className="p-4 text-sm text-gray-500 dark:text-dark-400 text-center">No overdue tasks 🎉</p>
              )}
              {upcoming?.overdueTasks?.slice(0, 3).map((task) => (
                <div key={task._id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">Due {formatDate(task.dueDate)}</p>
                  </div>
                  <Badge color={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recently Added Leads</h3>
            <Link to="/leads" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {upcoming?.recentLeads?.map((lead) => (
              <div key={lead._id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">{lead.company || '—'} • {timeAgo(lead.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={getStatusColor(lead.status)}>{lead.status}</Badge>
                  <Badge color={getPriorityColor(lead.priority)}>{lead.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recently Closed Deals</h3>
            <Link to="/pipeline" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {upcoming?.recentDeals?.map((deal) => (
              <div key={deal._id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{deal.title}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {deal.customer?.name || '—'} • {formatCurrency(deal.expectedValue)}
                  </p>
                </div>
                <Badge color={getStatusColor(deal.stage)}>{deal.stage}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
