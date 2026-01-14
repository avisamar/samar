import { NextRequest } from "next/server";
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";

export const runtime = "nodejs";

const AUDIO_SAMPLE_RATE = 16000;
const LANGUAGE_CODE = "en-GB";

/**
 * POST /api/transcribe
 * Transcribe audio to text using AWS Transcribe Streaming.
 *
 * Request: raw PCM (16-bit, 16kHz, mono)
 * Response: { transcript: string } or { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "ap-south-1";

    if (!accessKeyId || !secretAccessKey) {
      console.error("[Transcribe] AWS credentials not configured");
      return Response.json(
        { error: "Transcription service not configured" },
        { status: 500 }
      );
    }

    const audioBuffer = await request.arrayBuffer();
    if (!audioBuffer.byteLength) {
      return Response.json({ error: "No audio data provided" }, { status: 400 });
    }

    const client = new TranscribeStreamingClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    });

    const audioStream = streamFromBuffer(new Uint8Array(audioBuffer));
    const command = new StartStreamTranscriptionCommand({
      LanguageCode: LANGUAGE_CODE,
      MediaEncoding: "pcm",
      MediaSampleRateHertz: AUDIO_SAMPLE_RATE,
      AudioStream: audioStream,
    });

    const response = await client.send(command);
    const transcript = await collectTranscript(response.TranscriptResultStream);

    return Response.json({ transcript });
  } catch (error) {
    console.error("[Transcribe] Error:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
}

async function collectTranscript(stream?: AsyncIterable<unknown>): Promise<string> {
  if (!stream) return "";

  const transcriptParts: string[] = [];

  for await (const event of stream as AsyncIterable<{
    TranscriptEvent?: {
      Transcript?: {
        Results?: Array<{
          IsPartial?: boolean;
          Alternatives?: Array<{ Transcript?: string }>;
        }>;
      };
    };
  }>) {
    const results = event.TranscriptEvent?.Transcript?.Results ?? [];
    for (const result of results) {
      if (result.IsPartial) continue;
      const alternatives = result.Alternatives ?? [];
      for (const alternative of alternatives) {
        if (alternative.Transcript) {
          transcriptParts.push(alternative.Transcript.trim());
        }
      }
    }
  }

  return transcriptParts.join(" ").replace(/\s+/g, " ").trim();
}

async function* streamFromBuffer(buffer: Uint8Array) {
  const chunkSize = 8192;
  for (let offset = 0; offset < buffer.length; offset += chunkSize) {
    const chunk = buffer.slice(offset, offset + chunkSize);
    yield { AudioEvent: { AudioChunk: chunk } };
  }
}
