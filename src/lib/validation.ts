import { z } from 'zod';

const moneySchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null;
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error('Invalid money value');
    }
    return parsed;
  });

export const donationInputSchema = z.object({
  donorBusinessName: z.string().trim().min(2).max(200),
  donorContactName: z.string().trim().min(2).max(200),
  donorEmail: z.string().trim().email(),
  donorPhone: z.string().trim().max(50).optional().default(''),
  donationDatetime: z.string().trim().min(1).max(60),
  mealCount: z.coerce.number().int().min(1).max(100000),
  mealDescription: z.string().trim().min(3).max(5000),
  dietaryPackagingNotes: z.string().trim().max(2000).optional().default(''),
  dropoffSiteName: z.string().trim().max(200).optional().default(''),
  dropoffAddress1: z.string().trim().min(3).max(200),
  dropoffAddress2: z.string().trim().max(200).optional().default(''),
  dropoffCity: z.string().trim().min(2).max(120),
  dropoffState: z.string().trim().min(2).max(80),
  dropoffZip: z.string().trim().min(3).max(20),
  fmvPerMealInput: moneySchema,
  fmvTotalInput: moneySchema,
  botField: z.string().optional().default('')
});

export const adminRequestLinkSchema = z.object({
  email: z.string().trim().email()
});

export const adminDonationUpdateSchema = z.object({
  mealCount: z.coerce.number().int().min(1).max(100000),
  mealDescription: z.string().trim().min(3).max(5000),
  dietaryPackagingNotes: z.string().trim().max(2000).optional().default(''),
  dropoffSiteName: z.string().trim().max(200).optional().default(''),
  dropoffAddress1: z.string().trim().min(3).max(200),
  dropoffAddress2: z.string().trim().max(200).optional().default(''),
  dropoffCity: z.string().trim().min(2).max(120),
  dropoffState: z.string().trim().min(2).max(80),
  dropoffZip: z.string().trim().min(3).max(20),
  fmvPerMealInput: moneySchema,
  fmvTotalInput: moneySchema,
  internalNote: z.string().trim().max(3000).optional().default('')
});

export const adminDonationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'needs_info']),
  message: z.string().trim().optional().default(''),
  reason: z.string().trim().optional().default(''),
  internalNote: z.string().trim().max(3000).optional().default(''),
  goodsServicesProvided: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')])
    .optional()
    .default('false')
    .transform((value) => value === 'on' || value === 'true'),
  quidProQuoDesc: z.string().trim().optional().default(''),
  quidProQuoValue: moneySchema,
  includeFmvOnReceipt: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')])
    .optional()
    .default('true')
    .transform((value) => value === 'on' || value === 'true')
});

export const donorEditSchema = z.object({
  mealCount: z.coerce.number().int().min(1).max(100000),
  mealDescription: z.string().trim().min(3).max(5000),
  dietaryPackagingNotes: z.string().trim().max(2000).optional().default(''),
  dropoffSiteName: z.string().trim().max(200).optional().default(''),
  dropoffAddress1: z.string().trim().min(3).max(200),
  dropoffAddress2: z.string().trim().max(200).optional().default(''),
  dropoffCity: z.string().trim().min(2).max(120),
  dropoffState: z.string().trim().min(2).max(80),
  dropoffZip: z.string().trim().min(3).max(20),
  fmvPerMealInput: moneySchema,
  fmvTotalInput: moneySchema,
  messageToAdmin: z.string().trim().max(3000).optional().default('')
});

export const adminSettingsSchema = z.object({
  signerName: z.string().trim().min(2).max(150),
  signerTitle: z.string().trim().min(2).max(150),
  includeDonorReportedFmv: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')])
    .optional()
    .default('true')
    .transform((value) => value === 'on' || value === 'true'),
  receiptDisclaimer: z.string().trim().min(10).max(4000)
});
