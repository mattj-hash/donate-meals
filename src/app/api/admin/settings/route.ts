import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/guards';
import { adminSettingsSchema } from '@/lib/validation';
import { updateAdminSettings } from '@/lib/repositories/donations';
import { captureException } from '@/lib/error-tracker';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const payload = adminSettingsSchema.parse({
      signerName: formData.get('signerName'),
      signerTitle: formData.get('signerTitle'),
      includeDonorReportedFmv: formData.get('includeDonorReportedFmv') ?? '',
      receiptDisclaimer: formData.get('receiptDisclaimer')
    });

    await updateAdminSettings({
      signerName: payload.signerName,
      signerTitle: payload.signerTitle,
      includeDonorReportedFmv: payload.includeDonorReportedFmv,
      receiptDisclaimer: payload.receiptDisclaimer,
      actorEmail: auth.session.email
    });

    return NextResponse.redirect(new URL('/admin/settings?saved=1', request.url));
  } catch (error) {
    captureException(error, { action: 'admin_settings_update_failed' });
    return NextResponse.redirect(new URL('/admin/settings?error=1', request.url));
  }
}
