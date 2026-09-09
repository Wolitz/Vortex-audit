import NextAuth from "next-auth";
import { getAuthOptions } from "../authOptions";

// The options are resolved per request so the required secrets are only read
// when a request actually arrives, not while building.
async function handler(req: Request, ctx: unknown) {
  return NextAuth(getAuthOptions())(req, ctx);
}

export { handler as GET, handler as POST };
