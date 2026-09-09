import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { requireEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { tierForPriceId } from "@/lib/pricing";

export const runtime = "nodejs";

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Resolves the subscription id on an invoice.
 *
 * As of API version 2026-04-22.dahlia the top-level `subscription` field is
 * gone; a subscription invoice carries it under
 * `parent.subscription_details.subscription`.
 */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type === "subscription_details") {
    return idOf(invoice.parent.subscription_details?.subscription);
  }
  return null;
}

/** The tier a subscription grants, taken from the price it actually bills. */
function tierFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  return tierForPriceId(priceId);
}

/**
 * Finds the local user for a Stripe customer. Checkout metadata is preferred,
 * but a charge must never be silently dropped just because metadata is absent,
 * so we fall back to the stored customer id and finally the billing email.
 */
async function resolveUserId(
  metadataUserId: string | null | undefined,
  customerId: string | null
): Promise<string | null> {
  if (metadataUserId) {
    const byId = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  if (customerId) {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (byCustomer) return byCustomer.id;

    const customer = await getStripe().customers.retrieve(customerId);
    if (!customer.deleted && customer.email) {
      const byEmail = await prisma.user.findUnique({
        where: { email: customer.email },
        select: { id: true },
      });
      if (byEmail) return byEmail.id;
    }
  }

  return null;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing Stripe-Signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    console.error("Webhook signature verification failed.", (error as Error).message);
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      // ==========================================
      // 1. INITIAL PURCHASE COMPLETED
      // ==========================================
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId = idOf(session.subscription);
        const customerId = idOf(session.customer);

        const userId = await resolveUserId(
          session.metadata?.userId ?? session.client_reference_id,
          customerId
        );

        if (!userId) {
          // Returning 500 makes Stripe retry and surfaces the paid-but-not-
          // provisioned customer in the dashboard instead of losing them.
          console.error(
            `Paid checkout session ${session.id} could not be matched to a user.`
          );
          return new NextResponse("Could not match checkout session to a user", {
            status: 500,
          });
        }

        if (!subscriptionId) {
          console.error(`Checkout session ${session.id} has no subscription.`);
          return new NextResponse("Checkout session has no subscription", { status: 500 });
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tier = tierFromSubscription(subscription);

        if (!tier) {
          console.error(
            `Subscription ${subscriptionId} bills an unrecognised price; refusing to guess a tier.`
          );
          return new NextResponse("Unrecognised subscription price", { status: 500 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            planTier: tier,
            subscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId ?? undefined,
            stripePriceId: subscription.items.data[0]?.price?.id,
            videosAudited: 0, // Fresh allowance on upgrade.
          },
        });

        console.log(`User ${userId} provisioned on ${tier}.`);
        break;
      }

      // ==========================================
      // 2. RECURRING INVOICE PAID -> REFILL CREDITS
      // ==========================================
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = subscriptionIdFromInvoice(invoice);

        // Only a period rollover refills the allowance. Upgrades and the
        // initial invoice are handled by the subscription events.
        if (subscriptionId && invoice.billing_reason === "subscription_cycle") {
          const updated = await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { videosAudited: 0, subscriptionStatus: "active" },
          });

          console.log(
            `Monthly limits reset for subscription ${subscriptionId} (${updated.count} user(s)).`
          );
        }
        break;
      }

      // ==========================================
      // 3. PLAN CHANGES, PAUSES AND PAYMENT TROUBLE
      // ==========================================
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const tier = tierFromSubscription(subscription);
        const priceId = subscription.items.data[0]?.price?.id;

        // A portal upgrade or downgrade only arrives as this event, so the
        // tier has to be re-synced here or entitlements drift from billing.
        const isLive = ["active", "trialing"].includes(subscription.status);

        const updated = await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status,
            stripePriceId: priceId,
            ...(tier && isLive ? { planTier: tier } : {}),
          },
        });

        if (updated.count === 0) {
          // First subscription for this customer: link it to the user.
          const userId = await resolveUserId(
            subscription.metadata?.userId,
            idOf(subscription.customer)
          );

          if (userId && tier) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                subscriptionStatus: subscription.status,
                ...(isLive ? { planTier: tier } : {}),
              },
            });
          }
        }
        break;
      }

      // ==========================================
      // 4. CANCELLATION
      // ==========================================
      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            planTier: "FREE",
            subscriptionStatus: "canceled",
          },
        });

        console.log(`Subscription ${subscription.id} canceled. User downgraded to FREE.`);
        break;
      }

      default:
        break;
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse(`Webhook Processing Error: ${(error as Error).message}`, {
      status: 500,
    });
  }
}
