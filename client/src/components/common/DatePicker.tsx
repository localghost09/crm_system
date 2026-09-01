import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eraser } from 'lucide-react';

interface DatePickerProps {
  /** '' | 'YYYY-MM-DD' | 'YYYY-MM-DDTHH:mm' (when withTime) */
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Extra classes for the wrapper (e.g. a width like 'sm:w-48') */
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseDate = (s: string): Date | null => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
};
const parseTime = (s: string): { h: number; m: number } | null => {
  const m = s.match(/^.*?T(\d{2}):(\d{2})/);
  return m ? { h: +m[1], m: +m[2] } : null;
};
const formatTime = (h: number, m: number) =>
  new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h12 = i % 12 === 0 ? 12 : i % 12;
  return { value: String(i), label: `${h12} ${i < 12 ? 'AM' : 'PM'}` };
});
const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: pad(i * 5),
  label: pad(i * 5),
}));

/**
 * Modern calendar picker that replaces the native <input type="date">.
 * The calendar panel is rendered in a portal on <body> (fixed positioning)
 * so it always floats above tables, cards and modals.
 * Supports date-only and date+time values, keyboard navigation
 * (arrows / Enter / Esc / PgUp / PgDn) and quick Today & Clear actions.
 */
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  withTime = false,
  placeholder = 'Select date',
  disabled,
  className,
}) => {
  const now = new Date();
  const selectedDate = parseDate(value);
  const selectedTime = parseTime(value);

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => (selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 1)));
  const [activeDate, setActiveDate] = useState<Date>(selectedDate || now);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number; openUp: boolean } | null>(null);
  const [time, setTime] = useState<{ h: number; m: number }>(selectedTime || { h: 9, m: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setPos(null);
  };

  const openPicker = () => {
    if (disabled || !triggerRef.current) return;
    const base = selectedDate || now;
    setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
    setActiveDate(base);
    setTime(selectedTime || { h: 9, m: 0 });
    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 380 && rect.top > spaceBelow;
    setPos({
      left,
      width,
      openUp,
      ...(openUp ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
    });
    setOpen(true);
  };

  // Close on outside click / Escape / resize
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    const onResize = () => close();
    const onScroll = (e: Event) => {
      // Ignore scrolling inside the calendar itself
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  // Focus the grid when opened so keyboard navigation works
  useEffect(() => {
    if (open) gridRef.current?.focus();
  }, [open]);

  const emit = (d: Date) => {
    if (withTime) onChange(`${toISO(d)}T${pad(time.h)}:${pad(time.m)}`);
    else onChange(toISO(d));
  };

  const selectDate = (d: Date) => {
    if (d.getMonth() !== viewDate.getMonth()) setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setActiveDate(d);
    emit(d);
    close();
  };

  const emitTime = (next: { h: number; m: number }) => {
    setTime(next);
    if (selectedDate) onChange(`${toISO(selectedDate)}T${pad(next.h)}:${pad(next.m)}`);
  };

  const goToday = () => {
    setActiveDate(now);
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    emit(now);
    close();
  };

  const shiftMonth = (delta: number) =>
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  const moveActive = (days: number) => {
    setActiveDate((a) => {
      const next = new Date(a.getFullYear(), a.getMonth(), a.getDate() + days);
      setViewDate((v) => (next.getMonth() !== v.getMonth() || next.getFullYear() !== v.getFullYear()
        ? new Date(next.getFullYear(), next.getMonth(), 1)
        : v));
      return next;
    });
  };

  const handleGridKey = (e: React.KeyboardEvent) => {
    const nav: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (e.key in nav) {
      e.preventDefault();
      moveActive(nav[e.key]);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      shiftMonth(-1);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      shiftMonth(1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectDate(activeDate);
    } else if (e.key === 'Tab') {
      close();
    }
  };

  // Calendar grid (Monday first, 42 cells)
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) =>
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - startOffset + i),
  );

  const isoToday = toISO(now);
  const isoSelected = selectedDate ? toISO(selectedDate) : null;
  const isoActive = toISO(activeDate);

  const displayLabel = selectedDate
    ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }) + (withTime ? ` · ${formatTime(time.h, time.m)}` : '')
    : '';

  const panel = open && pos ? (
    createPortal(
      <div
        ref={panelRef}
        className={`fixed z-[60] animate-scale-in ${pos.openUp ? 'origin-bottom' : 'origin-top'}`}
        style={{ left: pos.left, width: pos.width, ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }) }}
      >
        <div className="bg-white border border-surface-200 rounded shadow-elevated p-3.5
          dark:bg-dark-800 dark:border-dark-600">
          {/* Month header */}
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="font-semibold text-surface-900 dark:text-white text-sm">
              {MONTHS[viewDate.getMonth()]} <span className="text-surface-400 dark:text-dark-500">{viewDate.getFullYear()}</span>
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} className="btn-icon !w-8 !h-8" aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => shiftMonth(1)} className="btn-icon !w-8 !h-8" aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <span key={d} className="h-8 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-surface-400 dark:text-dark-500">
                {d}
              </span>
            ))}
          </div>

          {/* Days */}
          <div
            ref={gridRef}
            tabIndex={0}
            role="grid"
            aria-label="Choose a date"
            onKeyDown={handleGridKey}
            className="grid grid-cols-7 gap-1 outline-none"
          >
            {cells.map((d) => {
              const iso = toISO(d);
              const inMonth = d.getMonth() === viewDate.getMonth();
              const isToday = iso === isoToday;
              const isSelected = iso === isoSelected;
              const isActive = iso === isoActive;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectDate(d)}
                  className={`h-9 rounded-lg text-sm transition-all duration-100 focus:outline-none
                    ${isSelected
                      ? 'bg-primary-600 text-white font-medium'
                      : inMonth
                        ? 'text-surface-700 dark:text-dark-200 hover:bg-surface-100 dark:hover:bg-dark-700'
                        : 'text-surface-300 dark:text-dark-600 hover:bg-surface-50 dark:hover:bg-dark-700/50'}
                    ${!isSelected && isToday ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}
                    ${!isSelected && isActive ? 'ring-2 ring-primary-400/70' : ''}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-dark-700">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={goToday} className="btn-ghost !px-2.5 !py-1.5 !text-xs">
                Today
              </button>
              {value && (
                <button type="button" onClick={() => onChange('')} className="btn-ghost !px-2.5 !py-1.5 !text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Eraser className="w-3.5 h-3.5 mr-1" /> Clear
                </button>
              )}
            </div>
            {withTime && (
              <div className="flex items-center gap-1.5">
                <select
                  value={String(time.h)}
                  onChange={(e) => emitTime({ ...time, h: Number(e.target.value) })}
                  aria-label="Hour"
                  className="text-sm font-medium bg-white dark:bg-dark-700 border border-surface-200 dark:border-dark-600 rounded-lg
                    px-2 py-1.5 text-surface-700 dark:text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
                <span className="text-surface-400 text-sm">:</span>
                <select
                  value={pad(time.m)}
                  onChange={(e) => emitTime({ ...time, m: Number(e.target.value) })}
                  aria-label="Minute"
                  className="text-sm font-medium bg-white dark:bg-dark-700 border border-surface-200 dark:border-dark-600 rounded-lg
                    px-2 py-1.5 text-surface-700 dark:text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  {MINUTES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
  ) : null;

  return (
    <>
      <div ref={rootRef} className={`relative ${className || ''}`}>
        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-dark-500 pointer-events-none" />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : openPicker())}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`select-trigger pl-10 ${open ? 'border-primary-400 dark:border-primary-500 ring-2 ring-primary-500/20' : ''}`}
        >
          <span className={`truncate ${displayLabel ? '' : 'text-surface-400 dark:text-dark-500'}`}>
            {displayLabel || placeholder}
          </span>
          <ChevronRight
            className={`w-4 h-4 flex-shrink-0 text-surface-400 dark:text-dark-500 transition-transform duration-200 ${open ? '-rotate-90' : 'rotate-90'}`}
            aria-hidden
          />
        </button>
      </div>
      {panel}
    </>
  );
};

export default DatePicker;
