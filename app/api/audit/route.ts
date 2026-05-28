import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { del } from '@vercel/blob';

// Your custom SaaS imports
import prisma from "@/lib/prisma";
import { PLAN_LIMITS, MAX_FILE_SIZE_MB } from "@/lib/pricing";

// Initialize the SDKs
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// ==========================================
// HELPER: EXPONENTIAL BACKOFF FOR 503 ERRORS
// ==========================================
async function callGeminiWithRetry(model: any, promptData: any[], maxRetries = 4, delay = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await model.generateContent(promptData); 
      return response;
    } catch (error: any) {
      if (error.message?.includes("503") || error.status === 503) {
        if (attempt === maxRetries) {
          throw new Error("The AI engine is currently overloaded due to high global demand. Please try again in a few minutes.");
        }
        console.warn(`[Attempt ${attempt + 1}] Gemini overloaded. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Double the wait time
      } else {
        throw error;
      }
    }
  }
}

export async function POST(req: Request) {
  let tempFilePath = "";

  try {
    // ==========================================
    // 1. THE BOUNCER: AUTH & SUBSCRIPTION CHECKS
    // ==========================================
    
    // Get the logged-in user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // Fetch their fresh profile from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // STRICT PAYWALL: Block access until they select a tier
    if (user.planTier === "FREE" || user.planTier === "FREE_TRIAL") {
      return NextResponse.json({ 
        error: "Access Denied: You must start a 7-day free trial to unlock the Audit Engine." 
      }, { status: 403 });
    }

    // TIER LIMITS CHECK: Make sure they have capacity for their specific plan
    const currentLimit = PLAN_LIMITS[user.planTier as keyof typeof PLAN_LIMITS] || 0;
    
    if (user.videosAudited >= currentLimit) {
      return NextResponse.json({ 
        error: `Monthly limit reached (${currentLimit}/${currentLimit}). Upgrade your plan to keep auditing!` 
      }, { status: 429 });
    }

    // ==========================================
    // 2. FETCH FROM VERCEL BLOB
    // ==========================================
    
    // ==========================================
    // 2. FETCH FROM VERCEL BLOB
    // ==========================================
    
    const body = await req.json();
    const { videoUrl, profile, fileName } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
    }

    console.log(`Attempting to download video from Vercel Blob: ${videoUrl}`);
    
    // Use 'no-store' to bypass Next.js cache bugs
    const videoResponse = await fetch(videoUrl, { 
      cache: 'no-store',
      headers: { 'Accept': '*/*' }
    });
    
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error(`BLOB FETCH FAILED! Status: ${videoResponse.status}. Details: ${errorText}`);
      throw new Error(`Failed to fetch video from cloud storage (Status ${videoResponse.status}).`);
    }

    // Load the file into the server's temporary RAM
    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Remove spaces from the filename to prevent processing errors
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    tempFilePath = join(os.tmpdir(), `${Date.now()}-${safeFileName}`);
    await writeFile(tempFilePath, buffer);
    // ==========================================
    // 3. UPLOAD TO GEMINI ENGINE & CLEANUP
    // ==========================================
    
    console.log("Uploading to Gemini File API...");
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "video/mp4", // Or detect dynamically
      displayName: fileName,
    });

    const geminiFile = uploadResult.file;
    console.log(`Uploaded to Gemini as ${geminiFile.name}`);

    // DESTROY THE VERCEL BLOB (Saves you money!)
    await del(videoUrl);

    let fileState = await fileManager.getFile(geminiFile.name);
    
    // STRICT WAIT: Keep looping until the file is explicitly ACTIVE or FAILED
    while (fileState.state !== "ACTIVE" && fileState.state !== "FAILED") {
      console.log(`Video status is ${fileState.state}... waiting 2 seconds.`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      fileState = await fileManager.getFile(geminiFile.name);
    }

    if (fileState.state === "FAILED") {
      await fileManager.deleteFile(geminiFile.name);
      throw new Error("Video processing failed on Google's end. The file may be corrupted or in an unsupported format.");
    }

    // ==========================================
    // 4. RUN THE COMPLIANCE AUDIT
    // ==========================================
    
    console.log("Running compliance audit...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0, 
        topK: 1,
        topP: 0.1,
      }
    });

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

    const prompt = `
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
      Return the response STRICTLY as a JSON object with this exact structure (no markdown, no backticks, just the JSON):
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

    // Swap the original call with the retry wrapper
    const result = await callGeminiWithRetry(model, [
      { fileData: { mimeType: geminiFile.mimeType, fileUri: geminiFile.uri } },
      { text: prompt },
    ]);

    // Ensure result exists before trying to access .response.text()
    if (!result || !result.response) {
       throw new Error("Received an empty response from the AI engine.");
    }

    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Clean up Google Cloud files
    await fileManager.deleteFile(geminiFile.name);
    await unlink(tempFilePath); 

    // ==========================================
    // 5. UPDATE DATABASE (SUCCESSFUL AUDIT)
    // ==========================================
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        videosAudited: { increment: 1 },
        lastAuditDate: new Date(),
      }
    });

    return NextResponse.json(JSON.parse(cleanedJson));

  } catch (error: any) {
    console.error("Audit Error:", error);
    
    if (tempFilePath) {
      try { await unlink(tempFilePath); } catch (e) {}
    }

    return NextResponse.json({ error: error.message || "Engine failed to process the request" }, { status: 500 });
  }
}