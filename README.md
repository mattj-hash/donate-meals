# Donate Meals (Rethink Food)

Production-ready Next.js app to intake in-kind meal donations, support admin review, and issue acknowledgment PDFs after approval.

Public URL target: `https://donatemeals.rethinkfood.org`

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Postgres (raw SQL with migration scripts)
- S3-compatible object storage for uploads + receipt PDFs
- SendGrid for transactional email
- Magic-link auth (admin allowlist + donor verification/edit links)
- PDF generation with PDFKit

## Core Features Implemented

- Public donor submission (mobile-first)
  - Required/optional fields per product spec
  - Mobile camera-first meal photo capture (`Take photo now`) plus gallery upload
  - 1-5 required meal photos + optional invoice upload
  - FMV per-meal / total handling with guidance + donor disclaimer
  - Basic anti-bot + rate limiting + upload mime/size checks
- Donor email verification flow (magic link)
  - Required before receipt delivery
  - Secure donor page to view status
  - Secure donor edit flow when donation is in `Needs Info`
- Admin reviewer workflow
  - Magic-link login restricted to admin allowlist table
  - Queue tabs: Pending Review, Needs Info, Approved, Rejected
  - Search + filters (donor/email, city, date range, status)
  - Detail page with photos, editable fields, messages, audit log
  - Actions: Approve, Reject, Needs Info
- Receipt generation + verification
  - PDF template includes required wording blocks, EIN, receipt code, signature block, disclaimer
  - Goods/services toggle with required fields
  - Optional FMV statement toggle
  - QR code to `/receipt/{RECEIPT_CODE}`
  - Receipt saved to S3 and emailed as attachment + signed access link
  - Public verification endpoint/page + protected download
- Auditability and observability hooks
  - Audit log records submission, edits, status transitions, receipt generation, and email events
  - Structured logging and error tracking hook points

## Data Model

Tables are created in `migrations/0001_init.sql`:

- `donations`
- `donation_photos`
- `donation_messages`
- `audit_log`
- `admin_users`
- `admin_settings`
- `auth_tokens`

## Local Setup

1. Copy environment template:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run migrations:

```bash
npm run db:migrate
```

4. Seed admin allowlist:

```bash
npm run db:seed
```

5. Run app:

```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required keys.

Critical vars:

- `DATABASE_URL`
- `APP_URL`
- `SESSION_SECRET`
- `TOKEN_SECRET`
- `SENDGRID_API_KEY`
- `EMAIL_FROM` (use `donatemeals@rethinkfood.org`)
- `ADMIN_NOTIFICATION_EMAILS`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

## Deployment (Vercel)

1. Provision:
- Postgres (Neon/Supabase)
- S3-compatible bucket (AWS S3 / Cloudflare R2 / Backblaze B2)
- SendGrid sender domain for `rethinkfood.org`

2. Set Vercel env vars from `.env.example`.

3. Deploy:

```bash
vercel --prod
```

4. Ensure `donatemeals.rethinkfood.org` points to Vercel (`A 76.76.21.21`).

## Admin Allowlist

Default allowlist seeded:

- `mattj@rethinkfood.org`
- `jordanc@rethinkfood.org`
- `christopherh@rethinkfood.org`
- `adaezeo@rethinkfood.org`
- `williamm@rethinkfood.org`

Managed via `admin_users` table.

## Compliance Notes

- Acknowledgment includes required noncash contribution elements + goods/services statement handling.
- Donor-reported FMV is clearly labeled as donor responsibility.
- Receipt includes non-advice disclaimer and EIN block.

## Scripts

- `npm run dev` - start local app
- `npm run build` - production build
- `npm run test` - unit tests
- `npm run db:migrate` - run SQL migrations
- `npm run db:seed` - seed admin allowlist
