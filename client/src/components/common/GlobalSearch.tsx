import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Search, UserPlus, Building2, Target, CheckSquare, UserCircle2,
  CornerDownLeft, Loader2, CloudOff,
} from 'lucide-react';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

type ResultType = 'lead' | 'customer' | 'opportunity' | 'task' | 'user';

interface ResultItem {
  key: string;
  type: ResultType;
  title: string;
  subtitle: string;
  to: string;
}

const GROUP_META: Record<ResultType, { label: string; Icon: any }> = {
  lead: { label: 'Leads', Icon: UserPlus },
  customer: { label: 'Customers', Icon: Building2 },
  opportunity: { label: 'Deals', Icon: Target },
  task: { label: 'Tasks', Icon: CheckSquare },
  user: { label: 'Team', Icon: UserCircle2 },
};

/**
 * Global search for the header.
 * A real input: type to live-search leads, customers, deals, tasks and team
 * members across the whole CRM. Arrow keys + Enter to pick a result, which
 * navigates to the matching list page already filtered by the query.
 * Press "/" anywhere to focus the box.
 */
const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const debounced = useDebounce(query, 250);
  const trimmed = debounced.trim();
  const shouldSearch = open && trimmed.length > 0;

  const leadsQuery = useQuery({
    queryKey: ['global-search', 'leads', trimmed],
    queryFn: async () => (await api.get('/leads', { params: { search: trimmed, limit: 5 } })).data.data,
    enabled: shouldSearch,
    placeholderData: keepPreviousData,
  });
  const customersQuery = useQuery({
    queryKey: ['global-search', 'customers', trimmed],
    queryFn: async () => (await api.get('/customers', { params: { search: trimmed, limit: 5 } })).data.data,
    enabled: shouldSearch,
    placeholderData: keepPreviousData,
  });
  const opportunitiesQuery = useQuery({
    queryKey: ['global-search', 'opportunities', trimmed],
    queryFn: async () => (await api.get('/opportunities', { params: { search: trimmed, limit: 5 } })).data.data,
    enabled: shouldSearch,
    placeholderData: keepPreviousData,
  });
  const tasksQuery = useQuery({
    queryKey: ['global-search', 'tasks', trimmed],
    queryFn: async () => (await api.get('/tasks', { params: { search: trimmed, limit: 5 } })).data.data,
    enabled: shouldSearch,
    placeholderData: keepPreviousData,
  });
  const usersQuery = useQuery({
    queryKey: ['global-search', 'users', trimmed],
    queryFn: async () => (await api.get('/users', { params: { search: trimmed, limit: 5 } })).data.data,
    enabled: shouldSearch,
    placeholderData: keepPreviousData,
  });

  const leads = leadsQuery.data;
  const customers = customersQuery.data;
  const opportunities = opportunitiesQuery.data;
  const tasks = tasksQuery.data;
  const users = usersQuery.data;

  const results = [leadsQuery, customersQuery, opportunitiesQuery, tasksQuery, usersQuery];
  const anyPending = shouldSearch && results.some((r) => r.isPending || r.isFetching);
  const anyError = shouldSearch && !anyPending && results.some((r) => r.isError);
  const refetchAll = () => results.forEach((r) => r.refetch());

  const groups = useMemo(() => {
    const esc = (s: string) => encodeURIComponent(s || '');
    const list: ResultItem[] = [];
    (leads || []).forEach((l: any) =>
      list.push({
        key: `lead-${l._id}`, type: 'lead', title: l.name,
        subtitle: [l.company, l.email].filter(Boolean).join(' · ') || 'Lead',
        to: `/leads?search=${esc(l.name)}`,
      }),
    );
    (customers || []).forEach((c: any) =>
      list.push({
        key: `customer-${c._id}`, type: 'customer', title: c.name,
        subtitle: [c.company, c.email].filter(Boolean).join(' · ') || 'Customer',
        to: `/customers?search=${esc(c.name)}`,
      }),
    );
    (opportunities || []).forEach((o: any) =>
      list.push({
        key: `opportunity-${o._id}`, type: 'opportunity', title: o.title,
        subtitle: [o.customer?.name, o.stage].filter(Boolean).join(' · ') || 'Deal',
        to: `/pipeline?search=${esc(o.title)}`,
      }),
    );
    (tasks || []).forEach((t: any) =>
      list.push({
        key: `task-${t._id}`, type: 'task', title: t.title,
        subtitle: [t.status, t.assignedTo?.name].filter(Boolean).join(' · ') || 'Task',
        to: `/tasks?search=${esc(t.title)}`,
      }),
    );
    (users || []).forEach((u: any) =>
      list.push({
        key: `user-${u._id}`, type: 'user', title: u.name,
        subtitle: [u.email, u.role].filter(Boolean).join(' · ') || 'Team member',
        to: `/team?search=${esc(u.name)}`,
      }),
    );
    return list;
  }, [leads, customers, opportunities, tasks, users]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // "/" focuses the search box from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Reset highlight whenever the result set changes
  useEffect(() => {
    setActiveIndex(groups.length ? 0 : -1);
  }, [groups]);

  // Keep the highlighted row in view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  const goTo = (item: ResultItem) => {
    setOpen(false);
    inputRef.current?.blur();
    navigate(item.to);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (groups.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % groups.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + groups.length) % groups.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = groups[activeIndex >= 0 ? activeIndex : 0];
      if (item) goTo(item);
    }
  };

  // Render results grouped by type
  const renderedGroups: { meta: { label: string; Icon: any }; items: { item: ResultItem; idx: number }[] }[] = [];
  groups.forEach((item, idx) => {
    const last = renderedGroups[renderedGroups.length - 1];
    if (last && last.meta.label === GROUP_META[item.type].label) last.items.push({ item, idx });
    else renderedGroups.push({ meta: GROUP_META[item.type], items: [{ item, idx }] });
  });

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-dark-500 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search leads, deals, tasks…"
          aria-label="Global search"
          role="combobox"
          aria-expanded={open}
          className="input-field pl-9 pr-8 !w-full"
        />
        <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
          text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-dark-700
          border border-surface-200 dark:border-dark-600 text-surface-400 dark:text-dark-500">
          /
        </kbd>
      </div>

      {open && trimmed.length > 0 && (
        <div
          ref={listRef}
          className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto
            bg-white border border-surface-200 rounded shadow-elevated p-2
            dark:bg-dark-800 dark:border-dark-600 animate-scale-in z-40"
        >
          {anyPending && (
            <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-surface-400 dark:text-dark-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </p>
          )}

          {!anyPending && anyError && groups.length === 0 && (
            <div className="px-3 py-6 text-center">
              <CloudOff className="w-6 h-6 mx-auto text-surface-300 dark:text-dark-600" />
              <p className="mt-2 text-sm font-medium text-surface-700 dark:text-dark-200">
                Couldn&apos;t load search results
              </p>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">
                Check your connection, then try again.
              </p>
              <button onClick={refetchAll} className="btn-secondary !text-xs !px-3 !py-1.5 mt-3">
                <Loader2 className={`w-3.5 h-3.5 ${anyPending ? 'animate-spin' : ''}`} /> Retry search
              </button>
            </div>
          )}

          {!anyPending && !anyError && groups.length === 0 && (
            <div className="px-3 py-6 text-center">
              <Search className="w-6 h-6 mx-auto text-surface-300 dark:text-dark-600" />
              <p className="mt-2 text-sm text-surface-500 dark:text-dark-400">
                No results for <span className="font-semibold">“{trimmed}”</span>
              </p>
              <p className="text-xs text-surface-400 dark:text-dark-500 mt-0.5">
                Try a name, company or deal title
              </p>
            </div>
          )}

          {renderedGroups.map(({ meta, items }) => (
            <div key={meta.label} className="mb-1 last:mb-0">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-surface-400 dark:text-dark-500">
                {meta.label}
              </p>
              {items.map(({ item, idx }) => {
                const Icon = meta.Icon;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-idx={idx}
                    onClick={() => goTo(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors duration-100
                      ${isActive ? 'bg-primary-50 dark:bg-primary-500/15' : 'hover:bg-surface-50 dark:hover:bg-dark-700/60'}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                        ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-100 text-surface-500 dark:bg-dark-700 dark:text-dark-400'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium truncate ${
                          isActive
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-surface-800 dark:text-dark-100'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="block text-xs text-surface-400 dark:text-dark-500 truncate">
                        {item.subtitle}
                      </span>
                    </span>
                    {isActive && <CornerDownLeft className="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />}
                  </button>
                );
              })}
            </div>
          ))}

          {groups.length > 0 && (
            <div className="flex items-center gap-3 mt-2 px-3 py-2 border-t border-surface-200 dark:border-dark-700">
              {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([k, label]) => (
                <span key={k} className="flex items-center gap-1 text-[11px] text-surface-400 dark:text-dark-500">
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-dark-700 border border-surface-200 dark:border-dark-600 font-medium">
                    {k}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
