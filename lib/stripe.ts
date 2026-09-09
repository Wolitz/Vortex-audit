// lib/stripe.ts

import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

let client: Stripe | undefined;

/**
 * Lazily constructed Stripe client.
 *
 * Reading the secret on first use (rather than at module load) keeps
 * `next build` working in environments that only inject secrets at runtime,
 * while still failing fast on the first request if the key is missing.
 */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  return client;
}
