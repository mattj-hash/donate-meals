import { sql } from '@/lib/db';
import { randomToken, sha256 } from '@/lib/security';

export type AuthTokenType = 'admin_login' | 'donor_verify' | 'donor_edit';

type AuthTokenRecord = {
  id: string;
  token_hash: string;
  token_type: AuthTokenType;
  email: string;
  donation_id: string | null;
  expires_at: string;
  used_at: string | null;
};

export async function createMagicToken(params: {
  tokenType: AuthTokenType;
  email: string;
  donationId?: string;
  ttlMinutes?: number;
}) {
  const rawToken = randomToken(32);
  const tokenHash = sha256(rawToken);
  const ttlMinutes = params.ttlMinutes ?? 60;

  await sql`
    INSERT INTO auth_tokens (token_hash, token_type, email, donation_id, expires_at)
    VALUES (
      ${tokenHash},
      ${params.tokenType},
      ${params.email.toLowerCase()},
      ${params.donationId ?? null},
      NOW() + (${ttlMinutes}::text || ' minutes')::interval
    )
  `;

  return {
    token: rawToken,
    expiresInMinutes: ttlMinutes
  };
}

export async function consumeMagicToken(rawToken: string) {
  const tokenHash = sha256(rawToken);

  const rows = await sql<AuthTokenRecord[]>`
    SELECT *
    FROM auth_tokens
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  await sql`
    UPDATE auth_tokens
    SET used_at = NOW()
    WHERE id = ${row.id}
  `;

  return row;
}
