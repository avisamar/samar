# LangGraph + Next.js Integration Guide

Reference documentation for integrating LangGraph agents with Next.js, covering streaming, response processing, and UI patterns.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Required Dependencies](#required-dependencies)
3. [Agent Definition](#agent-definition)
4. [API Route Implementation](#api-route-implementation)
5. [Streaming Implementation](#streaming-implementation)
6. [Frontend Message Processing](#frontend-message-processing)
7. [UI Components](#ui-components)
8. [State Management](#state-management)
9. [Communication Protocol](#communication-protocol)
10. [Error Handling](#error-handling)

---

## Architecture Overview

The integration follows a client-server architecture using Server-Sent Events (SSE):

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  ChatInput  │───>│ ChatInterface│───>│ Message Rendering │  │
│  └─────────────┘    └──────┬───────┘    └───────────────────┘  │
│                            │                                    │
│                  useStream hook                                 │
│                  (LangGraph SDK)                                │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ SSE Stream
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Next.js API)                        │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ API Route   │───>│ LangGraph    │───>│ Claude (Anthropic)│  │
│  │ /api/agent  │    │ Agent        │    │                   │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Patterns:**
- Server-Sent Events (SSE) for real-time streaming
- LangGraph SDK's `useStream` hook for client-side stream consumption
- Type guards for message discrimination
- Tool call state tracking with result association

---

## Required Dependencies

```bash
bun add @langchain/langgraph @langchain/langgraph-sdk @langchain/anthropic @langchain/core zod
```

```json
{
  "@langchain/anthropic": "^0.5.1",
  "@langchain/core": "^0.4.6",
  "@langchain/langgraph": "^1.0.1",
  "@langchain/langgraph-sdk": "^1.0.0"
}
```

**Package purposes:**
- `@langchain/langgraph` - Agent creation and graph execution (backend)
- `@langchain/langgraph-sdk` - Client-side streaming via `useStream` hook (frontend)
- `@langchain/anthropic` - Claude model integration
- `@langchain/core` - Base types, tool definitions
- `zod` - Schema validation for tool inputs

---

## Agent Definition

### Creating an Agent

```typescript
// lib/agent.ts
import { createAgent } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseMessage } from "@langchain/core/messages";

// Define tools with Zod schemas
const getCustomerProfileTool = tool(
  async ({ customerId }) => {
    // Tool implementation - fetch from database
    return { name: "John Doe", email: "john@example.com" };
  },
  {
    name: "get_customer_profile",
    description: "Get customer profile by ID",
    schema: z.object({
      customerId: z.string().describe("The customer ID"),
    }),
  }
);

// Agent options interface
interface AgentOptions {
  messages: BaseMessage[];
  config: { configurable: Record<string, unknown> };
}

// Create and run agent
export async function runProfileAgent(options: AgentOptions) {
  const agent = createAgent({
    model: new ChatAnthropic({
      model: "claude-sonnet-4-20250514",
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
    tools: [getCustomerProfileTool],
    checkpointer: new MemorySaver(),
    systemPrompt: "You are a helpful assistant for customer profile management.",
  });

  // Return streaming response
  const stream = await agent.stream(
    { messages: options.messages },
    {
      encoding: "text/event-stream",
      streamMode: ["values", "updates", "messages"],
      configurable: options.config.configurable,
      recursionLimit: 10,
    }
  );

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

### Configuration Options

| Option | Purpose |
|--------|---------|
| `checkpointer` | Persists conversation state (`MemorySaver` for in-memory, or custom DB checkpointer) |
| `streamMode` | Controls what events are streamed (`values`, `updates`, `messages`) |
| `recursionLimit` | Max iterations for tool execution loops |
| `configurable` | Thread ID and other runtime config for state isolation |

### Stream Modes Explained

- `values` - Complete state after each step (useful for final state)
- `updates` - Delta changes between steps (efficient for incremental updates)
- `messages` - Individual message chunks (for token-by-token streaming)

---

## API Route Implementation

```typescript
// app/api/agent/route.ts
import { NextRequest } from "next/server";
import { runProfileAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Run agent and return streaming response
    return runProfileAgent({
      messages: body.messages,
      config: body.config || { configurable: {} },
    });
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

---

## Streaming Implementation

### Server-Side Streaming

The agent's `.stream()` method returns an async iterator that emits SSE events:

```typescript
const stream = await agent.stream(
  { messages },
  {
    encoding: "text/event-stream",
    streamMode: ["values", "updates", "messages"],
  }
);

// Returns Response with streaming body
return new Response(stream, {
  headers: { "Content-Type": "text/event-stream" },
});
```

### Client-Side Stream Consumption

```typescript
// components/chat-interface.tsx
"use client";

import { useMemo } from "react";
import { useStream, FetchStreamTransport } from "@langchain/langgraph-sdk/react";

interface ChatInterfaceProps {
  customerId: string;
}

export function ChatInterface({ customerId }: ChatInterfaceProps) {
  // Configure transport
  const transport = useMemo(() => {
    return new FetchStreamTransport({
      apiUrl: "/api/agent",
      onRequest: async (url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        return {
          ...init,
          body: JSON.stringify({
            ...body,
            config: {
              configurable: {
                thread_id: `customer-${customerId}`,
              },
            },
          }),
        };
      },
    });
  }, [customerId]);

  // Use the stream hook
  const stream = useStream({ transport });

  // Destructure for convenience
  const { messages, isLoading, error, submit } = stream;

  // Submit handler
  const handleSubmit = (text: string) => {
    submit({
      messages: [{ content: text, type: "human" }],
    });
  };

  return (
    <div>
      {/* Message list */}
      {/* Input form */}
      {/* Loading/error states */}
    </div>
  );
}
```

### useStream Hook API

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `messages` | `Message[]` | All messages in conversation |
| `isLoading` | `boolean` | True while streaming |
| `error` | `Error \| null` | Stream error if any |
| `submit(input)` | `function` | Send new message to agent |

---

## Frontend Message Processing

### Message Types

```typescript
// lib/message-utils.ts

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface Message {
  type: "human" | "ai" | "tool";
  content: string | unknown[];
  id?: string;
  tool_call_id?: string;  // For tool messages
  status?: "success" | "error";  // For tool messages
  tool_calls?: ToolCall[];  // For AI messages with tool calls
}
```

### Type Guards

```typescript
// lib/message-utils.ts

export function isHumanMessage(msg: Message): boolean {
  return msg.type === "human";
}

export function isAIMessage(msg: Message): boolean {
  return msg.type === "ai";
}

export function isToolMessage(msg: Message): boolean {
  return msg.type === "tool";
}
```

### Content Extraction

Messages can have content in multiple formats. This utility normalizes them:

```typescript
// lib/message-utils.ts

export function extractTextContent(content: unknown): string {
  // String content
  if (typeof content === "string") return content;

  // Array content (mixed text and tool use blocks)
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          return item.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("");
  }

  // Object with text property
  if (content && typeof content === "object" && "text" in content) {
    return (content as { text: string }).text;
  }

  return "";
}
```

### Tool Call State Tracking

Associate AI message tool calls with their results:

```typescript
interface ToolCallState {
  toolCall: ToolCall;           // The tool invocation request
  toolMessage?: Message;        // The result message (when available)
  errored?: boolean;            // Whether execution failed
}

// Build mapping inside component
const toolCallsByMessage = useMemo(() => {
  const map = new Map<Message, ToolCallState[]>();

  messages.forEach((msg) => {
    if (isAIMessage(msg) && msg.tool_calls?.length) {
      const states = msg.tool_calls.map((tc) => {
        // Find matching tool message by ID
        const toolMsg = messages.find(
          (m) => isToolMessage(m) && m.tool_call_id === tc.id
        );
        return {
          toolCall: tc,
          toolMessage: toolMsg,
          errored: toolMsg?.status === "error",
        };
      });
      map.set(msg, states);
    }
  });

  return map;
}, [messages]);
```

---

## UI Components

### Message List Rendering

```tsx
// components/message-list.tsx

export function MessageList({ messages, toolCallsByMessage }) {
  return (
    <div className="flex flex-col gap-4">
      {messages
        .filter((msg) => !isToolMessage(msg)) // Hide raw tool messages
        .map((message) => (
          <div key={message.id}>
            {/* Human message - right aligned */}
            {isHumanMessage(message) && (
              <div className="ml-auto max-w-[80%] bg-primary text-primary-foreground rounded-2xl px-4 py-2">
                {extractTextContent(message.content)}
              </div>
            )}

            {/* AI message - left aligned */}
            {isAIMessage(message) && (
              <div className="flex flex-col gap-2">
                <div className="max-w-[80%] bg-muted rounded-2xl px-4 py-2">
                  {extractTextContent(message.content)}
                </div>

                {/* Associated tool calls */}
                {toolCallsByMessage.get(message)?.map((tcState) => (
                  <ToolCallCard
                    key={tcState.toolCall.id}
                    toolCall={tcState.toolCall}
                    toolMessage={tcState.toolMessage}
                    errored={tcState.errored}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
```

### Tool Call Card

```tsx
// components/tool-call-card.tsx

interface ToolCallCardProps {
  toolCall: ToolCall;
  toolMessage?: Message;
  errored?: boolean;
}

export function ToolCallCard({ toolCall, toolMessage, errored }: ToolCallCardProps) {
  return (
    <div className={cn(
      "border rounded-lg p-3",
      errored ? "border-destructive bg-destructive/10" : "border-border bg-muted/50"
    )}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">{toolCall.name}</span>
        {errored && <span className="text-destructive text-xs">Error</span>}
      </div>

      {/* Arguments */}
      <pre className="text-xs mt-2 bg-background p-2 rounded overflow-auto">
        {JSON.stringify(toolCall.args, null, 2)}
      </pre>

      {/* Result */}
      {toolMessage ? (
        <div className="mt-2 text-sm">
          <span className="font-medium text-muted-foreground">Result:</span>
          <pre className="text-xs mt-1 bg-background p-2 rounded overflow-auto">
            {typeof toolMessage.content === "string"
              ? toolMessage.content
              : JSON.stringify(toolMessage.content, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="mt-2 text-sm text-muted-foreground">
          Executing...
        </div>
      )}
    </div>
  );
}
```

### Loading Indicator

```tsx
// components/loading-dots.tsx

export function LoadingDots() {
  return (
    <div className="flex gap-1 px-4 py-2">
      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
    </div>
  );
}
```

### Chat Input

```tsx
// components/chat-input.tsx

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a message..."
        className="flex-1 resize-none rounded-lg border p-3 min-h-[52px] max-h-[200px]"
        rows={1}
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  );
}
```

---

## State Management

### State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Parent Component                        │
│  ┌───────────────┐                                          │
│  │ customerId    │────────────────────────────────────────┐ │
│  └───────────────┘                                        │ │
│         │                                                 │ │
│         ▼                                                 ▼ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              ChatInterface                            │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │           useStream hook                        │  │ │
│  │  │  - messages: Message[]                          │  │ │
│  │  │  - isLoading: boolean                           │  │ │
│  │  │  - error: Error | null                          │  │ │
│  │  │  - submit: (input) => void                      │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                         │                              │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │      useMemo: toolCallsByMessage                │  │ │
│  │  │      Map<Message, ToolCallState[]>              │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### State Locations Summary

| State | Location | Purpose |
|-------|----------|---------|
| Context (customerId, etc.) | Parent component props | Passed to configure agent |
| Messages | `useStream` hook | Conversation history |
| Loading | `useStream` hook | UI loading indicators |
| Error | `useStream` hook | Error display |
| Input text | `ChatInput` local state | Controlled textarea |
| Tool call mapping | `useMemo` derived state | Associate tool calls with results |

---

## Communication Protocol

### Request Format

```
POST /api/agent
Content-Type: application/json

{
  "messages": [
    {
      "type": "human",
      "content": "Get information about customer 123"
    }
  ],
  "config": {
    "configurable": {
      "thread_id": "customer-123-session"
    }
  }
}
```

### Response Format (SSE Stream)

```
Content-Type: text/event-stream

data: {"type":"values","messages":[{"type":"human","content":"..."}]}

data: {"type":"updates","agent":{"messages":[{"type":"ai","content":"Let me look that up","tool_calls":[{"id":"tc_1","name":"get_customer_profile","args":{"customerId":"123"}}]}]}}

data: {"type":"messages","messages":[{"type":"tool","tool_call_id":"tc_1","content":"{\"name\":\"John\"}","status":"success"}]}

data: {"type":"values","messages":[...final conversation state...]}
```

Each `data:` line is a JSON event. The SDK's `useStream` hook parses these and updates `messages` automatically.

---

## Error Handling

### Server-Side Errors

```typescript
// In API route
try {
  return runProfileAgent(body);
} catch (error) {
  console.error("Agent error:", error);
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Client-Side Error Display

```tsx
// In ChatInterface component
{stream.error && (
  <div className="border-destructive border rounded-lg p-3 bg-destructive/10">
    <p className="text-destructive text-sm">{stream.error.message}</p>
  </div>
)}
```

### Tool Execution Errors

Tool messages include a `status` field indicating success or error:

```typescript
// Check in ToolCallCard
if (toolMessage?.status === "error") {
  // Display error styling and message
}
```

### Graceful Degradation

```tsx
// Handle missing content gracefully
const content = extractTextContent(message.content);
if (!content && !message.tool_calls?.length) {
  return null; // Skip empty messages
}
```

---

## Summary

Key implementation points for LangGraph + Next.js integration:

1. **Backend**: Use `createAgent` with tools, stream via SSE with `text/event-stream` encoding
2. **Frontend**: Use `useStream` hook from `@langchain/langgraph-sdk/react` with `FetchStreamTransport`
3. **Messages**: Discriminate by `type` field (`human`, `ai`, `tool`) using type guards
4. **Tool Calls**: Track state by matching AI message tool calls with tool result messages via `tool_call_id`
5. **Content**: Handle multiple formats (string, array, objects) with extraction utility
6. **State**: Thread isolation via `configurable.thread_id`, conversation state via `useStream` hook
7. **Errors**: Handle at API route level and display via `stream.error` on client
