import { NextResponse } from 'next/server';
import { adminRequestLinkSchema } from '@/lib/validation';
import { createMagicToken } from '@/lib/auth/tokens';
import { appUrl } from '@/lib/urls';
import { isAdminAllowed, insertAuditLog } from '@/lib/repositories/donations';
import { sendEmail } from '@/lib/email';
import { getClientIp } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';
import { captureException } from '@/lib/error-tracker';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limiter = rateLimit(`admin-login:${ip}`, 8, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.redirect(new URL('/admin/login?error=rate-limit', request.url));
    }

    const formData = await request.formData();
    const payload = adminRequestLinkSchema.parse({
      email: formData.get('email')
    });

    const email = payload.email.toLowerCase();
    const allowed = await isAdminAllowed(email);
    if (!allowed) {
      await insertAuditLog({
        actorType: 'admin',
        actorEmail: email,
        actionType: 'admin_login_denied'
      });
      return NextResponse.redirect(new URL('/admin/login?error=not-allowed', request.url));
    }

    const token = await createMagicToken({
      tokenType: 'admin_login',
      email,
      ttlMinutes: 30
    });

    const link = appUrl(`/auth/consume?token=${encodeURIComponent(token.token)}`);

    await sendEmail({
      to: email,
      subject: 'Donate Meals admin sign-in link',
      text: [
        'Use this secure sign-in link:',
        link,
        '',
        'This link expires in 30 minutes and can only be used once.'
      ].join('\n')
    });

    await insertAuditLog({
      actorType: 'admin',
      actorEmail: email,
      actionType: 'admin_login_link_sent'
    });

    return NextResponse.redirect(new URL('/admin/login?sent=1', request.url));
  } catch (error) {
    captureException(error, { action: 'admin_request_link_failed' });
    return NextResponse.redirect(new URL('/admin/login?error=failed', request.url));
  }
}
