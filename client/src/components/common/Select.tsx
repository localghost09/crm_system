import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  /** Extra classes for the wrapper (e.g. a width like 'sm:w-40') */
  className?: string;
}

interface PanelPos {
  left: number;
  /** top edge from viewport top, or bottom edge from viewport bottom when opening upward */
  top?: number;
  bottom?: number;
  width: number;
  openUp: boolean;
}

const normalizeOptions = (options: (SelectOption | string)[]): SelectOption[] =>
  options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

/**
 * Modern replacement for the native <select>.
 * Trigger is styled exactly like .input-field; the option list is rendered
 * in a portal on <body> with fixed positioning, so it always floats above
 * tables, cards and modals (no z-index / overflow clipping surprises).
 * Keyboard navigation (↑ ↓ Enter Esc) and type-ahead (type while open).
 */
const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeAhead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({ buffer: '', timer: null });

  const opts = useMemo(() => normalizeOptions(options), [options]);
  const selected = opts.find((o) => o.value === value);

  const close = () => {
    setOpen(false);
    setPos(null);
  };

  const openDropdown = () => {
    if (disabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 180), 280);
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 280 && rect.top > spaceBelow;
    setPos({
      left,
      width,
      openUp,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }),
    });
    const idx = opts.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  // Close on outside click / Escape / scroll-away / resize.
  // Escape is captured (capture phase + stopPropagation) so that when the
  // select is used inside a Modal, Esc closes only the dropdown — the
  // Modal's own document-level Esc listener never sees the event.
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
    const onScroll = (e: Event) => {
      // Ignore scrolling *inside* the option list, close when the page/modal scrolls
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      close();
    };
    const onResize = () => close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // Keep the highlighted option visible while navigating
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  const selectOption = (idx: number) => {
    const opt = opts[idx];
    if (!opt) return;
    onChange(opt.value);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openDropdown();
        else setActiveIndex((i) => Math.min(i + 1, opts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openDropdown();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) selectOption(activeIndex);
        else openDropdown();
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
        // Type-ahead while open
        if (open && e.key.length === 1 && /\S/.test(e.key)) {
          const ref = typeAhead.current;
          if (ref.timer) clearTimeout(ref.timer);
          ref.buffer += e.key.toLowerCase();
          ref.timer = setTimeout(() => { ref.buffer = ''; }, 600);
          const idx = opts.findIndex((o) => o.label.toLowerCase().startsWith(ref.buffer));
          if (idx >= 0) setActiveIndex(idx);
        }
    }
  };

  const panel =
    open && pos ? (
      createPortal(
        <div
          ref={panelRef}
          className={`fixed z-[60] animate-scale-in ${pos.openUp ? 'origin-bottom' : 'origin-top'}`}
          style={{ left: pos.left, width: pos.width, ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }) }}
        >
          <div
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1.5 bg-white border border-surface-200 rounded shadow-elevated
              dark:bg-dark-800 dark:border-dark-600"
          >
            {opts.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-surface-400 dark:text-dark-500">No options</p>
            ) : (
              opts.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <div
                    key={opt.value || i}
                    data-idx={i}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(i)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded text-sm cursor-pointer
                      transition-colors duration-100
                      ${isActive ? 'bg-surface-100 dark:bg-dark-700' : ''}
                      ${
                        isSelected
                          ? 'text-primary-700 dark:text-primary-300 font-semibold'
                          : 'text-surface-700 dark:text-dark-200'
                      }`}
                  >
                    <span className="truncate max-w-[200px]">{opt.label}</span>
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-primary-600 dark:text-primary-400' : 'text-primary-500 dark:text-primary-400'
                        }`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )
    ) : null;

  return (
    <>
      <div ref={rootRef} className={`relative ${className || ''}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : openDropdown())}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`select-trigger ${
            open ? 'border-primary-400 dark:border-primary-500 ring-2 ring-primary-500/20' : ''
          }`}
        >
          <span className={`truncate ${selected ? '' : 'text-surface-400 dark:text-dark-500'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 text-surface-400 dark:text-dark-500 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
      {panel}
    </>
  );
};

export default Select;
