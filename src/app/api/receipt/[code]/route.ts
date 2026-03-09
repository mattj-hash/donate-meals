import { NextResponse } from 'next/server';
import { getDonationByReceiptCode } from '@/lib/repositories/donations';

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const donation = await getDonationByReceiptCode(code);

  if (!donation || donation.status !== 'approved') {
    return NextResponse.json({ valid: false, status: 'invalid' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    status: donation.status,
    receiptCode: donation.receipt_code,
    donor: donation.donor_business_name,
    date: donation.approval_date,
    mealCount: donation.meal_count
  });
}
