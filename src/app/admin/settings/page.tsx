import Link from 'next/link';
import { requireAdminPageSession } from '@/lib/auth/guards';
import { getAdminSettings } from '@/lib/repositories/donations';

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>; 
}) {
  const session = await requireAdminPageSession();
  const settings = await getAdminSettings();
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin" className="text-sm font-semibold text-slate-700 underline underline-offset-4">
        ← Back to dashboard
      </Link>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin settings</h1>
        <p className="mt-2 text-sm text-slate-600">Configure receipt signer and default disclaimer text.</p>

        {params.saved ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Settings saved.
          </p>
        ) : null}

        <form action="/api/admin/settings" method="POST" className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Signer name</span>
            <input
              name="signerName"
              defaultValue={settings?.signer_name ?? 'Rethink Food Team'}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Signer title</span>
            <input
              name="signerTitle"
              defaultValue={settings?.signer_title ?? 'Authorized Representative'}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="includeDonorReportedFmv"
              defaultChecked={settings?.include_donor_reported_fmv ?? true}
            />
            Include donor-reported FMV statement on receipts by default
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Receipt footer/disclaimer</span>
            <textarea
              name="receiptDisclaimer"
              rows={5}
              required
              defaultValue={
                settings?.receipt_disclaimer ||
                'This acknowledgment is provided for substantiation purposes. It does not constitute legal or tax advice. Please consult your tax advisor regarding deductibility and valuation.'
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">
            Save settings
          </button>
        </form>

        <p className="mt-5 text-xs text-slate-500">Signed in as {session.email}</p>
      </section>
    </main>
  );
}
