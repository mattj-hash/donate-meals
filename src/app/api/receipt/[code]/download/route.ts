import { NextResponse } from 'next/server';
import { getDonorSession } from '@/lib/auth/session';
import { verifyReceiptDownloadToken } from '@/lib/receipt-access';
import { getDonationByReceiptCode } from '@/lib/repositories/donations';
import { getSignedObjectUrl } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const donation = await getDonationByReceiptCode(code);

  if (!donation || donation.status !== 'approved' || !donation.receipt_s3_key || !donation.receipt_code) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  const donorSession = await getDonorSession();
  const sessionAuthorized =
    donorSession?.email.toLowerCase() === donation.donor_email.toLowerCase() && donorSession.donationId === donation.id;

  const tokenAuthorized = token
    ? verifyReceiptDownloadToken(token, donation.receipt_code, donation.donor_email)
    : false;

  if (!sessionAuthorized && !tokenAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const signedUrl = await getSignedObjectUrl(donation.receipt_s3_key, 60 * 5);
  return NextResponse.redirect(signedUrl);
}
