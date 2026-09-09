import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { requireEnv } from "@/lib/env";

// Session/user typings live in next-auth.d.ts.

let cached: NextAuthOptions | undefined;

/**
 * NextAuth configuration.
 *
 * Built on first use so the required secrets are read at request time. There
 * is deliberately no fallback secret: a committed default would let anyone
 * with the source forge a session token.
 */
export function getAuthOptions(): NextAuthOptions {
  if (cached) return cached;

  cached = {
    adapter: PrismaAdapter(prisma),

    providers: [
      GoogleProvider({
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      }),
    ],

    secret: requireEnv("NEXTAUTH_SECRET"),

    session: {
      strategy: "jwt",
    },

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
        }

        // Plan data is never taken from the client. `update()` from the
        // browser only refreshes the session; the callback below re-reads
        // entitlements from the database.
        return token;
      },
      async session({ session, token }) {
        if (session?.user && token.sub) {
          session.user.id = token.sub;

          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { planTier: true, videosAudited: true },
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

  return cached;
}
