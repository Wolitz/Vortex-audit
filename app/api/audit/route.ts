import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";

// Initialize the SDKs
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

export async function POST(req: Request) {
  let tempFilePath = "";

  try {
    // 1. Extract the video from the FormData payload
    const formData = await req.formData();
    const file = formData.get("video") as File;
    const profile = formData.get("profile") as string || "Standard";

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // 2. Save the file temporarily to the local OS
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique temp file name
    tempFilePath = join(os.tmpdir(), `${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    console.log("Uploading to Gemini File API...");

    // 3. Upload the file to Gemini
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.type,
      displayName: file.name,
    });

    const geminiFile = uploadResult.file;
    console.log(`Uploaded as ${geminiFile.name} (${geminiFile.uri})`);

    // 4. Wait for the video to be processed by Google's servers
    // Videos take a few seconds to process before they can be analyzed
    let fileState = await fileManager.getFile(geminiFile.name);
    while (fileState.state === "PROCESSING") {
      console.log("Waiting for video processing...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 seconds
      fileState = await fileManager.getFile(geminiFile.name);
    }

    if (fileState.state === "FAILED") {
      throw new Error("Video processing failed on Google's end.");
    }

    // 5. Run the Audit with Gemini 1.5 Pro
    console.log("Running compliance audit...");
    // Replace it with this:
    const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
        temperature: 0, // Forces the model to be highly deterministic and consistent
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

    // 2. The Strict System Prompt
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



    const result = await model.generateContent([
      { fileData: { mimeType: geminiFile.mimeType, fileUri: geminiFile.uri } },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    
    // Clean up the JSON string just in case the model adds markdown formatting
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // 6. Clean up the temporary files
    await fileManager.deleteFile(geminiFile.name);
    await unlink(tempFilePath); // delete from local temp folder

    return NextResponse.json(JSON.parse(cleanedJson));

  } catch (error: any) {
    console.error("Audit Error:", error);
    
    // Try to clean up local file if it fails mid-way
    if (tempFilePath) {
      try { await unlink(tempFilePath); } catch (e) {}
    }

    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}