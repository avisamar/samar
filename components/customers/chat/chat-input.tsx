"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Send, Mic, Square, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceRecording } from "@/hooks/use-voice-recording";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

/**
 * Chat input area with text input and voice recording.
 */
export function ChatInput({
  onSubmit,
  isLoading,
  placeholder = "Start typing or tap mic to record your notes...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    recordingState,
    voiceError,
    startRecording,
    stopRecording,
  } = useVoiceRecording({
    onTranscript: (transcript) => {
      if (textareaRef.current) {
        textareaRef.current.value = transcript;
        handleTextareaChange();
        textareaRef.current.focus();
      }
    },
  });

  // Auto-resize textarea
  const handleTextareaChange = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!textareaRef.current || isLoading) return;

      const value = textareaRef.current.value.trim();
      if (!value) return;

      onSubmit(value);
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    },
    [isLoading, onSubmit]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const voiceStatus =
    recordingState === "recording"
      ? "Listening"
      : recordingState === "transcribing"
        ? "Transcribing"
        : null;

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end rounded-xl border bg-muted/30 focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring">
          <textarea
            ref={textareaRef}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground min-h-[48px] max-h-[200px]"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex items-center gap-2 p-2">
            {voiceStatus && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-medium",
                  recordingState === "recording"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
                )}
              >
                {recordingState === "recording" ? (
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                ) : (
                  <Loader2 className="size-3 animate-spin" />
                )}
                <span>{voiceStatus}</span>
              </div>
            )}

            {/* Voice input button */}
            {recordingState === "idle" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={startRecording}
                disabled={isLoading}
                className="h-8 w-8 p-0 rounded-lg"
                title="Start listening"
              >
                <Mic className="size-4" />
              </Button>
            ) : recordingState === "recording" ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={stopRecording}
                className="h-8 w-8 p-0 rounded-lg animate-pulse"
                title="Stop listening"
              >
                <Square className="size-3 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled
                className="h-8 w-8 p-0 rounded-lg"
                title="Transcribing..."
              >
                <Loader2 className="size-4 animate-spin" />
              </Button>
            )}

            <div className="mx-1 h-6 w-px bg-border/60" />

            {/* Send button */}
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || recordingState !== "idle"}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Press Enter to send, Shift+Enter for new line. Tap mic to listen.
        </p>
        {/* Voice error display */}
        {voiceError && (
          <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
