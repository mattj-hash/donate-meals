import { NextResponse } from 'next/server';
import { consumeMagicToken } from '@/lib/auth/tokens';
import { setAdminSessionCookie, setDonorSessionCookie } from '@/lib/auth/session';
import { insertAuditLog, markDonorVerified } from '@/lib/repositories/donations';
import { captureException } from '@/lib/error-tracker';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing-token', request.url));
    }

    const consumed = await consumeMagicToken(token);
    if (!consumed) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    if (consumed.token_type === 'admin_login') {
      const response = NextResponse.redirect(new URL('/admin', request.url));
      setAdminSessionCookie(response, consumed.email);
      await insertAuditLog({
        actorType: 'admin',
        actorEmail: consumed.email,
        actionType: 'admin_logged_in'
      });
      return response;
    }

    if ((consumed.token_type === 'donor_verify' || consumed.token_type === 'donor_edit') && consumed.donation_id) {
      const response = NextResponse.redirect(new URL(`/donor/donations/${consumed.donation_id}`, request.url));
      setDonorSessionCookie(response, consumed.email, consumed.donation_id);
      await markDonorVerified(consumed.donation_id, consumed.email);

      await insertAuditLog({
        donationId: consumed.donation_id,
        actorType: 'donor',
        actorEmail: consumed.email,
        actionType: consumed.token_type === 'donor_verify' ? 'donor_verified' : 'donor_edit_link_opened'
      });

      return response;
    }

    return NextResponse.redirect(new URL('/?error=unsupported-token', request.url));
  } catch (error) {
    captureException(error, { action: 'consume_token_failed' });
    return NextResponse.redirect(new URL('/?error=token-consume-failed', request.url));
  }
}
