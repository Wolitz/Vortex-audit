import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "vortex_auditor_prod_secret_8492048XyZ!@#123",

  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        
        // --- NEW: Fetch fresh Pro status directly from the database ---
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isPro: true }
        });
        
        session.user.isPro = dbUser?.isPro || false;
      }
      return session;
    },
  },
};