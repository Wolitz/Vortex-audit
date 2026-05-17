import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "../../auth/authOptions"; // Importing your auth rules!

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia", 
});

export async function POST(req: Request) {
  try {
    // We pass authOptions so the backend actually knows who you are
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session?.user?.id) {
      // Changed to valid JSON to fix the frontend crash
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      success_url: `${process.env.NEXTAUTH_URL}/?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?canceled=true`,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email,
      line_items: [
        {
          price: "price_1TXjjdFsCLQNnWEqJ8GmpL4h", // <--- Make sure your actual price ID is here!
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id, 
      },
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error("[STRIPE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}