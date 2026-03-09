import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/guards';
import { adminDonationActionSchema } from '@/lib/validation';
import {
  getAdminSettings,
  getDonationById,
  getDonationByReceiptCode,
  insertAuditLog,
  markReceiptSent,
  setDonationApproved,
  setDonationNeedsInfo,
  setDonationRejected
} from '@/lib/repositories/donations';
import { createMagicToken } from '@/lib/auth/tokens';
import { appUrl } from '@/lib/urls';
import { sendEmail } from '@/lib/email';
import {
  adminApprovedEmail,
  donorApprovedEmail,
  donorNeedsInfoEmail,
  donorRejectedEmail,
  donorVerificationRequiredEmail
} from '@/lib/email/templates';
import { captureException } from '@/lib/error-tracker';
import { generateReceiptCode } from '@/lib/receipt-code';
import { generateReceiptPdf } from '@/lib/receipt-pdf';
import { buildStorageKey, uploadObject } from '@/lib/storage';
import { createReceiptDownloadToken } from '@/lib/receipt-access';
import { getAdminNotificationEmails } from '@/lib/config';

export const runtime = 'nodejs';

async function generateUniqueReceiptCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateReceiptCode();
    const existing = await getDonationByReceiptCode(candidate);
    if (!existing) return candidate;
  }

  throw new Error('Unable to generate unique receipt code.');
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const donation = await getDonationById(id);
    if (!donation) {
      return NextResponse.redirect(new URL('/admin?error=not-found', request.url));
    }

    const formData = await request.formData();
    const payload = adminDonationActionSchema.parse({
      action: formData.get('action'),
      message: formData.get('message'),
      reason: formData.get('reason'),
      internalNote: formData.get('internalNote'),
      goodsServicesProvided: formData.get('goodsServicesProvided') ?? '',
      quidProQuoDesc: formData.get('quidProQuoDesc'),
      quidProQuoValue: formData.get('quidProQuoValue'),
      includeFmvOnReceipt: formData.get('includeFmvOnReceipt') ?? ''
    });

    if (payload.action === 'needs_info') {
      if (!payload.message) {
        return NextResponse.redirect(new URL(`/admin/donations/${id}?error=needs-info-message-required`, request.url));
      }

      await setDonationNeedsInfo({
        donationId: donation.id,
        message: payload.message,
        internalNote: payload.internalNote,
        actorEmail: auth.session.email
      });

      const token = await createMagicToken({
        tokenType: 'donor_edit',
        email: donation.donor_email,
        donationId: donation.id,
        ttlMinutes: 60 * 24 * 7
      });

      const editUrl = appUrl(`/auth/consume?token=${encodeURIComponent(token.token)}`);
      const email = donorNeedsInfoEmail({
        donorName: donation.donor_contact_name,
        message: payload.message,
        editUrl
      });

      await sendEmail({
        to: donation.donor_email,
        subject: email.subject,
        text: email.text,
        replyTo: 'donatemeals@rethinkfood.org'
      });

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'email_sent_needs_info',
        afterJson: {
          to: donation.donor_email
        }
      });

      return NextResponse.redirect(new URL(`/admin/donations/${id}?acted=1`, request.url));
    }

    if (payload.action === 'reject') {
      if (!payload.reason) {
        return NextResponse.redirect(new URL(`/admin/donations/${id}?error=rejection-reason-required`, request.url));
      }

      await setDonationRejected({
        donationId: donation.id,
        reason: payload.reason,
        internalNote: payload.internalNote,
        actorEmail: auth.session.email
      });

      const email = donorRejectedEmail({
        donorName: donation.donor_contact_name,
        reason: payload.reason
      });

      await sendEmail({
        to: donation.donor_email,
        subject: email.subject,
        text: email.text,
        replyTo: 'donatemeals@rethinkfood.org'
      });

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'email_sent_rejected',
        afterJson: {
          to: donation.donor_email
        }
      });

      return NextResponse.redirect(new URL(`/admin/donations/${id}?acted=1`, request.url));
    }

    if (payload.action === 'approve') {
      if (!donation.donor_verified_at) {
        const verifyToken = await createMagicToken({
          tokenType: 'donor_verify',
          email: donation.donor_email,
          donationId: donation.id,
          ttlMinutes: 60 * 24 * 7
        });

        const verifyUrl = appUrl(`/auth/consume?token=${encodeURIComponent(verifyToken.token)}`);
        const verificationNotice = donorVerificationRequiredEmail({
          donorName: donation.donor_contact_name,
          verifyUrl
        });

        await sendEmail({
          to: donation.donor_email,
          subject: verificationNotice.subject,
          text: verificationNotice.text
        });

        await insertAuditLog({
          donationId: donation.id,
          actorType: 'system',
          actionType: 'email_sent_verification_required',
          afterJson: { to: donation.donor_email }
        });

        return NextResponse.redirect(new URL(`/admin/donations/${id}?error=donor-not-verified`, request.url));
      }

      const settings = await getAdminSettings();
      const includeFmv = payload.includeFmvOnReceipt ?? settings?.include_donor_reported_fmv ?? true;

      if (payload.goodsServicesProvided && (!payload.quidProQuoDesc || payload.quidProQuoValue === null)) {
        return NextResponse.redirect(new URL(`/admin/donations/${id}?error=goods-services-info-required`, request.url));
      }

      const receiptCode = await generateUniqueReceiptCode();
      const verificationUrl = appUrl(`/receipt/${receiptCode}`);

      const pdf = await generateReceiptPdf({
        acknowledgmentDate: new Date().toISOString(),
        receiptCode,
        donorBusinessName: donation.donor_business_name,
        donorContactName: donation.donor_contact_name,
        donorEmail: donation.donor_email,
        donationDateTime: donation.donation_datetime,
        dropoffSiteName: donation.dropoff_site_name,
        dropoffAddress1: donation.dropoff_address1,
        city: donation.dropoff_city,
        state: donation.dropoff_state,
        zip: donation.dropoff_zip,
        mealCount: donation.meal_count,
        mealDescription: donation.meal_description,
        goodsServicesProvided: payload.goodsServicesProvided,
        quidProQuoDesc: payload.quidProQuoDesc || null,
        quidProQuoValue: payload.quidProQuoValue ?? null,
        includeFmv,
        fmvTotal: donation.fmv_total ? Number.parseFloat(donation.fmv_total) : null,
        signerName: settings?.signer_name || 'Rethink Food Team',
        signerTitle: settings?.signer_title || 'Authorized Representative',
        disclaimer:
          settings?.receipt_disclaimer ||
          'This acknowledgment is provided for substantiation purposes. It does not constitute legal or tax advice. Please consult your tax advisor regarding deductibility and valuation.',
        verificationUrl
      });

      const receiptKey = buildStorageKey(['receipts', `${receiptCode}.pdf`]);
      await uploadObject({
        key: receiptKey,
        body: pdf,
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="${receiptCode}.pdf"`
      });

      const approved = await setDonationApproved({
        donationId: donation.id,
        actorEmail: auth.session.email,
        internalNote: payload.internalNote,
        goodsServicesProvided: payload.goodsServicesProvided,
        quidProQuoDesc: payload.quidProQuoDesc,
        quidProQuoValue: payload.quidProQuoValue,
        receiptCode,
        receiptS3Key: receiptKey
      });

      if (!approved) {
        throw new Error('Failed to finalize approval.');
      }

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'receipt_generated',
        afterJson: {
          receiptCode,
          receiptKey,
          includeFmv
        }
      });

      const downloadToken = createReceiptDownloadToken(receiptCode, donation.donor_email);
      const downloadUrl = appUrl(`/receipt/${receiptCode}?token=${encodeURIComponent(downloadToken)}`);

      const donorMail = donorApprovedEmail({
        donorName: donation.donor_contact_name,
        receiptCode,
        downloadUrl
      });

      await sendEmail({
        to: donation.donor_email,
        subject: donorMail.subject,
        text: donorMail.text,
        attachments: [
          {
            filename: `${receiptCode}.pdf`,
            type: 'application/pdf',
            content: pdf
          }
        ],
        replyTo: 'donatemeals@rethinkfood.org'
      });

      const adminMail = adminApprovedEmail({
        donationId: donation.id,
        donorBusinessName: donation.donor_business_name,
        receiptCode
      });

      await sendEmail({
        to: getAdminNotificationEmails(),
        subject: adminMail.subject,
        text: adminMail.text
      });

      await markReceiptSent(donation.id);

      await insertAuditLog({
        donationId: donation.id,
        actorType: 'system',
        actionType: 'emails_sent_approved_receipt',
        afterJson: {
          donor: donation.donor_email,
          admins: getAdminNotificationEmails(),
          receiptCode
        }
      });

      return NextResponse.redirect(new URL(`/admin/donations/${id}?acted=1`, request.url));
    }

    return NextResponse.redirect(new URL(`/admin/donations/${id}?error=unsupported-action`, request.url));
  } catch (error) {
    captureException(error, { donationId: id, action: 'admin_action_failed' });
    return NextResponse.redirect(new URL(`/admin/donations/${id}?error=action-failed`, request.url));
  }
}
