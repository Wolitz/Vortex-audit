import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// ==========================================
// 1. TYPESCRIPT OVERRIDES
// This stops TS from yelling that custom fields don't exist on the session object
// ==========================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      planTier?: string;
      videosAudited?: number;
    }
  }
}

// ==========================================
// 2. NEXT-AUTH CONFIGURATION ENGINE
// ==========================================
export const authOptions: NextAuthOptions = {
  // @ts-ignore - (Required depending on your exact next-auth version mismatch)
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
    async jwt({ token, user, trigger, session }) {
      // 1. Initial sign-in
      if (user) {
        token.sub = user.id;
      }
      
      // 2. The Bridge: When we call 'update()' in page.tsx, 
      // trigger is set to "update", and we refresh the token data.
      if (trigger === "update" && session) {
        token = { ...token, ...session.user };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        
        // Fetch fresh subscription status
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { planTier: true, videosAudited: true }
        });
        
        if (dbUser) {
          session.user.planTier = dbUser.planTier;
          session.user.videosAudited = dbUser.videosAudited;
        }
      }
      return session;
    },
  },
};