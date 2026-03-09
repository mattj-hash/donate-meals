import { NextResponse } from 'next/server';
import { getDonorSession } from '@/lib/auth/session';
import {
  getDonationById,
  insertAuditLog,
  updateDonationFromDonor
} from '@/lib/repositories/donations';
import { donorEditSchema } from '@/lib/validation';
import { normalizeFmv } from '@/lib/fmv';
import { uploadDonationAssets, validateInvoice, validateMealPhotos } from '@/lib/uploads';
import { sendEmail } from '@/lib/email';
import { getAdminNotificationEmails } from '@/lib/config';
import { adminDonorResubmittedEmail } from '@/lib/email/templates';
import { appUrl } from '@/lib/urls';
import { captureException } from '@/lib/error-tracker';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const donation = await getDonationById(id);
    if (!donation) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const donorSession = await getDonorSession();
    if (!donorSession) {
      return NextResponse.redirect(new URL(`/donor/donations/${id}`, request.url));
    }

    if (
      donorSession.donationId !== donation.id ||
      donorSession.email.toLowerCase() !== donation.donor_email.toLowerCase()
    ) {
      return NextResponse.redirect(new URL(`/donor/donations/${id}`, request.url));
    }

    const formData = await request.formData();

    const payload = donorEditSchema.parse({
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
      messageToAdmin: formData.get('messageToAdmin')
    });

    const fmv = normalizeFmv({
      mealCount: payload.mealCount,
      fmvPerMeal: payload.fmvPerMealInput,
      fmvTotal: payload.fmvTotalInput
    });

    const updated = await updateDonationFromDonor({
      donationId: donation.id,
      donorEmail: donorSession.email,
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
      messageToAdmin: payload.messageToAdmin
    });

    if (!updated) {
      return NextResponse.redirect(new URL(`/donor/donations/${id}?error=update-failed`, request.url));
    }

    const photos = formData
      .getAll('mealPhotos')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const invoiceEntry = formData.get('invoiceFile');
    const invoice = invoiceEntry instanceof File && invoiceEntry.size > 0 ? invoiceEntry : null;

    validateMealPhotos(photos, false);
    validateInvoice(invoice);

    if (photos.length > 0 || invoice) {
      await uploadDonationAssets({
        donationId: donation.id,
        photos,
        invoice
      });

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'donor',
        actorEmail: donorSession.email,
        actionType: 'donor_uploaded_additional_assets',
        afterJson: {
          photos: photos.length,
          invoice: Boolean(invoice)
        }
      });
    }

    try {
      const notice = adminDonorResubmittedEmail({
        donationId: donation.id,
        donorBusinessName: donation.donor_business_name,
        donorEmail: donation.donor_email,
        reviewUrl: appUrl(`/admin/donations/${donation.id}`)
      });

      await sendEmail({
        to: getAdminNotificationEmails(),
        subject: notice.subject,
        text: notice.text
      });

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'emails_sent_donor_resubmission',
        afterJson: {
          admins: getAdminNotificationEmails()
        }
      });
    } catch (emailError) {
      captureException(emailError, { donationId: donation.id, action: 'resubmission_email_failed' });
    }

    return NextResponse.redirect(new URL(`/donor/donations/${donation.id}?updated=1`, request.url));
  } catch (error) {
    captureException(error, { donationId: id, action: 'donor_edit_failed' });
    return NextResponse.redirect(new URL(`/donor/donations/${id}?error=validation`, request.url));
  }
}
