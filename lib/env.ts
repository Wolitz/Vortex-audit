// lib/env.ts

/**
 * Reads a required environment variable, throwing if it is missing.
 * Never provide a literal default for a secret: a committed fallback lets
 * anyone with the source forge sessions or sign requests.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable ${name}. Set it in your deployment and local .env.`
    );
  }

  return value;
}

/** Reads an optional environment variable, normalising blanks to undefined. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

/** Public base URL of the app, used for Stripe redirect and return URLs. */
export function appUrl(): string {
  const url =
    optionalEnv("NEXT_PUBLIC_APP_URL") ??
    optionalEnv("NEXTAUTH_URL") ??
    (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

  if (!url) {
    throw new Error(
      "Missing required environment variable NEXT_PUBLIC_APP_URL (or NEXTAUTH_URL)."
    );
  }

  return url.replace(/\/$/, "");
}
