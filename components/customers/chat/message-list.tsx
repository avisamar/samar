"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  extractTextContent,
  extractToolCalls,
} from "@/lib/crm/message-utils";
import type { Message } from "./types";
import { ToolCallBubble, ToolResultBubble } from "./tool-bubbles";

/** Prefix that indicates a finalize proposal system message */
const FINALIZE_PREFIX = "Please finalize the proposal with these answers:";

/**
 * Check if a message is the finalize proposal system message.
 */
function isFinalizeProposalMessage(content: string): boolean {
  return content.startsWith(FINALIZE_PREFIX);
}

/**
 * Check if content looks like raw JSON extraction/tool data that shouldn't be shown.
 * This filters out streamed JSON that will be rendered as a proper UI card.
 */
function isRawJsonContent(content: string): boolean {
  const trimmed = content.trim();

  // Check if it starts with { or [ (JSON) - hide all JSON-like AI responses
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return true;
  }

  // Also check for partial JSON that might be streaming (starts with quotes or field patterns)
  if (trimmed.startsWith('"') && trimmed.includes('":')) {
    return true;
  }

  // Check for extraction-related keys anywhere in content
  const extractionKeys = [
    '"extractedFields"',
    '"additionalData"',
    '"noteSummary"',
    '"fieldKey"',
    '"proposalId"',
    '"fieldUpdates"',
    '"nudges"',
    '"extraction"',
    '"field"',
    '"confidence"',
    '"source"',
  ];
  return extractionKeys.some((key) => content.includes(key));
}

/**
 * Parse the finalize proposal message and extract summary info.
 */
function parseFinalizeMessage(content: string): { answered: number; skipped: number } | null {
  try {
    const jsonStr = content.slice(FINALIZE_PREFIX.length).trim();
    const data = JSON.parse(jsonStr);
    if (data.answers && Array.isArray(data.answers)) {
      const answered = data.answers.filter((a: { skipped?: boolean; answer?: string }) =>
        !a.skipped && a.answer
      ).length;
      const skipped = data.answers.filter((a: { skipped?: boolean }) =>
        a.skipped
      ).length;
      return { answered, skipped };
    }
  } catch {
    // Failed to parse, return null
  }
  return null;
}

interface MessageListProps {
  messages: Message[];
  showToolMessages: boolean;
  customerId: string;
  /** Optional custom renderer for specific tool results */
  renderCustomToolResult?: (
    toolName: string | undefined,
    parsedContent: unknown
  ) => React.ReactNode | null;
}

/**
 * Renders a list of chat messages.
 */
export function MessageList({
  messages,
  showToolMessages,
  customerId,
  renderCustomToolResult,
}: MessageListProps) {
  return (
    <>
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || `msg-${index}`}
          message={message}
          showToolMessages={showToolMessages}
          customerId={customerId}
          renderCustomToolResult={renderCustomToolResult}
        />
      ))}
    </>
  );
}

interface MessageBubbleProps {
  message: Message;
  showToolMessages: boolean;
  customerId: string;
  renderCustomToolResult?: (
    toolName: string | undefined,
    parsedContent: unknown
  ) => React.ReactNode | null;
}

/**
 * Renders a single message bubble.
 */
function MessageBubble({
  message,
  showToolMessages,
  customerId,
  renderCustomToolResult,
}: MessageBubbleProps) {
  const isUser = isHumanMessage(message);
  const isAI = isAIMessage(message);
  const isTool = isToolMessage(message);
  const content = extractTextContent(message.content);
  const toolCalls = isAI ? extractToolCalls(message) : [];

  // For tool messages, render as tool result
  if (isTool && showToolMessages) {
    return (
      <ToolResultBubble
        message={message}
        customerId={customerId}
        renderCustomResult={renderCustomToolResult}
      />
    );
  }

  // Skip tool messages if not showing them
  if (isTool) return null;

  // For AI messages with tool calls but no text content, show tool call UI
  if (isAI && toolCalls.length > 0 && !content) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="flex flex-col gap-2 max-w-[85%]">
          {toolCalls.map((tc) => (
            <ToolCallBubble key={tc.id} toolCall={tc} />
          ))}
        </div>
      </div>
    );
  }

  // Skip empty messages (no content and no tool calls)
  if (!content && toolCalls.length === 0) return null;

  // Skip AI messages that are just raw JSON (will be rendered as tool result UI)
  if (isAI && isRawJsonContent(content)) return null;

  // Handle finalize proposal message - show summary instead of JSON blob
  if (isUser && isFinalizeProposalMessage(content)) {
    const summary = parseFinalizeMessage(content);
    return (
      <div className="flex gap-3 justify-end">
        <div className="flex flex-col gap-2 max-w-[85%] items-end">
          <div className="rounded-2xl px-4 py-2.5 text-sm bg-primary/80 text-primary-foreground rounded-br-md flex items-center gap-2">
            <Send className="size-3.5" />
            <span>
              Submitted follow-ups
              {summary && (
                <span className="text-primary-foreground/80 ml-1">
                  ({summary.answered} answered, {summary.skipped} skipped)
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
          RM
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {isAI && (
        <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}
      <div
        className={cn("flex flex-col gap-2 max-w-[85%]", isUser && "items-end")}
      >
        {/* Show tool calls if present */}
        {isAI && showToolMessages && toolCalls.length > 0 && (
          <div className="flex flex-col gap-2">
            {toolCalls.map((tc) => (
              <ToolCallBubble key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        {/* Show text content */}
        {content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                : "bg-muted rounded-bl-md prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 max-w-none"
            )}
          >
            {isAI ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              content
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
          RM
        </div>
      )}
    </div>
  );
}
