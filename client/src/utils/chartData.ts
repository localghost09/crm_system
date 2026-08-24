/**
 * Chart data normalization helpers.
 *
 * The dashboard/report aggregations ($group by '%Y-%m') only return months
 * that contain records. Recharts needs at least TWO data points to draw a
 * line segment, so a sparse series (0 or 1 months) renders an empty chart —
 * the "spline" simply never appears.
 *
 * `normalizeMonthlySeries` maps raw aggregation rows onto chart points and,
 * when the series is sparse, pads it with a zero-value neighbor month so the
 * smooth monotone spline always has a segment to draw. Padded points are
 * always 0 — no revenue or customer counts are invented.
 */

export interface MonthlyChartPoint {
  month: string; // 'YYYY-MM'
  [key: string]: number | string;
}

const MONTH_KEY = /^(\d{4})-(\d{2})$/;

/** Get the 'YYYY-MM' string for the current month in local time. */
export const currentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/** Shift a 'YYYY-MM' key by `delta` months (UTC math avoids timezone drift). */
export const shiftMonthKey = (monthKey: string, delta: number): string => {
  const match = MONTH_KEY.exec(monthKey);
  if (!match) return monthKey;
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Normalize a monthly aggregation into chart-ready points.
 *
 * @param rows      Raw aggregation rows, e.g. [{ _id: '2026-08', revenue: 1200 }] or [{ _id: '2026-08', count: 3 }]
 * @param valueKey  Key the chart reads the series from ('revenue', 'customers', …)
 * @param sourceKey Key on each row holding the value ('revenue', 'count', …) — defaults to 'count'
 * @returns Sorted points with a guaranteed minimum of two entries (zero-padded when sparse)
 */
export const normalizeMonthlySeries = (
  rows: Array<Record<string, unknown>> | undefined | null,
  valueKey: string,
  sourceKey = 'count',
): MonthlyChartPoint[] => {
  const byMonth = new Map<string, MonthlyChartPoint>();

  (rows || []).forEach((row) => {
    const key = row?._id;
    if (typeof key !== 'string' || !MONTH_KEY.test(key)) return;
    byMonth.set(key, { month: key, [valueKey]: toNumber(row[sourceKey]) });
  });

  const points = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, point]) => point);

  if (points.length >= 2) return points;

  // Sparse series — anchor on the real point (or the current month when empty)
  // and prepend its previous month as a zero baseline.
  const anchor = points[0]?.month ?? currentMonthKey();
  return [
    { month: shiftMonthKey(anchor, -1), [valueKey]: 0 },
    { month: anchor, [valueKey]: points[0]?.[valueKey] ?? 0 },
  ];
};
