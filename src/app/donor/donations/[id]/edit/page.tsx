import { redirect } from 'next/navigation';
import { getDonationById } from '@/lib/repositories/donations';
import { getDonorSessionForDonation } from '@/lib/auth/guards';

export default async function DonorEditDonationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donation = await getDonationById(id);

  if (!donation) {
    redirect('/');
  }

  const donorSession = await getDonorSessionForDonation(donation.id, donation.donor_email);
  if (!donorSession) {
    redirect(`/donor/donations/${donation.id}`);
  }

  if (donation.status !== 'needs_info') {
    redirect(`/donor/donations/${donation.id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Update donation details</h1>
        <p className="mt-2 text-sm text-slate-700">Admin message: {donation.needs_info_message}</p>

        <form
          className="mt-6 space-y-4"
          action={`/api/donor/donations/${donation.id}/edit`}
          method="POST"
          encType="multipart/form-data"
        >
          <label className="block space-y-1">
            <span className="text-sm font-medium">Meal count *</span>
            <input
              name="mealCount"
              type="number"
              min={1}
              required
              defaultValue={donation.meal_count}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Meal description *</span>
            <textarea
              name="mealDescription"
              rows={4}
              required
              defaultValue={donation.meal_description}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Dietary / packaging notes</span>
            <textarea
              name="dietaryPackagingNotes"
              rows={3}
              defaultValue={donation.dietary_packaging_notes ?? ''}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Dropoff site name</span>
              <input
                name="dropoffSiteName"
                defaultValue={donation.dropoff_site_name ?? ''}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Address 1 *</span>
              <input
                name="dropoffAddress1"
                required
                defaultValue={donation.dropoff_address1}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Address 2</span>
              <input
                name="dropoffAddress2"
                defaultValue={donation.dropoff_address2 ?? ''}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">City *</span>
              <input
                name="dropoffCity"
                required
                defaultValue={donation.dropoff_city}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">State *</span>
              <input
                name="dropoffState"
                required
                defaultValue={donation.dropoff_state}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">ZIP *</span>
              <input
                name="dropoffZip"
                required
                defaultValue={donation.dropoff_zip}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">FMV per meal</span>
              <input
                name="fmvPerMealInput"
                defaultValue={donation.fmv_per_meal ?? ''}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Total FMV</span>
              <input
                name="fmvTotalInput"
                defaultValue={donation.fmv_total ?? ''}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Message to reviewer (optional)</span>
            <textarea
              name="messageToAdmin"
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Anything changed or clarified for the review team?"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Additional meal photos (optional)</span>
            <input
              name="mealPhotos"
              type="file"
              accept="image/*"
              multiple
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Updated invoice / packing slip (optional)</span>
            <input
              name="invoiceFile"
              type="file"
              accept="application/pdf,image/*"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <button type="submit" className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white">
            Submit updates
          </button>
        </form>
      </section>
    </main>
  );
}
