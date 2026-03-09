import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPageSession } from '@/lib/auth/guards';
import {
  getAdminSettings,
  getDonationAuditLog,
  getDonationById,
  getDonationMessages,
  getDonationPhotos
} from '@/lib/repositories/donations';
import { getSignedObjectUrl } from '@/lib/storage';
import { formatDateTime, formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';

export default async function AdminDonationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; acted?: string; settings?: string; error?: string }>;
}) {
  const session = await requireAdminPageSession();
  const { id } = await params;
  const query = await searchParams;

  const donation = await getDonationById(id);
  if (!donation) {
    notFound();
  }

  const [photos, messages, auditLog, settings] = await Promise.all([
    getDonationPhotos(id),
    getDonationMessages(id),
    getDonationAuditLog(id),
    getAdminSettings()
  ]);

  const photoUrls = await Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      signedUrl: await getSignedObjectUrl(photo.s3_key, 60 * 30)
    }))
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin" className="text-sm font-semibold text-slate-700 underline underline-offset-4">
          ← Back to queue
        </Link>
        <StatusBadge status={donation.status} />
      </div>

      {query.updated ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Donation details updated.
        </p>
      ) : null}
      {query.acted ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Action completed.
        </p>
      ) : null}
      {query.error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{query.error}</p>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">{donation.donor_business_name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {donation.donor_contact_name} · {donation.donor_email}
            </p>
            <dl className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <dt className="font-semibold">Submitted</dt>
                <dd>{formatDateTime(donation.created_at)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Donation date/time</dt>
                <dd>{formatDateTime(donation.donation_datetime)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Meal count</dt>
                <dd>{donation.meal_count}</dd>
              </div>
              <div>
                <dt className="font-semibold">Donor-reported FMV</dt>
                <dd>{formatMoney(donation.fmv_total)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Donor email verified</dt>
                <dd>{donation.donor_verified_at ? formatDateTime(donation.donor_verified_at) : 'Not yet'}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-semibold">Description</dt>
                <dd>{donation.meal_description}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-semibold">Dropoff</dt>
                <dd>
                  {[donation.dropoff_site_name, donation.dropoff_address1, donation.dropoff_address2]
                    .filter(Boolean)
                    .join(', ')}
                  {', '}
                  {donation.dropoff_city}, {donation.dropoff_state} {donation.dropoff_zip}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Photo gallery</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {photoUrls
                .filter((photo) => photo.kind === 'meal_photo')
                .map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.signedUrl}
                      alt={photo.file_name}
                      className="h-40 w-full object-cover transition hover:scale-[1.02]"
                    />
                  </a>
                ))}
            </div>

            {photoUrls.some((photo) => photo.kind === 'invoice') ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700">Invoice / packing slips</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {photoUrls
                    .filter((photo) => photo.kind === 'invoice')
                    .map((file) => (
                      <li key={file.id}>
                        <a href={file.signedUrl} target="_blank" rel="noreferrer" className="underline">
                          {file.file_name}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
            <div className="mt-3 space-y-3">
              {messages.length === 0 ? <p className="text-sm text-slate-600">No messages yet.</p> : null}
              {messages.map((message) => (
                <div key={message.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-700">
                    {message.direction.replaceAll('_', ' ')} · {message.actor_email || 'system'}
                  </p>
                  <p className="mt-1 text-slate-700">{message.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(message.created_at)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Audit log</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {auditLog.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="font-semibold">{entry.action_type}</div>
                  <div className="text-xs text-slate-500">
                    {formatDateTime(entry.created_at)} · {entry.actor_type} · {entry.actor_email || 'system'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Admin edit</h2>
            <form action={`/api/admin/donations/${donation.id}/update`} method="POST" className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Meal count</span>
                <input
                  name="mealCount"
                  type="number"
                  min={1}
                  required
                  defaultValue={donation.meal_count}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Meal description</span>
                <textarea
                  name="mealDescription"
                  rows={4}
                  required
                  defaultValue={donation.meal_description}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Dietary/packaging notes</span>
                <textarea
                  name="dietaryPackagingNotes"
                  rows={3}
                  defaultValue={donation.dietary_packaging_notes ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  name="dropoffSiteName"
                  defaultValue={donation.dropoff_site_name ?? ''}
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Dropoff site name"
                />
                <input
                  name="dropoffAddress1"
                  defaultValue={donation.dropoff_address1}
                  required
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Address 1"
                />
                <input
                  name="dropoffAddress2"
                  defaultValue={donation.dropoff_address2 ?? ''}
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Address 2"
                />
                <input
                  name="dropoffCity"
                  defaultValue={donation.dropoff_city}
                  required
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="City"
                />
                <input
                  name="dropoffState"
                  defaultValue={donation.dropoff_state}
                  required
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="State"
                />
                <input
                  name="dropoffZip"
                  defaultValue={donation.dropoff_zip}
                  required
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="ZIP"
                />
                <input
                  name="fmvPerMealInput"
                  defaultValue={donation.fmv_per_meal ?? ''}
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="FMV per meal"
                />
                <input
                  name="fmvTotalInput"
                  defaultValue={donation.fmv_total ?? ''}
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Total FMV"
                />
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Internal note</span>
                <textarea
                  name="internalNote"
                  rows={3}
                  defaultValue={donation.internal_note ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Save edits
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Actions</h2>

            <form action={`/api/admin/donations/${donation.id}/action`} method="POST" className="mt-4 space-y-2">
              <input type="hidden" name="action" value="needs_info" />
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Needs Info message</span>
                <textarea name="message" rows={4} required className="w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Internal note (optional)</span>
                <textarea
                  name="internalNote"
                  rows={2}
                  defaultValue={donation.internal_note ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <button type="submit" className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
                Mark Needs Info
              </button>
            </form>

            <form action={`/api/admin/donations/${donation.id}/action`} method="POST" className="mt-6 space-y-2 border-t border-slate-200 pt-6">
              <input type="hidden" name="action" value="reject" />
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Rejection reason</span>
                <textarea name="reason" rows={3} required className="w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <button type="submit" className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white">
                Reject
              </button>
            </form>

            <form action={`/api/admin/donations/${donation.id}/action`} method="POST" className="mt-6 space-y-2 border-t border-slate-200 pt-6">
              <input type="hidden" name="action" value="approve" />
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Internal note (optional)</span>
                <textarea
                  name="internalNote"
                  rows={2}
                  defaultValue={donation.internal_note ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="goodsServicesProvided" defaultChecked={donation.goods_services_provided} />
                Goods/services provided in exchange for this contribution
              </label>
              <input
                name="quidProQuoDesc"
                defaultValue={donation.quid_pro_quo_desc ?? ''}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Description of goods/services"
              />
              <input
                name="quidProQuoValue"
                defaultValue={donation.quid_pro_quo_value ?? ''}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Good-faith estimate value"
              />

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="includeFmvOnReceipt"
                  defaultChecked={settings?.include_donor_reported_fmv ?? true}
                />
                Include donor-reported FMV statement on receipt
              </label>

              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                Approve + generate receipt
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            <h3 className="font-semibold text-slate-900">Receipt signer settings</h3>
            <p className="mt-1">{settings?.signer_name} · {settings?.signer_title}</p>
            <Link href="/admin/settings" className="mt-2 inline-block underline underline-offset-4">
              Edit signer/disclaimer settings
            </Link>
          </section>
        </div>
      </section>

      <p className="mt-6 text-xs text-slate-500">Reviewer: {session.email}</p>
    </main>
  );
}
