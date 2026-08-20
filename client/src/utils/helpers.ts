export const formatCurrency = (value: number | undefined | null): string => {
  const num = value || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatTime = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'year'], [2592000, 'month'], [604800, 'week'],
    [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second'],
  ];
  for (const [secondsPer, unit] of intervals) {
    const count = Math.floor(seconds / secondsPer);
    if (count >= 1) return `${count} ${unit}${count !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary' => {
  const map: Record<string, any> = {
    Won: 'success', Active: 'success', Completed: 'success', Qualified: 'success', VIP: 'primary',
    Pending: 'warning', 'In Progress': 'info', 'Proposal Sent': 'info', Contacted: 'info', Negotiation: 'warning',
    Overdue: 'danger', Lost: 'danger', Churned: 'danger', Cancelled: 'gray', New: 'info',
    Inactive: 'gray', 'Lead': 'warning',
  };
  return map[status] || 'gray';
};

export const getPriorityColor = (priority: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary' => {
  const map: Record<string, any> = {
    Low: 'gray', Medium: 'info', High: 'warning', Critical: 'danger',
  };
  return map[priority] || 'gray';
};

export const downloadCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Something went wrong';
};
