"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  downsampleBuffer,
  convertFloat32ToInt16,
  mergeUint8Arrays,
} from "@/lib/audio-utils";

const AUDIO_SAMPLE_RATE = 16000;
const AUDIO_BUFFER_SIZE = 4096;

export type RecordingState = "idle" | "recording" | "transcribing";

interface UseVoiceRecordingOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceRecordingReturn {
  recordingState: RecordingState;
  voiceError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for voice recording with transcription.
 */
export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const { onTranscript, onError } = options;

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);
  const isMountedRef = useRef(true);

  const cleanupRecording = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close().catch(() => null);

    processorRef.current = null;
    sourceRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupRecording();
    };
  }, [cleanupRecording]);

  const handleTranscribe = useCallback(async () => {
    if (!isMountedRef.current) return;

    setRecordingState("transcribing");
    setVoiceError(null);

    try {
      const audioData = mergeUint8Arrays(audioChunksRef.current);
      audioChunksRef.current = [];

      if (!audioData.length) {
        throw new Error("No audio captured. Please try again.");
      }

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "audio/pcm",
          "x-audio-sample-rate": AUDIO_SAMPLE_RATE.toString(),
        },
        // Cast to ArrayBuffer for TypeScript compatibility
        body: new Blob([audioData.buffer as ArrayBuffer], { type: "audio/pcm" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Transcription failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (isMountedRef.current && data.transcript) {
        onTranscript?.(data.transcript);
      }
    } catch (error) {
      console.error("[Voice] Transcription error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Transcription failed. Please try again.";
      if (isMountedRef.current) {
        setVoiceError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setRecordingState("idle");
      }
    }
  }, [onTranscript, onError]);

  const startRecording = useCallback(async () => {
    if (recordingState !== "idle") return;

    setVoiceError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      await audioContext.resume();

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);
      const gain = audioContext.createGain();
      gain.gain.value = 0;

      audioChunksRef.current = [];
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(
          inputData,
          audioContext.sampleRate,
          AUDIO_SAMPLE_RATE
        );
        const pcmChunk = convertFloat32ToInt16(downsampled);
        audioChunksRef.current.push(pcmChunk);
      };

      source.connect(processor);
      processor.connect(gain);
      gain.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      mediaStreamRef.current = stream;
      sourceRef.current = source;
      processorRef.current = processor;

      setRecordingState("recording");
    } catch (error) {
      console.error("[Voice] Failed to start recording:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setVoiceError(
          "Microphone access denied. Please enable microphone permissions in your browser settings."
        );
      } else {
        setVoiceError("Failed to start recording. Please check your microphone.");
      }
    }
  }, [recordingState]);

  const stopRecording = useCallback(async () => {
    cleanupRecording();
    await handleTranscribe();
  }, [cleanupRecording, handleTranscribe]);

  const clearError = useCallback(() => {
    setVoiceError(null);
  }, []);

  return {
    recordingState,
    voiceError,
    startRecording,
    stopRecording,
    clearError,
  };
}
