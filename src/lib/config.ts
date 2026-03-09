import { z } from 'zod';
import { DEFAULT_ADMIN_ALLOWLIST, RECEIPT_DEFAULT_DISCLAIMER } from '@/lib/constants';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/donatemeals'),
  SESSION_SECRET: z.string().default('dev-session-secret-please-change-1234567890'),
  TOKEN_SECRET: z.string().default('dev-token-secret-please-change-1234567890'),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('donatemeals@rethinkfood.org'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  ADMIN_NOTIFICATION_EMAILS: z.string().default(DEFAULT_ADMIN_ALLOWLIST.join(',')),
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('donate-meals'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  RETHINK_LOGO_URL: z.string().url().optional().or(z.literal('')),
  LETTERHEAD_URL: z.string().url().optional().or(z.literal('')),
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  DEFAULT_SIGNER_NAME: z.string().default('Rethink Food Team'),
  DEFAULT_SIGNER_TITLE: z.string().default('Authorized Representative'),
  DEFAULT_RECEIPT_DISCLAIMER: z.string().default(RECEIPT_DEFAULT_DISCLAIMER)
});

export type AppConfig = z.infer<typeof schema>;

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  cachedConfig = parsed.data;
  return cachedConfig;
}

export function getAdminNotificationEmails() {
  return getConfig()
    .ADMIN_NOTIFICATION_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
