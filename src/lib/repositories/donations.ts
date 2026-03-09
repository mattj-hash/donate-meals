import { sql } from '@/lib/db';
import { Donation, DonationPhoto, DonationStatus } from '@/types/db';

export type DonationFilters = {
  status?: DonationStatus | 'all';
  query?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export type CreateDonationInput = {
  donorBusinessName: string;
  donorContactName: string;
  donorEmail: string;
  donorPhone?: string;
  donationDatetime: string;
  mealCount: number;
  mealDescription: string;
  dietaryPackagingNotes?: string;
  dropoffSiteName?: string;
  dropoffAddress1: string;
  dropoffAddress2?: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffZip: string;
  fmvPerMeal: number;
  fmvTotal: number;
};

export type AdminSettings = {
  id: number;
  signer_name: string;
  signer_title: string;
  include_donor_reported_fmv: boolean;
  receipt_disclaimer: string;
  updated_by: string | null;
  updated_at: string;
};

export type AuditLogRecord = {
  id: number;
  donation_id: string | null;
  actor_type: string;
  actor_email: string | null;
  action_type: string;
  before_json: unknown;
  after_json: unknown;
  created_at: string;
};

export async function isAdminAllowed(email: string) {
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM admin_users
      WHERE LOWER(email) = ${email.toLowerCase()}
        AND active = TRUE
    ) AS exists
  `;

  return Boolean(rows[0]?.exists);
}

export async function listDonations(filters: DonationFilters) {
  const like = filters.query ? `%${filters.query}%` : null;
  const cityLike = filters.city ? `%${filters.city}%` : null;

  const rows = await sql<Donation[]>`
    SELECT *
    FROM donations
    WHERE (${filters.status && filters.status !== 'all' ? sql`status = ${filters.status}` : sql`TRUE`})
      AND (${like ? sql`(donor_business_name ILIKE ${like} OR donor_email ILIKE ${like})` : sql`TRUE`})
      AND (${cityLike ? sql`dropoff_city ILIKE ${cityLike}` : sql`TRUE`})
      AND (${filters.startDate ? sql`donation_datetime::date >= ${filters.startDate}` : sql`TRUE`})
      AND (${filters.endDate ? sql`donation_datetime::date <= ${filters.endDate}` : sql`TRUE`})
    ORDER BY created_at DESC
    LIMIT ${filters.limit ?? 100}
    OFFSET ${filters.offset ?? 0}
  `;

  return rows;
}

export async function getDonationById(id: string) {
  const rows = await sql<Donation[]>`
    SELECT *
    FROM donations
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getDonationByReceiptCode(receiptCode: string) {
  const rows = await sql<Donation[]>`
    SELECT *
    FROM donations
    WHERE receipt_code = ${receiptCode}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getDonationPhotos(donationId: string) {
  return sql<DonationPhoto[]>`
    SELECT *
    FROM donation_photos
    WHERE donation_id = ${donationId}
    ORDER BY created_at ASC
  `;
}

export async function getDonationMessages(donationId: string) {
  return sql<
    {
      id: number;
      donation_id: string;
      direction: 'admin_to_donor' | 'donor_to_admin' | 'system';
      actor_email: string | null;
      message: string;
      created_at: string;
    }[]
  >`
    SELECT *
    FROM donation_messages
    WHERE donation_id = ${donationId}
    ORDER BY created_at ASC
  `;
}

export async function getDonationAuditLog(donationId: string) {
  return sql<AuditLogRecord[]>`
    SELECT *
    FROM audit_log
    WHERE donation_id = ${donationId}
    ORDER BY created_at DESC
  `;
}

export async function createDonation(input: CreateDonationInput) {
  const rows = await sql<Donation[]>`
    INSERT INTO donations (
      donor_business_name,
      donor_contact_name,
      donor_email,
      donor_phone,
      donation_datetime,
      meal_count,
      meal_description,
      dietary_packaging_notes,
      dropoff_site_name,
      dropoff_address1,
      dropoff_address2,
      dropoff_city,
      dropoff_state,
      dropoff_zip,
      fmv_per_meal,
      fmv_total,
      status
    ) VALUES (
      ${input.donorBusinessName},
      ${input.donorContactName},
      ${input.donorEmail.toLowerCase()},
      ${input.donorPhone ?? null},
      ${input.donationDatetime},
      ${input.mealCount},
      ${input.mealDescription},
      ${input.dietaryPackagingNotes || null},
      ${input.dropoffSiteName || null},
      ${input.dropoffAddress1},
      ${input.dropoffAddress2 || null},
      ${input.dropoffCity},
      ${input.dropoffState},
      ${input.dropoffZip},
      ${input.fmvPerMeal},
      ${input.fmvTotal},
      'pending_review'
    )
    RETURNING *
  `;

  return rows[0];
}

export async function addDonationPhoto(input: {
  donationId: string;
  kind: 'meal_photo' | 'invoice';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  s3Key: string;
}) {
  await sql`
    INSERT INTO donation_photos (
      donation_id,
      kind,
      file_name,
      mime_type,
      size_bytes,
      s3_key
    ) VALUES (
      ${input.donationId},
      ${input.kind},
      ${input.fileName},
      ${input.mimeType},
      ${input.sizeBytes},
      ${input.s3Key}
    )
  `;
}

export async function markDonorVerified(donationId: string, email: string) {
  await sql`
    UPDATE donations
    SET donor_verified_at = COALESCE(donor_verified_at, NOW()),
        updated_at = NOW()
    WHERE id = ${donationId}
      AND LOWER(donor_email) = ${email.toLowerCase()}
  `;
}

export async function insertDonationMessage(input: {
  donationId: string;
  direction: 'admin_to_donor' | 'donor_to_admin' | 'system';
  actorEmail?: string | null;
  message: string;
}) {
  await sql`
    INSERT INTO donation_messages (donation_id, direction, actor_email, message)
    VALUES (
      ${input.donationId},
      ${input.direction},
      ${input.actorEmail ?? null},
      ${input.message}
    )
  `;
}

export async function insertAuditLog(input: {
  donationId?: string | null;
  actorType: string;
  actorEmail?: string | null;
  actionType: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  await sql`
    INSERT INTO audit_log (
      donation_id,
      actor_type,
      actor_email,
      action_type,
      before_json,
      after_json
    ) VALUES (
      ${input.donationId ?? null},
      ${input.actorType},
      ${input.actorEmail ?? null},
      ${input.actionType},
      ${input.beforeJson ? JSON.stringify(input.beforeJson) : null}::jsonb,
      ${input.afterJson ? JSON.stringify(input.afterJson) : null}::jsonb
    )
  `;
}

export async function updateDonationFromAdmin(input: {
  donationId: string;
  mealCount: number;
  mealDescription: string;
  dietaryPackagingNotes?: string;
  dropoffSiteName?: string;
  dropoffAddress1: string;
  dropoffAddress2?: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffZip: string;
  fmvPerMeal: number;
  fmvTotal: number;
  internalNote?: string;
  actorEmail: string;
}) {
  const before = await getDonationById(input.donationId);
  if (!before) return null;

  const rows = await sql<Donation[]>`
    UPDATE donations
    SET meal_count = ${input.mealCount},
        meal_description = ${input.mealDescription},
        dietary_packaging_notes = ${input.dietaryPackagingNotes || null},
        dropoff_site_name = ${input.dropoffSiteName || null},
        dropoff_address1 = ${input.dropoffAddress1},
        dropoff_address2 = ${input.dropoffAddress2 || null},
        dropoff_city = ${input.dropoffCity},
        dropoff_state = ${input.dropoffState},
        dropoff_zip = ${input.dropoffZip},
        fmv_per_meal = ${input.fmvPerMeal},
        fmv_total = ${input.fmvTotal},
        assigned_admin_email = ${input.actorEmail},
        internal_note = ${input.internalNote || null},
        updated_at = NOW()
    WHERE id = ${input.donationId}
    RETURNING *
  `;

  const after = rows[0];

  await insertAuditLog({
    donationId: input.donationId,
    actorType: 'admin',
    actorEmail: input.actorEmail,
    actionType: 'admin_edit',
    beforeJson: before,
    afterJson: after
  });

  return after;
}

export async function setDonationNeedsInfo(input: {
  donationId: string;
  message: string;
  internalNote?: string;
  actorEmail: string;
}) {
  const before = await getDonationById(input.donationId);
  if (!before) return null;

  const rows = await sql<Donation[]>`
    UPDATE donations
    SET status = 'needs_info',
        needs_info_message = ${input.message},
        assigned_admin_email = ${input.actorEmail},
        internal_note = ${input.internalNote || null},
        updated_at = NOW()
    WHERE id = ${input.donationId}
    RETURNING *
  `;

  await insertDonationMessage({
    donationId: input.donationId,
    direction: 'admin_to_donor',
    actorEmail: input.actorEmail,
    message: input.message
  });

  await insertAuditLog({
    donationId: input.donationId,
    actorType: 'admin',
    actorEmail: input.actorEmail,
    actionType: 'needs_info_requested',
    beforeJson: before,
    afterJson: rows[0]
  });

  return rows[0];
}

export async function setDonationRejected(input: {
  donationId: string;
  reason: string;
  internalNote?: string;
  actorEmail: string;
}) {
  const before = await getDonationById(input.donationId);
  if (!before) return null;

  const rows = await sql<Donation[]>`
    UPDATE donations
    SET status = 'rejected',
        reject_reason = ${input.reason},
        assigned_admin_email = ${input.actorEmail},
        internal_note = ${input.internalNote || null},
        updated_at = NOW()
    WHERE id = ${input.donationId}
    RETURNING *
  `;

  await insertAuditLog({
    donationId: input.donationId,
    actorType: 'admin',
    actorEmail: input.actorEmail,
    actionType: 'rejected',
    beforeJson: before,
    afterJson: rows[0]
  });

  return rows[0];
}

export async function setDonationApproved(input: {
  donationId: string;
  actorEmail: string;
  internalNote?: string;
  goodsServicesProvided: boolean;
  quidProQuoDesc?: string;
  quidProQuoValue?: number | null;
  receiptCode: string;
  receiptS3Key: string;
}) {
  const before = await getDonationById(input.donationId);
  if (!before) return null;

  const rows = await sql<Donation[]>`
    UPDATE donations
    SET status = 'approved',
        assigned_admin_email = ${input.actorEmail},
        internal_note = ${input.internalNote || null},
        goods_services_provided = ${input.goodsServicesProvided},
        quid_pro_quo_desc = ${input.quidProQuoDesc || null},
        quid_pro_quo_value = ${input.quidProQuoValue ?? null},
        approval_date = NOW(),
        receipt_code = ${input.receiptCode},
        receipt_s3_key = ${input.receiptS3Key},
        receipt_generated_at = NOW(),
        updated_at = NOW()
    WHERE id = ${input.donationId}
    RETURNING *
  `;

  await insertAuditLog({
    donationId: input.donationId,
    actorType: 'admin',
    actorEmail: input.actorEmail,
    actionType: 'approved',
    beforeJson: before,
    afterJson: rows[0]
  });

  return rows[0];
}

export async function markReceiptSent(donationId: string) {
  await sql`
    UPDATE donations
    SET receipt_sent_at = NOW(),
        updated_at = NOW()
    WHERE id = ${donationId}
  `;
}

export async function updateDonationFromDonor(input: {
  donationId: string;
  donorEmail: string;
  mealCount: number;
  mealDescription: string;
  dietaryPackagingNotes?: string;
  dropoffSiteName?: string;
  dropoffAddress1: string;
  dropoffAddress2?: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffZip: string;
  fmvPerMeal: number;
  fmvTotal: number;
  messageToAdmin?: string;
}) {
  const before = await getDonationById(input.donationId);
  if (!before) return null;

  const rows = await sql<Donation[]>`
    UPDATE donations
    SET meal_count = ${input.mealCount},
        meal_description = ${input.mealDescription},
        dietary_packaging_notes = ${input.dietaryPackagingNotes || null},
        dropoff_site_name = ${input.dropoffSiteName || null},
        dropoff_address1 = ${input.dropoffAddress1},
        dropoff_address2 = ${input.dropoffAddress2 || null},
        dropoff_city = ${input.dropoffCity},
        dropoff_state = ${input.dropoffState},
        dropoff_zip = ${input.dropoffZip},
        fmv_per_meal = ${input.fmvPerMeal},
        fmv_total = ${input.fmvTotal},
        status = 'pending_review',
        updated_at = NOW()
    WHERE id = ${input.donationId}
      AND LOWER(donor_email) = ${input.donorEmail.toLowerCase()}
    RETURNING *
  `;

  const after = rows[0];
  if (!after) return null;

  if (input.messageToAdmin) {
    await insertDonationMessage({
      donationId: input.donationId,
      direction: 'donor_to_admin',
      actorEmail: input.donorEmail,
      message: input.messageToAdmin
    });
  }

  await insertAuditLog({
    donationId: input.donationId,
    actorType: 'donor',
    actorEmail: input.donorEmail,
    actionType: 'donor_edit_resubmitted',
    beforeJson: before,
    afterJson: after
  });

  return after;
}

export async function getAdminSettings() {
  const rows = await sql<AdminSettings[]>`
    SELECT *
    FROM admin_settings
    WHERE id = 1
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function updateAdminSettings(input: {
  signerName: string;
  signerTitle: string;
  includeDonorReportedFmv: boolean;
  receiptDisclaimer: string;
  actorEmail: string;
}) {
  const before = await getAdminSettings();

  const rows = await sql<AdminSettings[]>`
    UPDATE admin_settings
    SET signer_name = ${input.signerName},
        signer_title = ${input.signerTitle},
        include_donor_reported_fmv = ${input.includeDonorReportedFmv},
        receipt_disclaimer = ${input.receiptDisclaimer},
        updated_by = ${input.actorEmail},
        updated_at = NOW()
    WHERE id = 1
    RETURNING *
  `;

  await insertAuditLog({
    actorType: 'admin',
    actorEmail: input.actorEmail,
    actionType: 'admin_settings_updated',
    beforeJson: before,
    afterJson: rows[0]
  });

  return rows[0] ?? null;
}
