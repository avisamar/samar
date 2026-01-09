"use client";

import React, { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { Send, Sparkles, AlertCircle, Wrench, ChevronDown, ChevronRight, Database } from "lucide-react";
import { useStream, FetchStreamTransport } from "@langchain/langgraph-sdk/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  extractTextContent,
  extractToolCalls,
  getToolName,
  type ToolCall,
} from "@/lib/crm/message-utils";
import {
  PROPOSAL_TOOL_NAME,
  isProfileUpdateProposal,
  type ProfileUpdateProposal,
} from "@/lib/crm/extraction-types";
import { ProposalCard } from "./proposal-card";

// Message type for LangGraph SDK messages
interface Message {
  id?: string;
  type: "human" | "ai" | "tool";
  content: string | unknown[];
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  name?: string;
  status?: "success" | "error";
}

interface ProfileAgentChatProps {
  customerId: string;
  showToolMessages?: boolean;
}

export function ProfileAgentChat({ customerId, showToolMessages = true }: ProfileAgentChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Configure transport with thread ID for conversation persistence
  const transport = useMemo(() => {
    return new FetchStreamTransport({
      apiUrl: `/api/customers/${customerId}/chat`,
      onRequest: async (url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        return {
          ...init,
          body: JSON.stringify({
            ...body,
            config: {
              configurable: {
                thread_id: `customer-profile-${customerId}`,
              },
            },
          }),
        };
      },
    });
  }, [customerId]);

  // Use LangGraph streaming hook
  const stream = useStream({ transport });
  const { isLoading, submit } = stream;
  // Cast messages to Message[] - useStream returns unknown[]
  const messages: Message[] = (stream.messages ?? []) as Message[];
  // Handle error type - useStream error can be unknown
  const error: Error | null =
    stream.error instanceof Error ? stream.error : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
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

      submit({ messages: [{ content: value, type: "human" }] });
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    },
    [isLoading, submit]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Filter messages based on showToolMessages prop
  const displayMessages: Message[] = showToolMessages
    ? messages
    : messages.filter((msg): msg is Message => !isToolMessage(msg));

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome message when no messages */}
        {displayMessages.length === 0 && !isLoading && <WelcomeMessage />}

        {/* Render messages */}
        <MessageList messages={displayMessages} showToolMessages={showToolMessages} customerId={customerId} />

        {/* Loading indicator */}
        {isLoading && <ThinkingIndicator />}

        {/* Error display */}
        {error && <ErrorMessage error={error} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end rounded-xl border bg-muted/30 focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring">
            <textarea
              ref={textareaRef}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this customer's profile, goals, or preferences..."
              className="flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground min-h-[48px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center gap-1 p-2">
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  showToolMessages: boolean;
  customerId: string;
}

function MessageList({ messages, showToolMessages, customerId }: MessageListProps) {
  return (
    <>
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || `msg-${index}`}
          message={message}
          showToolMessages={showToolMessages}
          customerId={customerId}
        />
      ))}
    </>
  );
}

interface MessageBubbleProps {
  message: Message;
  showToolMessages: boolean;
  customerId: string;
}

function MessageBubble({ message, showToolMessages, customerId }: MessageBubbleProps) {
  const isUser = isHumanMessage(message);
  const isAI = isAIMessage(message);
  const isTool = isToolMessage(message);
  const content = extractTextContent(message.content);
  const toolCalls = isAI ? extractToolCalls(message) : [];

  // For tool messages, render as tool result
  if (isTool && showToolMessages) {
    return <ToolResultBubble message={message} customerId={customerId} />;
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
              "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                : "bg-muted rounded-bl-md prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 max-w-none"
            )}
          >
            {content}
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

/**
 * Renders a tool call from an AI message.
 */
function ToolCallBubble({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 text-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
      >
        <Wrench className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">
          {formatToolName(toolCall.name)}
        </span>
        {isExpanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground ml-auto" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-2 pt-1 border-t border-border/30">
          <pre className="text-xs text-muted-foreground overflow-x-auto">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a tool result message.
 */
function ToolResultBubble({ message, customerId }: { message: Message; customerId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = extractTextContent(message.content);
  const toolName = getToolName(message);

  // Try to parse the content as JSON for nicer display
  let parsedContent: unknown = null;
  try {
    parsedContent = JSON.parse(content);
  } catch {
    // Not JSON, use raw content
  }

  // Check if this is a profile update proposal - render ProposalCard instead
  if (toolName === PROPOSAL_TOOL_NAME && isProfileUpdateProposal(toolName, parsedContent)) {
    return <ProposalCard proposal={parsedContent} customerId={customerId} />;
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-green-500/10 flex items-center justify-center">
        <Database className="size-4 text-green-600" />
      </div>
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 text-sm overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-500/10 transition-colors text-left"
          >
            <span className="font-medium text-green-700 dark:text-green-400">
              {toolName ? formatToolName(toolName) : "Tool"} result
            </span>
            {isExpanded ? (
              <ChevronDown className="size-3.5 text-green-600 ml-auto" />
            ) : (
              <ChevronRight className="size-3.5 text-green-600 ml-auto" />
            )}
          </button>
          {isExpanded && (
            <div className="px-3 pb-3 pt-1 border-t border-green-500/20">
              {parsedContent ? (
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(parsedContent, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {content}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format tool name for display (convert snake_case to Title Case).
 */
function formatToolName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function WelcomeMessage() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary" />
      </div>
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
          Hi! I&apos;m your Profile Agent. I can help you understand this
          customer&apos;s profile, discuss their goals and preferences, or
          identify gaps in their information. What would you like to know?
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary animate-pulse" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-2 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-2 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ error }: { error: Error }) {
  const errorMessage = error.message || "Something went wrong. Please try again.";

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="size-4 text-destructive" />
      </div>
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
          {errorMessage}
        </div>
      </div>
    </div>
  );
}
