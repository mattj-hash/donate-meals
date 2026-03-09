import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/guards';
import { adminDonationUpdateSchema } from '@/lib/validation';
import { normalizeFmv } from '@/lib/fmv';
import { updateDonationFromAdmin } from '@/lib/repositories/donations';
import { captureException } from '@/lib/error-tracker';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const payload = adminDonationUpdateSchema.parse({
      mealCount: formData.get('mealCount'),
      mealDescription: formData.get('mealDescription'),
      dietaryPackagingNotes: formData.get('dietaryPackagingNotes'),
      dropoffSiteName: formData.get('dropoffSiteName'),
      dropoffAddress1: formData.get('dropoffAddress1'),
      dropoffAddress2: formData.get('dropoffAddress2'),
      dropoffCity: formData.get('dropoffCity'),
      dropoffState: formData.get('dropoffState'),
      dropoffZip: formData.get('dropoffZip'),
      fmvPerMealInput: formData.get('fmvPerMealInput'),
      fmvTotalInput: formData.get('fmvTotalInput'),
      internalNote: formData.get('internalNote')
    });

    const fmv = normalizeFmv({
      mealCount: payload.mealCount,
      fmvPerMeal: payload.fmvPerMealInput,
      fmvTotal: payload.fmvTotalInput
    });

    await updateDonationFromAdmin({
      donationId: id,
      mealCount: payload.mealCount,
      mealDescription: payload.mealDescription,
      dietaryPackagingNotes: payload.dietaryPackagingNotes,
      dropoffSiteName: payload.dropoffSiteName,
      dropoffAddress1: payload.dropoffAddress1,
      dropoffAddress2: payload.dropoffAddress2,
      dropoffCity: payload.dropoffCity,
      dropoffState: payload.dropoffState,
      dropoffZip: payload.dropoffZip,
      fmvPerMeal: fmv.fmvPerMeal,
      fmvTotal: fmv.fmvTotal,
      internalNote: payload.internalNote,
      actorEmail: auth.session.email
    });

    return NextResponse.redirect(new URL(`/admin/donations/${id}?updated=1`, request.url));
  } catch (error) {
    captureException(error, { donationId: id, action: 'admin_update_failed' });
    return NextResponse.redirect(new URL(`/admin/donations/${id}?error=update-failed`, request.url));
  }
}
