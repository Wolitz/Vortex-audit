import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

// Initialize Stripe 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia" 
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  console.log("--- WEBHOOK HIT ---");

  let event: Stripe.Event;

  try {
    // Verify that this ping actually came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed.", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    // ==========================================
    // 1. INITIAL PURCHASE COMPLETED
    // ==========================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("WEBHOOK RECEIVED:", session.metadata);

      if (session?.metadata?.userId) {
        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: {
            planTier: session.metadata.tier || "PRO", // Pulls the exact tier from checkout
            subscriptionStatus: "active",
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            videosAudited: 0, // Reset limits on fresh upgrade
          },
        });
        console.log(`User ${session.metadata.userId} upgraded to ${session.metadata.tier}!`);
      }
    }

    // ==========================================
    // 2. MONTHLY RECURRING INVOICE PAID
    // ==========================================
    if (event.type === "invoice.payment_succeeded") {
      // By casting as 'any', we bypass the strict TS version mismatch for the Invoice object
      const invoice = event.data.object as any; 
      
      // If this is a recurring subscription payment...
      if (invoice.subscription) {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: {
            videosAudited: 0, // REFILL THEIR CREDITS TO 0
            subscriptionStatus: "active"
          },
        });
        console.log(`Monthly limits reset for subscription ${invoice.subscription}`);
      }
    }

    // ==========================================
    // 3. CANCELLATIONS & FAILED PAYMENTS
    // ==========================================
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          planTier: "FREE_TRIAL",
          subscriptionStatus: "canceled",
        },
      });
      console.log(`Subscription ${subscription.id} canceled. User downgraded.`);
    }

    // Catch past-due/unpaid cards without fully deleting their account yet
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      
      if (subscription.status === "past_due" || subscription.status === "unpaid") {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status,
          },
        });
      }
    }

    return new NextResponse(null, { status: 200 });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new NextResponse(`Webhook Processing Error: ${error.message}`, { status: 500 });
  }
}