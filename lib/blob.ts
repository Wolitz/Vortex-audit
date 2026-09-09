// lib/blob.ts

/**
 * Must match the Blob store's access mode (set at store creation, cannot be
 * changed later). Client-token uploads with `access: 'private'` PUT to
 * vercel.com/api/blob with an Authorization header, and that host does not
 * send CORS headers to custom domains — so private stores use a presigned PUT
 * instead. Public stores keep the original client-token flow.
 *
 * NEXT_PUBLIC_ so the browser can pick the matching upload method.
 */
export const BLOB_ACCESS: "public" | "private" =
  process.env.NEXT_PUBLIC_BLOB_ACCESS === "private" ? "private" : "public";

/** All uploads for a user live under this prefix inside the blob store. */
export function userScopedPrefix(userId: string): string {
  return `uploads/${userId}/`;
}

/**
 * Verifies a client-supplied blob pathname belongs to the given user.
 *
 * The audit route reads blobs by pathname rather than by a URL from the
 * request body. A pathname cannot point at another host, so this closes the
 * SSRF hole while also stopping one user from auditing another's upload.
 */
export function isOwnedBlobPathname(pathname: unknown, userId: string): pathname is string {
  if (typeof pathname !== "string" || pathname.length === 0 || pathname.length > 1024) {
    return false;
  }

  // Reject traversal, absolute URLs, protocol-relative paths and null bytes.
  if (
    pathname.includes("..") ||
    pathname.includes("\0") ||
    pathname.startsWith("/") ||
    /^[a-z][a-z0-9+.-]*:/i.test(pathname)
  ) {
    return false;
  }

  return pathname.startsWith(userScopedPrefix(userId));
}
