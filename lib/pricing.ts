// lib/pricing.ts

export const PLAN_LIMITS = {
  FREE_TRIAL: 7,   // 7 days total length
  STARTER: 30,     // $10/mo limit
  PRO: 60,         // $19/mo limit
  MAX: 150,        // $45/mo limit
} as const;

export const STRIPE_PRICES = {
  STARTER: process.env.STRIPE_PRICE_STARTER_ID, 
  PRO: process.env.STRIPE_PRICE_PRO_ID,
  MAX: process.env.STRIPE_PRICE_MAX_ID,
};

export const MAX_FILE_SIZE_MB = 100; // Hard cap for server safety