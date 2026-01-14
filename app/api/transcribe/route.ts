import { NextRequest } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/transcribe
 * Transcribe audio to text using OpenAI Whisper API.
 *
 * Request: FormData with 'audio' file (audio/webm, audio/mp4, etc.)
 * Response: { transcript: string } or { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Validate file size (25MB OpenAI limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return Response.json(
        { error: "Audio file too large. Maximum size is 25MB." },
        { status: 413 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[Transcribe] OPENAI_API_KEY not configured");
      return Response.json(
        { error: "Transcription service not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert Blob to File (Whisper API expects File type)
    const file = new File([audioFile], "recording.webm", {
      type: audioFile.type || "audio/webm",
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return Response.json({ transcript: transcription.text });
  } catch (error) {
    console.error("[Transcribe] Error:", error);

    if (error instanceof OpenAI.APIError) {
      return Response.json(
        { error: `Transcription failed: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
