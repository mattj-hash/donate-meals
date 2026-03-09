import Link from 'next/link';
import { getDonorSession } from '@/lib/auth/session';
import { verifyReceiptDownloadToken } from '@/lib/receipt-access';
import { getDonationByReceiptCode } from '@/lib/repositories/donations';
import { formatDateTime } from '@/lib/utils';

export default async function ReceiptVerificationPage({
  params,
  searchParams
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { code } = await params;
  const query = await searchParams;

  const donation = await getDonationByReceiptCode(code);

  if (!donation || donation.status !== 'approved') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Receipt verification</h1>
          <p className="mt-3 text-red-700">Status: invalid or not approved.</p>
        </section>
      </main>
    );
  }

  const donorSession = await getDonorSession();
  const sessionAuthorized =
    donorSession?.email.toLowerCase() === donation.donor_email.toLowerCase() && donorSession.donationId === donation.id;

  const tokenAuthorized =
    typeof query.token === 'string'
      ? verifyReceiptDownloadToken(query.token, donation.receipt_code || '', donation.donor_email)
      : false;

  const canDownload = sessionAuthorized || tokenAuthorized;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <section className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Receipt verification</h1>
        <p className="mt-3 text-emerald-800">Status: valid / approved</p>

        <dl className="mt-5 grid gap-2 text-sm text-slate-700">
          <div>
            <dt className="font-semibold">Receipt code</dt>
            <dd>{donation.receipt_code}</dd>
          </div>
          <div>
            <dt className="font-semibold">Donor</dt>
            <dd>{donation.donor_business_name}</dd>
          </div>
          <div>
            <dt className="font-semibold">Acknowledgment date</dt>
            <dd>{formatDateTime(donation.approval_date)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Meal count</dt>
            <dd>{donation.meal_count}</dd>
          </div>
        </dl>

        {canDownload ? (
          <Link
            href={
              query.token
                ? `/api/receipt/${code}/download?token=${encodeURIComponent(query.token)}`
                : `/api/receipt/${code}/download`
            }
            className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Download acknowledgment PDF
          </Link>
        ) : (
          <p className="mt-5 text-sm text-slate-700">
            Download access requires donor authentication or a signed token link from receipt email.
          </p>
        )}
      </section>
    </main>
  );
}
