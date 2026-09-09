import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "../auth/authOptions";
import {
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/pricing";
import { BLOB_ACCESS, isOwnedBlobPathname, userScopedPrefix } from "@/lib/blob";

export const runtime = "nodejs";

async function requireOwnedPathname(pathname: unknown) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const prefix = userScopedPrefix(session.user.id);
  if (typeof pathname !== "string" || !pathname.startsWith(prefix)) {
    throw Object.assign(new Error("Invalid upload path"), { status: 403 });
  }

  if (!isOwnedBlobPathname(pathname, session.user.id)) {
    throw Object.assign(new Error("Invalid upload path"), { status: 403 });
  }

  return { userId: session.user.id, pathname };
}

/**
 * Private stores cannot use the client-token `upload()` helper: the browser
 * PUTs to vercel.com/api/blob with an Authorization header, and that API does
 * not return Access-Control-Allow-Origin for custom domains.
 *
 * A presigned PUT carries the grant in the query string instead, which is the
 * supported browser path for private Blob.
 */
async function issuePresignedPut(pathname: string) {
  const token = await issueSignedToken({
    pathname,
    operations: ["put"],
    allowedContentTypes: [...ALLOWED_VIDEO_TYPES],
    maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
    validUntil: Date.now() + 60 * 60 * 1000,
  });

  const { presignedUrl } = await presignUrl(token, {
    operation: "put",
    pathname,
    access: "private",
    allowedContentTypes: [...ALLOWED_VIDEO_TYPES],
    maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
    addRandomSuffix: false,
    allowOverwrite: false,
    validUntil: Date.now() + 15 * 60 * 1000,
  });

  return { url: presignedUrl, pathname };
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    if (BLOB_ACCESS === "private") {
      const { pathname } = await requireOwnedPathname(
        (body as { pathname?: unknown }).pathname ??
          (body as { payload?: { pathname?: unknown } }).payload?.pathname
      );
      const jsonResponse = await issuePresignedPut(pathname);
      return NextResponse.json(jsonResponse);
    }

    const jsonResponse = await handleUpload({
      body: body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireOwnedPathname(pathname);

        return {
          allowedContentTypes: [...ALLOWED_VIDEO_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message;
    const status =
      (error as { status?: number }).status ??
      (message === "Unauthorized" ? 401 : message === "Invalid upload path" ? 403 : 400);

    return NextResponse.json({ error: message }, { status });
  }
}
