import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { getAuthOptions } from "../../auth/authOptions";
import prisma from "@/lib/prisma";
import { appUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { isPlanTier, priceIdForTier, type PlanTier } from "@/lib/pricing";

export const runtime = "nodejs";

/** Subscription states that mean the customer already pays us. */
const LIVE_SUBSCRIPTION_STATES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
];

export async function POST(req: Request) {
  try {
    const stripe = getStripe();

    const body = await req.json().catch(() => ({}));
    const { tier } = body as { tier?: unknown };

    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof tier !== "string" || !isPlanTier(tier) || tier === "FREE") {
      return NextResponse.json({ error: "Unknown plan requested." }, { status: 400 });
    }

    const selectedTier: PlanTier = tier;
    const selectedPriceId = priceIdForTier(selectedTier);

    if (!selectedPriceId) {
      return NextResponse.json(
        { error: "Configuration Error: Missing Stripe Price IDs." },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? session.user.email,
        name: user.name || "WOB Analysis User",
        metadata: { userId: user.id },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // An existing subscription must be changed in the billing portal. Sending
    // the customer back through Checkout would open a second subscription and
    // grant another trial.
    const existing = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 100,
    });

    const liveSubscription = existing.data.find((sub) =>
      LIVE_SUBSCRIPTION_STATES.includes(sub.status)
    );

    if (liveSubscription) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${appUrl()}/`,
      });

      return NextResponse.json({
        url: portal.url,
        message: "You already have an active plan. Manage it in the billing portal.",
      });
    }

    // The trial is once per customer, not once per Checkout Session.
    const hasSubscribedBefore = existing.data.length > 0 || !!user.stripeSubscriptionId;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      success_url: `${appUrl()}/?success=true`,
      cancel_url: `${appUrl()}/?canceled=true`,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      ...(hasSubscribedBefore ? {} : { subscription_data: { trial_period_days: 7 } }),
      // The webhook resolves entitlements from the subscription's price id.
      // Metadata is only a convenience lookup, never the source of truth.
      metadata: { userId: user.id },
      client_reference_id: user.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_ERROR]", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
