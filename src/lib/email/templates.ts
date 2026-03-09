import { formatDateTime, formatMoney } from '@/lib/utils';
import { FMV_DISCLAIMER_TEXT } from '@/lib/constants';

type DonationSummary = {
  id: string;
  donorBusinessName: string;
  donorContactName: string;
  donorEmail: string;
  donationDateTime: string;
  mealCount: number;
  mealDescription: string;
  dropoffCity: string;
  fmvTotal: number | null;
};

export function donorSubmissionReceivedEmail(params: {
  donation: DonationSummary;
  verifyUrl: string;
}) {
  const subject = `Submission received: ${params.donation.donorBusinessName}`;
  const text = [
    `Hi ${params.donation.donorContactName},`,
    '',
    'Thanks for submitting your in-kind meal donation to Rethink Food.',
    `Donation ID: ${params.donation.id}`,
    `Donation time: ${formatDateTime(params.donation.donationDateTime)}`,
    `Meals: ${params.donation.mealCount}`,
    '',
    'Verify your email to access updates and secure edit/download links:',
    params.verifyUrl,
    '',
    FMV_DISCLAIMER_TEXT
  ].join('\n');

  return { subject, text };
}

export function adminNewSubmissionEmail(params: { donation: DonationSummary; reviewUrl: string }) {
  const subject = `New donation pending review: ${params.donation.donorBusinessName}`;
  const text = [
    'A new meal donation is pending review.',
    '',
    `Donor: ${params.donation.donorBusinessName}`,
    `Contact: ${params.donation.donorContactName} (${params.donation.donorEmail})`,
    `Submitted meal count: ${params.donation.mealCount}`,
    `Description: ${params.donation.mealDescription}`,
    `Dropoff city: ${params.donation.dropoffCity}`,
    `Donor-reported FMV: ${formatMoney(params.donation.fmvTotal)}`,
    '',
    `Review: ${params.reviewUrl}`
  ].join('\n');

  return { subject, text };
}

export function donorNeedsInfoEmail(params: {
  donorName: string;
  message: string;
  editUrl: string;
}) {
  return {
    subject: 'Action needed: additional details required for your donation',
    text: [
      `Hi ${params.donorName},`,
      '',
      'Rethink Food needs additional information to review your submission:',
      params.message,
      '',
      'Use this secure edit link:',
      params.editUrl
    ].join('\n')
  };
}

export function donorRejectedEmail(params: {
  donorName: string;
  reason: string;
}) {
  return {
    subject: 'Update on your meal donation submission',
    text: [
      `Hi ${params.donorName},`,
      '',
      'Your submission was reviewed and could not be approved at this time.',
      `Reason: ${params.reason}`,
      '',
      'Reply to this email if you have questions.'
    ].join('\n')
  };
}

export function donorApprovedEmail(params: {
  donorName: string;
  receiptCode: string;
  downloadUrl: string;
}) {
  return {
    subject: `Donation approved + acknowledgment receipt ${params.receiptCode}`,
    text: [
      `Hi ${params.donorName},`,
      '',
      'Your donation has been approved. Your acknowledgment PDF is attached.',
      `Secure download link: ${params.downloadUrl}`,
      '',
      'Thank you for supporting Rethink Food.'
    ].join('\n')
  };
}

export function adminApprovedEmail(params: {
  donationId: string;
  donorBusinessName: string;
  receiptCode: string;
}) {
  return {
    subject: `Approved + receipt sent (${params.receiptCode})`,
    text: [
      'A donation was approved and receipt email was sent to the donor.',
      '',
      `Donation ID: ${params.donationId}`,
      `Donor: ${params.donorBusinessName}`,
      `Receipt: ${params.receiptCode}`
    ].join('\n')
  };
}

export function donorVerificationRequiredEmail(params: {
  donorName: string;
  verifyUrl: string;
}) {
  return {
    subject: 'Please verify your email to receive your acknowledgment receipt',
    text: [
      `Hi ${params.donorName},`,
      '',
      'Your donation was reviewed and is ready for acknowledgment, but we need you to verify this email address first.',
      'Use this secure verification link:',
      params.verifyUrl
    ].join('\n')
  };
}

export function adminDonorResubmittedEmail(params: {
  donationId: string;
  donorBusinessName: string;
  donorEmail: string;
  reviewUrl: string;
}) {
  return {
    subject: `Donor resubmitted details: ${params.donorBusinessName}`,
    text: [
      'A donor has updated a submission previously marked Needs Info.',
      '',
      `Donation ID: ${params.donationId}`,
      `Donor: ${params.donorBusinessName} (${params.donorEmail})`,
      '',
      `Review: ${params.reviewUrl}`
    ].join('\n')
  };
}
