import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia", // Matching your installed version
});

export async function POST(req: Request) {
  // 1. Get the raw text body and the secure signature from Stripe
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // 2. Verify that this ping actually came from Stripe and not a hacker
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed.", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 3. If the payment was successful, upgrade the user!
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // We grab the userId we secretly passed in the metadata earlier!
    if (session?.metadata?.userId) {
      await prisma.user.update({
        where: {
          id: session.metadata.userId,
        },
        data: {
          isPro: true,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
        },
      });
      console.log(`User ${session.metadata.userId} upgraded to PRO!`);
    }
  }

  // Tell Stripe we received the message successfully
  return new NextResponse(null, { status: 200 });
}