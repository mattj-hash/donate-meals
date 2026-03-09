import { cn } from '@/lib/utils';
import { DonationStatus } from '@/types/db';

const statusMap: Record<DonationStatus, { label: string; className: string }> = {
  pending_review: {
    label: 'Pending Review',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  needs_info: {
    label: 'Needs Info',
    className: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200'
  }
};

export function StatusBadge({ status }: { status: DonationStatus }) {
  const style = statusMap[status];

  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', style.className)}>
      {style.label}
    </span>
  );
}
