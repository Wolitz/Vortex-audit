import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "../../auth/authOptions"; 
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",  
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})); 
    const { tier } = body;

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let selectedPriceId = process.env.STRIPE_PRICE_PRO_ID!; // Default fallback
    
    if (tier === "STARTER") selectedPriceId = process.env.STRIPE_PRICE_STARTER_ID!;
    if (tier === "PRO") selectedPriceId = process.env.STRIPE_PRICE_PRO_ID!;
    if (tier === "MAX") selectedPriceId = process.env.STRIPE_PRICE_MAX_ID!;

    if (!selectedPriceId) {
       return NextResponse.json({ error: "Configuration Error: Missing Stripe Price IDs." }, { status: 500 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || "WOB Analysis User",
        metadata: {
          userId: session.user.id, // Ensure this ID is correct!
          tier: tier // Ensure this matches exactly what the webhook expects
        },
      });
      
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId, 
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?canceled=true`,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7, 
      },
      metadata: {
        userId: session.user.id, 
        tier: tier || "PRO"
      },
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error("[STRIPE_ERROR]", error);
    
    // BETTER ERROR HANDLING: Surface the exact Stripe issue to the frontend
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}