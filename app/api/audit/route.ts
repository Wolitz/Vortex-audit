import { GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { del, get } from "@vercel/blob";
import { getAuthOptions } from "../auth/authOptions";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import prisma from "@/lib/prisma";
import { requireEnv, optionalEnv } from "@/lib/env";
import { isOwnedBlobPathname, BLOB_ACCESS } from "@/lib/blob";
import {
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  planLimit,
} from "@/lib/pricing";

export const runtime = "nodejs";
export const maxDuration = 300;

const GEMINI_MODEL = optionalEnv("GEMINI_MODEL") ?? "gemini-2.5-flash";

// Every remote step gets a deadline so a stalled dependency cannot hold the
// function open until the platform kills it.
const BLOB_READ_TIMEOUT_MS = 60_000;
const FILE_PROCESSING_TIMEOUT_MS = 120_000;
const FILE_PROCESSING_POLL_MS = 2_000;
const GENERATION_TIMEOUT_MS = 120_000;

class FileTooLargeError extends Error {}

/** Streams a blob to a temp file, aborting if it exceeds the hard size cap. */
function sizeGuard(limitBytes: number): Transform {
  let seen = 0;

  return new Transform({
    transform(chunk, _encoding, callback) {
      seen += chunk.length;
      if (seen > limitBytes) {
        callback(new FileTooLargeError(`Video exceeds the ${MAX_FILE_SIZE_MB}MB limit.`));
        return;
      }
      callback(null, chunk);
    },
  });
}

const YOUTUBE_CODEX_2026 = `
  YOUTUBE ADVERTISER-FRIENDLY CONTENT GUIDELINES (CORE 4):

  1. INAPPROPRIATE LANGUAGE:
  - Green Icon (Fully Monetized): Moderate profanity (e.g., "shit", "bitch") used after the first 7 seconds.
  - Yellow Icon (Limited Ads): Strong profanity (e.g., the f-word) used in the first 7 seconds, or used repeatedly throughout the majority of the video.
  - Red Icon (Demonetized): Slurs, hate speech, or profanity used to directly harass an individual.

  2. VIOLENCE:
  - Green Icon: Dramatized, animated, or comedic violence (e.g., video games, movies).
  - Yellow Icon: Real-world non-graphic violence (e.g., a standard fistfight with no severe injuries).
  - Red Icon: Real-world graphic violence, gore, or violence involving minors.

  3. CONTROVERSIAL ISSUES & SENSITIVE EVENTS:
  - Green Icon: Objective, non-graphic reporting on news or historical events.
  - Yellow Icon: Debates or discussions about highly polarizing political topics without graphic imagery.
  - Red Icon: Content that denies well-documented tragedies, mocks victims, or promotes terrorism.

  4. SYNTHETIC & ALTERED CONTENT (AI):
  - Green Icon: Obvious AI use (filters, clear animations) or disclosed realistic AI.
  - Red Icon: Undisclosed realistic AI that depicts real people doing things they never did, or highly realistic synthetic voices of real people without disclosure.
`;

function buildPrompt(profile: string): string {
  return `
      You are an elite, highly analytical YouTube Compliance Auditor.

      The user has requested a "${profile}" audit.
      - If "Standard": Apply the Codex normally.
      - If "Strict (Kids)": Be absolutely ruthless. Even minor PG-13 themes or mild words like "hell" or "damn" should result in a high risk score.
      - If "Profanity Only": Ignore violence and AI. ONLY scan for language violations.

      Below is the strict, up-to-date YouTube Advertiser-Friendly Codex.
      You MUST analyze the provided video strictly against THESE specific rules. Do not use outside knowledge. Do not guess.

      <CODEX>
      ${YOUTUBE_CODEX_2026}
      </CODEX>

      Analyze the video's transcript, visuals, tone, and metadata.
      Return the response STRICTLY as a JSON object with this exact structure:
      {
        "riskScore": Number (0 = perfectly safe, 100 = completely demonetized),
        "status": "flagged" | "scanned",
        "issues": [
          {
            "timestamp": "MM:SS",
            "description": "Exactly what happened in the video.",
            "policy": "Quote the EXACT rule broken from the Codex (e.g., 'Yellow Icon: Strong profanity...')"
          }
        ],
        "recommendations": "Step-by-step editor instructions to fix the issues and achieve a Green Icon."
      }
  `;
}

interface AuditIssue {
  timestamp: string;
  description: string;
  policy: string;
}

interface AuditReport {
  riskScore: number;
  status: "flagged" | "scanned";
  issues: AuditIssue[];
  recommendations: string;
}

/**
 * Parses the model output. A malformed response must fail loudly rather than
 * reaching the client (or costing the user a credit) as a partial audit.
 */
function parseAuditReport(raw: string | undefined): AuditReport {
  if (!raw) {
    throw new Error("The audit engine returned an empty response.");
  }

  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The audit engine returned a malformed report.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("The audit engine returned a malformed report.");
  }

  const candidate = parsed as Partial<AuditReport>;
  if (typeof candidate.riskScore !== "number" || Number.isNaN(candidate.riskScore)) {
    throw new Error("The audit engine returned a report without a risk score.");
  }

  const issues = Array.isArray(candidate.issues) ? candidate.issues : [];

  return {
    riskScore: Math.max(0, Math.min(100, Math.round(candidate.riskScore))),
    status: candidate.riskScore > 0 ? "flagged" : "scanned",
    issues: issues.filter(
      (issue): issue is AuditIssue =>
        !!issue && typeof issue === "object" && typeof issue.timestamp === "string"
    ),
    recommendations:
      typeof candidate.recommendations === "string" ? candidate.recommendations : "",
  };
}

export async function POST(req: Request) {
  const ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });

  let tempDir: string | undefined;
  let geminiFileName: string | undefined;
  let blobPathname: string | undefined;
  let creditReserved = false;
  let userId: string | undefined;

  try {
    // ==========================================
    // 1. AUTH & SUBSCRIPTION CHECKS
    // ==========================================
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }
    userId = user.id;

    const currentLimit = planLimit(user.planTier);
    if (currentLimit === 0) {
      return NextResponse.json(
        {
          error:
            "Access Denied: You must start a 7-day free trial to unlock the Audit Engine.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 2. RESOLVE THE UPLOAD (OWNERSHIP CHECKED)
    // ==========================================
    const body = await req.json().catch(() => ({}));
    const { pathname, profile, fileName } = body as {
      pathname?: unknown;
      profile?: unknown;
      fileName?: unknown;
    };

    if (!isOwnedBlobPathname(pathname, user.id)) {
      return NextResponse.json({ error: "Unknown or unauthorized video." }, { status: 400 });
    }
    blobPathname = pathname;

    const auditProfile = typeof profile === "string" ? profile : "Standard";
    const displayName = typeof fileName === "string" ? fileName.slice(0, 200) : pathname;

    // Reserve the credit atomically so parallel requests cannot exceed the
    // monthly cap. It is refunded below if the audit does not complete.
    const reservation = await prisma.user.updateMany({
      where: { id: user.id, videosAudited: { lt: currentLimit } },
      data: { videosAudited: { increment: 1 } },
    });

    if (reservation.count === 0) {
      return NextResponse.json(
        {
          error: `Monthly limit reached (${currentLimit}/${currentLimit}). Upgrade your plan to keep auditing!`,
        },
        { status: 429 }
      );
    }
    creditReserved = true;

    // Read the blob with the store token. The client only ever supplies a
    // pathname, so there is no attacker-controlled host to fetch.
    const blobResult = await get(pathname, {
      access: BLOB_ACCESS,
      abortSignal: AbortSignal.timeout(BLOB_READ_TIMEOUT_MS),
    });

    if (!blobResult || blobResult.statusCode !== 200) {
      return NextResponse.json({ error: "Video not found in storage." }, { status: 404 });
    }

    const contentType = blobResult.blob.contentType;
    if (!(ALLOWED_VIDEO_TYPES as readonly string[]).includes(contentType)) {
      return NextResponse.json(
        { error: `Unsupported video format: ${contentType}` },
        { status: 415 }
      );
    }

    if (blobResult.blob.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Video exceeds the ${MAX_FILE_SIZE_MB}MB limit.` },
        { status: 413 }
      );
    }

    // ==========================================
    // 3. STAGE TO DISK (STREAMED, SIZE CAPPED)
    // ==========================================
    tempDir = await mkdtemp(join(tmpdir(), "wob-audit-"));
    const tempFilePath = join(tempDir, "upload.bin");

    await pipeline(
      Readable.fromWeb(blobResult.stream as Parameters<typeof Readable.fromWeb>[0]),
      sizeGuard(MAX_FILE_SIZE_BYTES),
      createWriteStream(tempFilePath)
    );

    // ==========================================
    // 4. UPLOAD TO THE GEMINI FILE API
    // ==========================================
    const uploaded = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: contentType, displayName },
    });

    geminiFileName = uploaded.name;
    if (!geminiFileName) {
      throw new Error("The audit engine did not return a file handle.");
    }

    // The staged upload is no longer needed once Gemini has a copy.
    await del(pathname);
    blobPathname = undefined;

    let fileState = uploaded;
    const processingDeadline = Date.now() + FILE_PROCESSING_TIMEOUT_MS;

    while (fileState.state !== "ACTIVE" && fileState.state !== "FAILED") {
      if (Date.now() > processingDeadline) {
        throw new Error("Video processing timed out. Try a shorter or smaller video.");
      }
      await new Promise((resolve) => setTimeout(resolve, FILE_PROCESSING_POLL_MS));
      fileState = await ai.files.get({ name: geminiFileName });
    }

    if (fileState.state === "FAILED") {
      throw new Error(
        "Video processing failed on Google's end. The file may be corrupted or in an unsupported format."
      );
    }

    if (!fileState.uri || !fileState.mimeType) {
      throw new Error("The audit engine returned an incomplete file reference.");
    }

    // ==========================================
    // 5. RUN THE COMPLIANCE AUDIT
    // ==========================================
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: createUserContent([
        createPartFromUri(fileState.uri, fileState.mimeType),
        buildPrompt(auditProfile),
      ]),
      config: {
        responseMimeType: "application/json",
        abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      },
    });

    const report = parseAuditReport(response.text);

    // The audit succeeded, so the reserved credit is now spent for real.
    creditReserved = false;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastAuditDate: new Date() },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Audit Error:", error);

    if (error instanceof FileTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    const message =
      error instanceof Error ? error.message : "Engine failed to process the request";

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Refund the credit unless the audit produced a valid report.
    if (creditReserved && userId) {
      await prisma.user
        .updateMany({
          where: { id: userId, videosAudited: { gt: 0 } },
          data: { videosAudited: { decrement: 1 } },
        })
        .catch((e) => console.error("Failed to refund audit credit:", e));
    }

    if (geminiFileName) {
      await ai.files
        .delete({ name: geminiFileName })
        .catch((e) => console.error("Failed to delete Gemini file:", e));
    }

    if (blobPathname) {
      await del(blobPathname).catch((e) => console.error("Failed to delete blob:", e));
    }

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch((e) =>
        console.error("Failed to remove temp dir:", e)
      );
    }
  }
}
