/**
 * Pure presentation helpers for numbers, currency, dates and percentages.
 * Kept free of React so they are trivially unit-testable and reusable on both
 * the server and the client.
 */

import { format, formatDistanceStrict, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const preciseCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatCurrency(
  value: number,
  style: "default" | "compact" | "precise" = "default",
): string {
  switch (style) {
    case "compact":
      return compactCurrencyFormatter.format(value);
    case "precise":
      return preciseCurrencyFormatter.format(value);
    default:
      return currencyFormatter.format(value);
  }
}

export function formatNumber(value: number, compact = false): string {
  return compact
    ? compactNumberFormatter.format(value)
    : numberFormatter.format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** Signed change label, e.g. "+12.4%" / "-3.1%". */
export function formatChange(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatDate(
  value: string | Date,
  pattern = "MMM d, yyyy",
): string {
  try {
    return format(toDate(value), pattern);
  } catch {
    return "—";
  }
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, "MMM d, yyyy 'at' h:mm a");
}

/**
 * "3 hours ago". `base` defaults to now; the dashboard passes the dataset's
 * own "now" so the demo reads consistently regardless of when it is viewed.
 */
export function formatRelativeTime(
  value: string | Date,
  base: Date = new Date(),
): string {
  try {
    const date = toDate(value);
    if (Math.abs(base.getTime() - date.getTime()) < 60_000) return "just now";
    return formatDistanceStrict(date, base, { addSuffix: true });
  } catch {
    return "—";
  }
}

const utcShortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const utcLongDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Labels for time-series buckets. Bucket keys are UTC calendar dates
 * (YYYY-MM-DD), so they are formatted in UTC to avoid off-by-one-day shifts
 * in negative-offset time zones.
 */
export function formatBucketDate(isoDate: string, long = false): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return (long ? utcLongDate : utcShortDate).format(date);
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
