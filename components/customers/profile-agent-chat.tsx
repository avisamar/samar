"use client";

import React, { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { useStream, FetchStreamTransport } from "@langchain/langgraph-sdk/react";
import { isToolMessage } from "@/lib/crm/message-utils";
import {
  EXTRACT_AND_NUDGES_TOOL_NAME,
  FINALIZE_PROPOSAL_TOOL_NAME,
  isExtractionWithNudges,
  type ExtractionWithNudges,
  type NudgeAnswer,
} from "@/lib/crm/nudges";
import {
  PROPOSAL_TOOL_NAME,
  isProfileUpdateProposal,
} from "@/lib/crm/extraction-types";
import { NudgesCard } from "./nudges";
import { ProposalCard } from "./proposal-card";
import {
  MessageList,
  ChatInput,
  WelcomeMessage,
  ThinkingIndicator,
  ErrorMessage,
  type Message,
} from "./chat";

interface ProfileAgentChatProps {
  customerId: string;
  showToolMessages?: boolean;
}

/**
 * Main chat component for interacting with the profile agent.
 * Handles message streaming, rendering, and input.
 */
export function ProfileAgentChat({
  customerId,
  showToolMessages = true,
}: ProfileAgentChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track which proposals have been submitted (to show summary state)
  const [submittedProposalIds, setSubmittedProposalIds] = useState<Set<string>>(new Set());

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
  // Wrapped in useMemo to satisfy exhaustive-deps
  const messages: Message[] = useMemo(
    () => (stream.messages ?? []) as Message[],
    [stream.messages]
  );
  // Handle error type - useStream error can be unknown
  const error: Error | null =
    stream.error instanceof Error ? stream.error : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle message submission
  const handleSubmit = useCallback(
    (message: string) => {
      submit({ messages: [{ content: message, type: "human" }] });
    },
    [submit]
  );

  // Handle finalize proposal after nudges are answered
  const handleFinalizeProposal = useCallback(
    (extraction: ExtractionWithNudges, answers: NudgeAnswer[]) => {
      // Mark this proposal as submitted
      setSubmittedProposalIds((prev) => new Set(prev).add(extraction.proposalId));

      // Build the finalize request message
      // The agent will detect this and call finalize_proposal tool
      const finalizeRequest = {
        action: "finalize_proposal",
        proposalId: extraction.proposalId,
        extractionData: extraction.extraction,
        answers,
        rawInput: extraction.rawInput,
        source: extraction.source,
      };

      submit({
        messages: [
          {
            content: `Please finalize the proposal with these answers: ${JSON.stringify(finalizeRequest)}`,
            type: "human",
          },
        ],
      });
    },
    [submit]
  );

  // Custom renderer for nudges and proposal tool results
  const renderCustomToolResult = useCallback(
    (toolName: string | undefined, parsedContent: unknown) => {
      // Handle extract_and_generate_nudges result
      if (
        toolName === EXTRACT_AND_NUDGES_TOOL_NAME &&
        isExtractionWithNudges(toolName, parsedContent)
      ) {
        // Check if this proposal has already been submitted
        const isAlreadySubmitted = submittedProposalIds.has(parsedContent.proposalId);

        // If no nudges, skip to finalize immediately (only if not already submitted)
        if (parsedContent.nudges.length === 0 && !isAlreadySubmitted) {
          // Auto-finalize with empty answers
          handleFinalizeProposal(parsedContent, []);
          return null;
        }

        return (
          <NudgesCard
            extraction={parsedContent}
            onFinalize={(answers) => handleFinalizeProposal(parsedContent, answers)}
            submitted={isAlreadySubmitted}
          />
        );
      }

      // Handle finalize_proposal result (same as propose_profile_updates)
      if (
        (toolName === FINALIZE_PROPOSAL_TOOL_NAME || toolName === PROPOSAL_TOOL_NAME) &&
        isProfileUpdateProposal(toolName, parsedContent)
      ) {
        return <ProposalCard proposal={parsedContent} customerId={customerId} />;
      }

      return null;
    },
    [customerId, handleFinalizeProposal, submittedProposalIds]
  );

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
        <MessageList
          messages={displayMessages}
          showToolMessages={showToolMessages}
          customerId={customerId}
          renderCustomToolResult={renderCustomToolResult}
        />

        {/* Loading indicator */}
        {isLoading && <ThinkingIndicator />}

        {/* Error display */}
        {error && <ErrorMessage error={error} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
