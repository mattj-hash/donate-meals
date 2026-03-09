CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_status') THEN
    CREATE TYPE donation_status AS ENUM ('pending_review', 'needs_info', 'approved', 'rejected');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  signer_name TEXT NOT NULL,
  signer_title TEXT NOT NULL,
  include_donor_reported_fmv BOOLEAN NOT NULL DEFAULT TRUE,
  receipt_disclaimer TEXT NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_settings_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status donation_status NOT NULL DEFAULT 'pending_review',
  donor_business_name TEXT NOT NULL,
  donor_contact_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  donor_address1 TEXT,
  donor_address2 TEXT,
  donor_city TEXT,
  donor_state TEXT,
  donor_zip TEXT,
  donation_datetime TIMESTAMPTZ NOT NULL,
  meal_count INTEGER NOT NULL,
  meal_description TEXT NOT NULL,
  dietary_packaging_notes TEXT,
  dropoff_site_name TEXT,
  dropoff_address1 TEXT NOT NULL,
  dropoff_address2 TEXT,
  dropoff_city TEXT NOT NULL,
  dropoff_state TEXT NOT NULL,
  dropoff_zip TEXT NOT NULL,
  fmv_per_meal NUMERIC(12,2),
  fmv_total NUMERIC(12,2),
  donor_verified_at TIMESTAMPTZ,
  assigned_admin_email TEXT,
  internal_note TEXT,
  reject_reason TEXT,
  needs_info_message TEXT,
  goods_services_provided BOOLEAN NOT NULL DEFAULT FALSE,
  quid_pro_quo_desc TEXT,
  quid_pro_quo_value NUMERIC(12,2),
  approval_date TIMESTAMPTZ,
  receipt_code TEXT UNIQUE,
  receipt_s3_key TEXT,
  receipt_generated_at TIMESTAMPTZ,
  receipt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_status_idx ON donations (status);
CREATE INDEX IF NOT EXISTS donations_email_idx ON donations (LOWER(donor_email));
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON donations (created_at DESC);

CREATE TABLE IF NOT EXISTS donation_photos (
  id BIGSERIAL PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'meal_photo',
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  s3_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT donation_photos_kind_check CHECK (kind IN ('meal_photo', 'invoice'))
);

CREATE INDEX IF NOT EXISTS donation_photos_donation_id_idx ON donation_photos (donation_id);

CREATE TABLE IF NOT EXISTS donation_messages (
  id BIGSERIAL PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  actor_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT donation_messages_direction_check CHECK (direction IN ('admin_to_donor', 'donor_to_admin', 'system'))
);

CREATE INDEX IF NOT EXISTS donation_messages_donation_id_idx ON donation_messages (donation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL,
  actor_email TEXT,
  action_type TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_donation_id_idx ON audit_log (donation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL,
  email TEXT NOT NULL,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_tokens_type_check CHECK (token_type IN ('admin_login', 'donor_verify', 'donor_edit'))
);

CREATE INDEX IF NOT EXISTS auth_tokens_lookup_idx ON auth_tokens (token_type, email, donation_id);

INSERT INTO admin_settings (id, signer_name, signer_title, include_donor_reported_fmv, receipt_disclaimer)
VALUES (1, 'Rethink Food Team', 'Authorized Representative', TRUE, 'This acknowledgment is provided for substantiation purposes. It does not constitute legal or tax advice. Please consult your tax advisor regarding deductibility and valuation.')
ON CONFLICT (id) DO NOTHING;
