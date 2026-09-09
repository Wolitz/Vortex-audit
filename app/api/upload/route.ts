import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "../auth/authOptions";
import {
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/pricing";
import { userScopedPrefix } from "@/lib/blob";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getServerSession(getAuthOptions());
        if (!session?.user?.id) {
          throw new Error("Unauthorized");
        }

        // Uploads are namespaced per user so the audit route can prove
        // ownership of a blob from its pathname alone.
        const prefix = userScopedPrefix(session.user.id);
        if (!pathname.startsWith(prefix)) {
          throw new Error("Invalid upload path");
        }

        return {
          // Private blobs are not readable from their URL; the audit route
          // reads them with the store's read-write token instead.
          allowedContentTypes: [...ALLOWED_VIDEO_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 60 * 60 * 1000,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Video stored in Vercel Blob:", blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message;
    const status =
      message === "Unauthorized" ? 401 : message === "Invalid upload path" ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
