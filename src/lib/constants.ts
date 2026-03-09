export const APP_NAME = 'Donate Meals (Rethink Food)';
export const ORG_NAME = 'Rethink Food NYC Inc.';
export const ORG_EIN = '82-1632259';

export const DEFAULT_ADMIN_ALLOWLIST = [
  'mattj@rethinkfood.org',
  'jordanc@rethinkfood.org',
  'christopherh@rethinkfood.org',
  'adaezeo@rethinkfood.org',
  'williamm@rethinkfood.org'
] as const;

export const DONATION_STATUSES = {
  pending: 'pending_review',
  needsInfo: 'needs_info',
  approved: 'approved',
  rejected: 'rejected'
} as const;

export const FMV_GUIDANCE_TEXT =
  'Fair market value generally means the price property would sell for on the open market between a willing buyer and a willing seller. Consider using a typical retail price for a comparable prepared meal in your area, excluding sales tax and tip.';

export const FMV_DISCLAIMER_TEXT =
  'You are responsible for determining and substantiating your value. Consider consulting a tax advisor.';

export const RECEIPT_TITLE =
  'Charitable Contribution Acknowledgment (In-Kind Meal Donation)';

export const RECEIPT_DEFAULT_GOODS_STATEMENT =
  'No goods or services were provided in exchange for this contribution.';

export const RECEIPT_DEFAULT_DISCLAIMER =
  'This acknowledgment is provided for substantiation purposes. It does not constitute legal or tax advice. Please consult your tax advisor regarding deductibility and valuation.';

export const MAX_PHOTO_UPLOADS = 5;
export const MAX_UPLOAD_MB = 12;
