"use client";

import React, { useState } from "react";
import { Wrench, ChevronDown, ChevronRight, Database } from "lucide-react";
import type { ToolCall } from "@/lib/crm/message-utils";
import { extractTextContent, getToolName } from "@/lib/crm/message-utils";
import {
  PROPOSAL_TOOL_NAME,
  isProfileUpdateProposal,
} from "@/lib/crm/extraction-types";
import { ProposalCard } from "../proposal-card";
import type { Message } from "./types";

/**
 * Format tool name for display (convert snake_case to Title Case).
 */
export function formatToolName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface ToolCallBubbleProps {
  toolCall: ToolCall;
}

/**
 * Renders a tool call from an AI message.
 */
export function ToolCallBubble({ toolCall }: ToolCallBubbleProps) {
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

interface ToolResultBubbleProps {
  message: Message;
  customerId: string;
  /** Optional custom renderer for specific tool results */
  renderCustomResult?: (
    toolName: string | undefined,
    parsedContent: unknown
  ) => React.ReactNode | null;
}

/**
 * Renders a tool result message.
 */
export function ToolResultBubble({
  message,
  customerId,
  renderCustomResult,
}: ToolResultBubbleProps) {
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

  // Check for custom renderer first
  if (renderCustomResult) {
    const customResult = renderCustomResult(toolName ?? undefined, parsedContent);
    if (customResult) {
      return <>{customResult}</>;
    }
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
