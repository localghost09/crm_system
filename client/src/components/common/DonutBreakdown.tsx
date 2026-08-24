import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface BreakdownItem {
  name: string;
  value: number;
}

interface DonutBreakdownProps {
  data: BreakdownItem[];
  colors?: string[];
  colorForName?: (name: string) => string;
  centerLabel?: string;
  emptyText?: string;
  /** Suffix for the value column, e.g. ' leads' or '' */
  valueSuffix?: string;
}

const DEFAULT_COLORS = ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e4e4e7',
    borderRadius: '12px',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.12)',
    fontSize: '12px',
    padding: '8px 12px',
  },
};

/**
 * SaaS-style distribution widget: a compact donut (with a total in the
 * center) next to a per-item list with percentage and a colored progress bar.
 */
const DonutBreakdown: React.FC<DonutBreakdownProps> = ({
  data,
  colors,
  colorForName,
  centerLabel = 'Total',
  emptyText = 'No data yet',
  valueSuffix = '',
}) => {
  const palette = colors || DEFAULT_COLORS;
  const total = data.reduce((s, d) => s + d.value, 0);
  const colorOf = (name: string, i: number) => colorForName?.(name) || palette[i % palette.length];

  if (!data.length || total === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-surface-400 dark:text-dark-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 lg:gap-6 h-full">
      {/* Donut */}
      <div className="relative w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={66}
              paddingAngle={2.5}
              cornerRadius={4}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorOf(d.name, i)} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-display tracking-tight text-surface-900 dark:text-white leading-none">
            {total}
          </span>
          <span className="text-[11px] font-medium text-surface-400 dark:text-dark-500 mt-1">{centerLabel}</span>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="w-full flex-1 space-y-3 min-w-0">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.name}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colorOf(d.name, i) }} />
                <span className="text-sm font-medium text-surface-700 dark:text-dark-200 truncate">{d.name}</span>
                <span className="ml-auto text-sm font-semibold text-surface-900 dark:text-white">{d.value}{valueSuffix}</span>
                <span className="text-xs font-medium text-surface-400 dark:text-dark-500 w-9 text-right tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-100 dark:bg-dark-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: colorOf(d.name, i) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutBreakdown;
