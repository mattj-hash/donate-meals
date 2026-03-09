import Link from 'next/link';
import { requireAdminPageSession } from '@/lib/auth/guards';
import { listDonations } from '@/lib/repositories/donations';
import { formatDateTime, formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import { DonationStatus } from '@/types/db';

const tabs: Array<{ label: string; value: DonationStatus }> = [
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Needs Info', value: 'needs_info' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: DonationStatus;
    q?: string;
    city?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const session = await requireAdminPageSession();
  const params = await searchParams;

  const status = (params.status || 'pending_review') as DonationStatus;

  const donations = await listDonations({
    status,
    query: params.q,
    city: params.city,
    startDate: params.start,
    endDate: params.end,
    limit: 200
  });

  const tabQuery = new URLSearchParams();
  if (params.q) tabQuery.set('q', params.q);
  if (params.city) tabQuery.set('city', params.city);
  if (params.start) tabQuery.set('start', params.start);
  if (params.end) tabQuery.set('end', params.end);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Review Queue</h1>
          <p className="mt-1 text-sm text-slate-600">Signed in as {session.email}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/settings" className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100">
            Settings
          </Link>
          <Link href="/admin/logout" className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100">
            Log out
          </Link>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const query = new URLSearchParams(tabQuery);
          query.set('status', tab.value);
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin?${query.toString()}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <form className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5" method="GET">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={params.q || ''}
          placeholder="Search donor or email"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          name="city"
          defaultValue={params.city || ''}
          placeholder="Dropoff city"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input name="start" type="date" defaultValue={params.start || ''} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input name="end" type="date" defaultValue={params.end || ''} className="rounded-lg border border-slate-300 px-3 py-2" />
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Submitted</th>
              <th className="px-3 py-2 font-semibold">Donor</th>
              <th className="px-3 py-2 font-semibold">Meals</th>
              <th className="px-3 py-2 font-semibold">Total FMV</th>
              <th className="px-3 py-2 font-semibold">Dropoff city</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Assigned admin</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">{formatDateTime(donation.created_at)}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/donations/${donation.id}`} className="font-semibold text-slate-900 underline underline-offset-4">
                    {donation.donor_business_name}
                  </Link>
                  <div className="text-xs text-slate-500">{donation.donor_email}</div>
                </td>
                <td className="px-3 py-2">{donation.meal_count}</td>
                <td className="px-3 py-2">{formatMoney(donation.fmv_total)}</td>
                <td className="px-3 py-2">{donation.dropoff_city}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={donation.status} />
                </td>
                <td className="px-3 py-2">{donation.assigned_admin_email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {donations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">No donations found for the current filters.</p>
        ) : null}
      </div>
    </main>
  );
}
