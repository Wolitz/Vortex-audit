import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "../../auth/authOptions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia", 
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    // --- THE FIX: Explicitly select the stripeCustomerId ---
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true } // This forces TypeScript to recognize it!
    });

    if (!dbUser?.stripeCustomerId) {
      return new NextResponse("No active subscription found.", { status: 400 });
    }

    // Generate the secure portal link
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/`, // Send them back to the dashboard when done
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error) {
    console.error("[STRIPE_PORTAL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}