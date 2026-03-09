import Link from 'next/link';
import { getDonationById } from '@/lib/repositories/donations';
import { getDonorSessionForDonation } from '@/lib/auth/guards';
import { formatDateTime, formatMoney } from '@/lib/utils';

function statusLabel(status: string) {
  if (status === 'pending_review') return 'Pending Review';
  if (status === 'needs_info') return 'Needs Info';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return status;
}

export default async function DonorDonationStatusPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donation = await getDonationById(id);

  if (!donation) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="rounded-xl border border-red-200 bg-white p-4 text-red-700">Donation not found.</p>
      </main>
    );
  }

  const donorSession = await getDonorSessionForDonation(donation.id, donation.donor_email);
  if (!donorSession) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Secure link required</h1>
          <p className="mt-2 text-slate-700">
            Open the verification link sent to <strong>{donation.donor_email}</strong> to view this donation.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Donation status</h1>
        <p className="mt-2 text-slate-700">
          Status: <span className="font-semibold">{statusLabel(donation.status)}</span>
        </p>

        <dl className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <div>
            <dt className="font-semibold">Donation date/time</dt>
            <dd>{formatDateTime(donation.donation_datetime)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Meal count</dt>
            <dd>{donation.meal_count}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-semibold">Description</dt>
            <dd>{donation.meal_description}</dd>
          </div>
          <div>
            <dt className="font-semibold">Dropoff city</dt>
            <dd>{donation.dropoff_city}</dd>
          </div>
          <div>
            <dt className="font-semibold">Donor-reported FMV total</dt>
            <dd>{formatMoney(donation.fmv_total)}</dd>
          </div>
        </dl>

        {donation.status === 'needs_info' ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Additional information requested:</p>
            <p className="mt-1 text-sm text-amber-900">{donation.needs_info_message || 'See edit form.'}</p>
            <Link
              href={`/donor/donations/${donation.id}/edit`}
              className="mt-3 inline-block text-sm font-semibold text-amber-900 underline underline-offset-4"
            >
              Edit and resubmit
            </Link>
          </div>
        ) : null}

        {donation.status === 'approved' && donation.receipt_code ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-900">Approved receipt: {donation.receipt_code}</p>
            <Link
              href={`/receipt/${donation.receipt_code}`}
              className="mt-2 inline-block text-sm font-semibold text-emerald-900 underline underline-offset-4"
            >
              View receipt verification page
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
