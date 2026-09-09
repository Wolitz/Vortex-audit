// lib/pricing.ts

import { optionalEnv } from "@/lib/env";

export const PLAN_TIERS = ["FREE", "STARTER", "PRO", "MAX"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Monthly audit allowance per paid tier. FREE cannot audit at all. */
export const PLAN_LIMITS: Record<PlanTier, number> = {
  FREE: 0,
  STARTER: 30, // $10/mo
  PRO: 60, // $19/mo
  MAX: 150, // $45/mo
};

export const MAX_FILE_SIZE_MB = 100; // Hard cap, enforced on the upload token and server side.
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export function isPlanTier(value: string | null | undefined): value is PlanTier {
  return !!value && (PLAN_TIERS as readonly string[]).includes(value);
}

export function planLimit(tier: string | null | undefined): number {
  return isPlanTier(tier) ? PLAN_LIMITS[tier] : 0;
}

/** Stripe price id for a tier, used when creating a Checkout Session. */
export function priceIdForTier(tier: PlanTier): string | undefined {
  switch (tier) {
    case "STARTER":
      return optionalEnv("STRIPE_PRICE_STARTER_ID");
    case "PRO":
      return optionalEnv("STRIPE_PRICE_PRO_ID");
    case "MAX":
      return optionalEnv("STRIPE_PRICE_MAX_ID");
    default:
      return undefined;
  }
}

/**
 * Reverse of {@link priceIdForTier}. Webhooks only ever trust the price id on
 * the Stripe subscription, never a tier string echoed back in metadata.
 */
export function tierForPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;

  for (const tier of ["STARTER", "PRO", "MAX"] as const) {
    if (priceIdForTier(tier) === priceId) return tier;
  }

  return null;
}
