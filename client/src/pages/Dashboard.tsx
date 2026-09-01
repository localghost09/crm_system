import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Target, DollarSign,
  BarChart3, ArrowRight, Clock, AlertTriangle,
  Loader2, Check, Activity, ListTodo,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import DonutBreakdown from '../components/common/DonutBreakdown';
import { formatCurrency, formatDate, formatTime, timeAgo, getStatusColor, getPriorityColor, getErrorMessage } from '../utils/helpers';
import { normalizeMonthlySeries } from '../utils/chartData';
import type { DashboardSummary, ChartData, Task } from '../types';
import { PageSkeleton } from '../components/common/Skeleton';

const PIPELINE_COLORS = ['#3167a6', '#4f775b', '#7c7b76', '#4f775b', '#b07d2b', '#9c5b4e', '#a83c3c'];

const STATUS_COLORS: Record<string, string> = {
  New: '#0ea5e9',
  Contacted: '#7c7b76',
  Qualified: '#3167a6',
  'Proposal Sent': '#b07d2b',
  Negotiation: '#f97316',
  Won: '#4f775b',
  Lost: '#a83c3c',
};

const ACTIVITY_COLORS = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('created')) return 'bg-emerald-500';
  if (a.includes('deleted')) return 'bg-red-500';
  if (a.includes('login')) return 'bg-sky-500';
  if (a.includes('role')) return 'bg-amber-500';
  if (a.includes('convert')) return 'bg-primary-500';
  if (a.includes('updated') || a.includes('changed')) return 'bg-primary-500';
  return 'bg-surface-400';
};

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

// Spline chart dot: small dot on every point, ring highlight on the latest one
const splineDot = (color: string, dataLength: number) => (props: any) => {
  const { cx, cy, index } = props;
  if (cx == null || cy == null) return <g />;
  const isLast = index === dataLength - 1;
  return (
    <g>
      {isLast && <circle cx={cx} cy={cy} r={7} fill={color} fillOpacity={0.15} />}
      <circle cx={cx} cy={cy} r={isLast ? 3.5 : 2} fill={color} stroke="#fff" strokeWidth={2} />
    </g>
  );
};

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
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

  // Tasks due today (incl. overdue), for the interactive checklist
  const { data: taskData } = useQuery({
    queryKey: ['dashboard', 'today-tasks'],
    queryFn: async () => (await api.get('/tasks', { params: { limit: 50, sort: 'dueDate' } })).data.data as Task[],
  });

  const { data: auditData } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => (await api.get('/audit', { params: { limit: 7 } })).data.data,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/tasks/${id}`, { status })).data,
    onSuccess: (_data, vars) => {
      toast.success(vars.status === 'Completed' ? 'Task completed 🎉' : 'Task reopened');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const todayTasks: Task[] = (taskData || [])
    .filter((t) =>
      !!t.dueDate &&
      ['Pending', 'In Progress', 'Overdue'].includes(t.status) &&
      new Date(t.dueDate).getTime() <= endOfToday.getTime(),
    )
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .slice(0, 5);

  if (isLoading) return <PageSkeleton />;

  const kpi = summary?.kpi;
  const upcoming = summary?.upcoming;

  // Aggregations only return months that contain records; normalize so the
  // smooth spline always has >= 2 points to draw (zero-padded when sparse).
  const revenueChartData = normalizeMonthlySeries(revenueData, 'revenue', 'revenue');

  const leadStatusData = (chartData?.leadStatus || []).map((item: any) => ({
    name: item._id,
    value: item.count,
  }));

  const leadSourceData = (chartData?.leadsBySource || []).map((item: any) => ({
    name: item._id,
    value: item.count,
  }));

  const customerGrowthData = normalizeMonthlySeries(chartData?.customerGrowth, 'customers');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here&apos;s your sales overview.</p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-dark-900 border border-surface-200 dark:border-dark-700 rounded p-0.5">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-sm text-sm transition-colors duration-100 ${
                range === r
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-500 hover:text-surface-700 dark:text-dark-400 dark:hover:text-dark-200'
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
        <StatCard label="Total Leads" value={kpi?.totalLeads || 0} icon={UserPlus} color="blue" subtext={`${kpi?.conversionRate || 0}% conversion rate`} />
        <StatCard label="Active Opportunities" value={kpi?.pipelineOpportunities || 0} icon={Target} color="blue" subtext={`${formatCurrency(kpi?.pipelineValue || 0)} pipeline`} />
        <StatCard label="Revenue" value={formatCurrency(kpi?.revenue || 0)} icon={DollarSign} color="green" subtext={`${kpi?.wonOpportunities || 0} deals won`} />
      </div>

      {/* Trend Row — Revenue & Customer Growth side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Revenue Trend</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">Won deal revenue over time</p>
            </div>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3167a6" stopOpacity={0.18} />
                    <stop offset="60%" stopColor="#3167a6" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#3167a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e3e0" vertical={false} />
                <XAxis dataKey="month" stroke="#7c7b76" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                <YAxis tickFormatter={(v) => `$${Number(v) / 1000}k`} stroke="#7c7b76" fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} {...chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#255288"
                  strokeWidth={1.75}
                  fill="url(#revenueGrad)"
                  dot={splineDot('#255288', revenueChartData.length)}
                  activeDot={{ r: 4, fill: '#255288', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Customer Growth</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">New customers per month</p>
            </div>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerGrowthData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f775b" stopOpacity={0.18} />
                    <stop offset="60%" stopColor="#4f775b" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#4f775b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e3e0" vertical={false} />
                <XAxis dataKey="month" stroke="#7c7b76" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                <YAxis stroke="#7c7b76" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                <Tooltip {...chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="customers"
                  stroke="#4f775b"
                  strokeWidth={1.75}
                  fill="url(#customerGrad)"
                  dot={splineDot('#4f775b', customerGrowthData.length)}
                  activeDot={{ r: 4, fill: '#4f775b', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Donut Row — Lead Status & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Status — donut breakdown */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Lead Status</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">Distribution by stage</p>
            </div>
          </div>
          <div className="p-5">
            <DonutBreakdown data={leadStatusData} colorForName={(n) => STATUS_COLORS[n] || PIPELINE_COLORS[0]} centerLabel="Leads" />
          </div>
        </div>

        {/* Lead Sources — donut breakdown */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Lead Sources</h3>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">Where your leads come from</p>
            </div>
          </div>
          <div className="p-5">
            <DonutBreakdown data={leadSourceData} centerLabel="Leads" />
          </div>
        </div>
      </div>

      {/* Follow-ups & Overdue Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming follow-ups */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <div className="icon-well !w-8 !h-8 bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Upcoming Follow-ups</h3>
            </div>
              <Link to="/followups" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-surface-50 dark:divide-dark-800">
              {upcoming?.followUps?.length === 0 && (
                <p className="p-5 text-sm text-surface-400 dark:text-dark-500 text-center">No upcoming follow-ups</p>
              )}
              {upcoming?.followUps?.slice(0, 3).map((fu) => (
                <div key={fu._id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-50/50 dark:hover:bg-dark-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{fu.title}</p>
                    <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5">
                      {fu.customer?.name || fu.lead?.name || '—'} · {formatTime(fu.followUpDate)}
                    </p>
                  </div>
                  <Badge color={fu.status === 'Pending' ? 'warning' : 'success'}>{fu.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue tasks */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <div className="flex items-center gap-2.5">
                <div className="icon-well !w-8 !h-8 bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Overdue Tasks</h3>
              </div>
              <Link to="/tasks" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-surface-50 dark:divide-dark-800">
              {upcoming?.overdueTasks?.length === 0 && (
                <p className="p-5 text-sm text-surface-400 dark:text-dark-500 text-center">No overdue tasks 🎉</p>
              )}
              {upcoming?.overdueTasks?.slice(0, 3).map((task) => (
                <div key={task._id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-50/50 dark:hover:bg-dark-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{task.title}</p>
                    <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5">Due {formatDate(task.dueDate)}</p>
                  </div>
                  <Badge color={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* Today + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Tasks — interactive checklist */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <div className="icon-well !w-8 !h-8 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Today&apos;s Tasks</h3>
              {todayTasks.length > 0 && (
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                  {todayTasks.length}
                </span>
              )}
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-50 dark:divide-dark-800">
            {todayTasks.length === 0 && (
              <p className="p-5 text-sm text-surface-400 dark:text-dark-500 text-center">All caught up — nothing due today 🎉</p>
            )}
            {todayTasks.map((task) => {
                  const isOverdue = new Date(task.dueDate || 0) < new Date(new Date().toDateString());
              const busy = toggleTaskMutation.isPending && toggleTaskMutation.variables?.id === task._id;
              return (
                <div key={task._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-surface-50/50 dark:hover:bg-dark-800/30 transition-colors">
                  <button
                    onClick={() =>
                      toggleTaskMutation.mutate({ id: task._id, status: task.status === 'Completed' ? 'Pending' : 'Completed' })
                    }
                    disabled={busy}
                    aria-label={`Mark "${task.title}" complete`}
                    className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors duration-100
                      ${busy ? 'border-primary-400' : 'border-surface-300 dark:border-dark-600 hover:border-primary-500'}`}
                  >
                    {busy && <Loader2 className="w-3 h-3 text-primary-500 animate-spin" />}
                    {!busy && <Check className="w-3 h-3 text-white opacity-0 scale-50 transition-all" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{task.title}</p>
                    <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5 truncate">
                      {task.assignedTo?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge color={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                        isOverdue
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          : 'bg-surface-100 text-surface-500 dark:bg-dark-700 dark:text-dark-400'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : 'Today'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <div className="icon-well !w-8 !h-8 bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Recent Activity</h3>
            </div>
            <Link to="/audit" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-50 dark:divide-dark-800">
            {(!auditData || auditData.length === 0) && (
              <p className="p-5 text-sm text-surface-400 dark:text-dark-500 text-center">Activity will appear here as it happens</p>
            )}
            {(auditData || []).map((log: any) => (
              <div key={log._id} className="px-5 py-3 flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ACTIVITY_COLORS(log.action)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-surface-800 dark:text-dark-100 truncate">
                    <span className="font-semibold">{log.user?.name || 'System'}</span>
                    <span className="text-surface-400 dark:text-dark-500"> · {log.action}</span>
                  </p>
                  {log.description && (
                    <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5 truncate">{log.description}</p>
                  )}
                </div>
                <span className="text-[11px] text-surface-400 dark:text-dark-500 flex-shrink-0 whitespace-nowrap">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold text-surface-900 dark:text-white">Recently Added Leads</h3>
            <Link to="/leads" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-50 dark:divide-dark-800">
            {upcoming?.recentLeads?.length === 0 && (
              <p className="p-5 text-sm text-surface-400 dark:text-dark-500 text-center">No leads yet</p>
            )}
            {upcoming?.recentLeads?.map((lead) => (
              <div key={lead._id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-50/50 dark:hover:bg-dark-800/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{lead.name}</p>
                  <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5">{lead.company || '—'} · {timeAgo(lead.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge color={getStatusColor(lead.status)}>{lead.status}</Badge>
                  <Badge color={getPriorityColor(lead.priority)}>{lead.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold text-surface-900 dark:text-white">Recently Closed Deals</h3>
            <Link to="/pipeline" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-50 dark:divide-dark-800">
            {upcoming?.recentDeals?.length === 0 && (
              <p className="p-5 text-sm text-surface-400 dark:text-dark-500 text-center">No closed deals yet</p>
            )}
            {upcoming?.recentDeals?.map((deal) => (
              <div key={deal._id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-50/50 dark:hover:bg-dark-800/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{deal.title}</p>
                  <p className="text-xs text-surface-500 dark:text-dark-400 mt-0.5">
                    {deal.customer?.name || '—'} · {formatCurrency(deal.expectedValue)}
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
