import { NextResponse } from 'next/server';
import { donationInputSchema } from '@/lib/validation';
import { normalizeFmv } from '@/lib/fmv';
import { getClientIp, normalizeDatetime } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';
import { createDonation, insertAuditLog } from '@/lib/repositories/donations';
import { uploadDonationAssets, validateInvoice, validateMealPhotos } from '@/lib/uploads';
import { createMagicToken } from '@/lib/auth/tokens';
import { appUrl } from '@/lib/urls';
import { sendEmail } from '@/lib/email';
import { getAdminNotificationEmails } from '@/lib/config';
import {
  adminNewSubmissionEmail,
  donorSubmissionReceivedEmail
} from '@/lib/email/templates';
import { captureException } from '@/lib/error-tracker';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limiter = rateLimit(`donation:${ip}`, 10, 5 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many submissions. Please try again shortly.' }, { status: 429 });
    }

    const formData = await request.formData();
    const botField = String(formData.get('botField') || '').trim();
    if (botField) {
      return NextResponse.json({ ok: true, id: 'ignored' }, { status: 200 });
    }

    const startedAt = Number.parseInt(String(formData.get('clientStartedAt') || '0'), 10);
    if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 1200) {
      return NextResponse.json({ error: 'Submission was too fast. Please try again.' }, { status: 400 });
    }

    const payload = donationInputSchema.parse({
      donorBusinessName: formData.get('donorBusinessName'),
      donorContactName: formData.get('donorContactName'),
      donorEmail: formData.get('donorEmail'),
      donorPhone: formData.get('donorPhone'),
      donationDatetime: formData.get('donationDatetime'),
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
      botField
    });

    const photos = formData
      .getAll('mealPhotos')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const invoice = formData.get('invoiceFile');
    const invoiceFile = invoice instanceof File && invoice.size > 0 ? invoice : null;

    validateMealPhotos(photos);
    validateInvoice(invoiceFile);

    const fmv = normalizeFmv({
      mealCount: payload.mealCount,
      fmvPerMeal: payload.fmvPerMealInput,
      fmvTotal: payload.fmvTotalInput
    });

    const donation = await createDonation({
      donorBusinessName: payload.donorBusinessName,
      donorContactName: payload.donorContactName,
      donorEmail: payload.donorEmail,
      donorPhone: payload.donorPhone,
      donationDatetime: normalizeDatetime(payload.donationDatetime),
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
      fmvTotal: fmv.fmvTotal
    });

    await uploadDonationAssets({
      donationId: donation.id,
      photos,
      invoice: invoiceFile
    });

    await insertAuditLog({
      donationId: donation.id,
      actorType: 'donor',
      actorEmail: donation.donor_email,
      actionType: 'submitted',
      afterJson: donation
    });

    const donorToken = await createMagicToken({
      tokenType: 'donor_verify',
      email: donation.donor_email,
      donationId: donation.id,
      ttlMinutes: 60 * 24 * 7
    });

    const verifyUrl = appUrl(`/auth/consume?token=${encodeURIComponent(donorToken.token)}`);
    const adminReviewUrl = appUrl(`/admin/donations/${donation.id}`);

    const donorEmail = donorSubmissionReceivedEmail({
      donation: {
        id: donation.id,
        donorBusinessName: donation.donor_business_name,
        donorContactName: donation.donor_contact_name,
        donorEmail: donation.donor_email,
        donationDateTime: donation.donation_datetime,
        mealCount: donation.meal_count,
        mealDescription: donation.meal_description,
        dropoffCity: donation.dropoff_city,
        fmvTotal: donation.fmv_total ? Number.parseFloat(donation.fmv_total) : null
      },
      verifyUrl
    });

    const adminEmail = adminNewSubmissionEmail({
      donation: {
        id: donation.id,
        donorBusinessName: donation.donor_business_name,
        donorContactName: donation.donor_contact_name,
        donorEmail: donation.donor_email,
        donationDateTime: donation.donation_datetime,
        mealCount: donation.meal_count,
        mealDescription: donation.meal_description,
        dropoffCity: donation.dropoff_city,
        fmvTotal: donation.fmv_total ? Number.parseFloat(donation.fmv_total) : null
      },
      reviewUrl: adminReviewUrl
    });

    try {
      await sendEmail({
        to: donation.donor_email,
        subject: donorEmail.subject,
        text: donorEmail.text,
        replyTo: 'donatemeals@rethinkfood.org'
      });

      await sendEmail({
        to: getAdminNotificationEmails(),
        subject: adminEmail.subject,
        text: adminEmail.text
      });

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'emails_sent_submission',
        afterJson: {
          donor: donation.donor_email,
          admins: getAdminNotificationEmails()
        }
      });
    } catch (emailError) {
      captureException(emailError, {
        donationId: donation.id,
        action: 'submission_emails_failed'
      });

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'emails_failed_submission',
        afterJson: {
          message: emailError instanceof Error ? emailError.message : String(emailError)
        }
      });
    }

    return NextResponse.json({ id: donation.id });
  } catch (error) {
    captureException(error, { action: 'donation_submit_failed' });
    const message = error instanceof Error ? error.message : 'Unable to submit donation.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
