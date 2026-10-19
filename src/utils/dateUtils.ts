import { ExpiryEvaluation, ExpiryStatus } from '../types';

export const CURRENT_DATE_STR = '2026-10-17';

export function getToday(): Date {
  // Use system current reference
  const now = new Date();
  // Ensure valid date comparison
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = parseDate(dateStr);
  const today = getToday();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function evaluateExpiry(dateStr?: string): ExpiryEvaluation {
  if (!dateStr) {
    return {
      status: 'none',
      daysRemaining: null,
      formattedDate: '—',
      label: 'Not set',
    };
  }

  const days = getDaysRemaining(dateStr);
  const formatted = formatDate(dateStr);

  if (days === null) {
    return {
      status: 'none',
      daysRemaining: null,
      formattedDate: '—',
      label: 'N/A',
    };
  }

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: days,
      formattedDate: formatted,
      label: `Expired (${Math.abs(days)}d ago)`,
    };
  }

  if (days <= 30) {
    return {
      status: 'critical',
      daysRemaining: days,
      formattedDate: formatted,
      label: days === 0 ? 'Expires today' : `Expires in ${days}d`,
    };
  }

  if (days <= 60) {
    return {
      status: 'warning',
      daysRemaining: days,
      formattedDate: formatted,
      label: `Expires in ${days}d`,
    };
  }

  return {
    status: 'valid',
    daysRemaining: days,
    formattedDate: formatted,
    label: `Valid (${days}d left)`,
  };
}

export function getStatusBadgeClasses(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-600/20';
    case 'critical':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/20 font-medium';
    case 'warning':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'valid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}
