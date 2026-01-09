import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

/**
 * Represents a tool call extracted from an AI message.
 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/**
 * Type guard to check if a message is an AI message.
 * Handles both SDK serialized format and LangChain Core instances.
 */
export function isAIMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") return false;
  const msg = message as Record<string, unknown>;

  // SDK serialized format
  if (msg.type === "ai") return true;

  // LangChain Core class instance
  return AIMessage.isInstance(message);
}

/**
 * Type guard to check if a message is a human message.
 */
export function isHumanMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") return false;
  const msg = message as Record<string, unknown>;

  // SDK serialized format
  if (msg.type === "human") return true;

  // LangChain Core class instance
  return HumanMessage.isInstance(message);
}

/**
 * Type guard to check if a message is a tool message.
 */
export function isToolMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") return false;
  const msg = message as Record<string, unknown>;

  // SDK serialized format
  if (msg.type === "tool") return true;

  // LangChain Core class instance
  return ToolMessage.isInstance(message);
}

/**
 * Extract text content from a message's content field.
 * Handles multiple formats: string, array of strings/objects, or object with text property.
 */
export function extractTextContent(content: unknown): string {
  // Direct string content
  if (typeof content === "string") return content;

  // Array content (mixed text and tool use blocks)
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          return String(item.text);
        }
        return "";
      })
      .filter(Boolean)
      .join("");
  }

  // Object with text property
  if (content && typeof content === "object" && "text" in content) {
    return String((content as { text: unknown }).text);
  }

  return "";
}

/**
 * Extract tool calls from an AI message.
 * Returns an array of tool calls or empty array if none.
 */
export function extractToolCalls(message: unknown): ToolCall[] {
  if (!message || typeof message !== "object") return [];
  const msg = message as Record<string, unknown>;

  // Check for tool_calls field (SDK format)
  if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
    return msg.tool_calls.map((tc: Record<string, unknown>) => ({
      id: String(tc.id || ""),
      name: String(tc.name || ""),
      args: (tc.args as Record<string, unknown>) || {},
    }));
  }

  // Check for additional_kwargs.tool_calls (LangChain format)
  if (msg.additional_kwargs && typeof msg.additional_kwargs === "object") {
    const kwargs = msg.additional_kwargs as Record<string, unknown>;
    if (kwargs.tool_calls && Array.isArray(kwargs.tool_calls)) {
      return kwargs.tool_calls.map((tc: Record<string, unknown>) => {
        const fn = tc.function as Record<string, unknown> | undefined;
        const fnArgs = fn?.arguments;
        return {
          id: String(tc.id || ""),
          name: String(tc.name || fn?.name || ""),
          args: tc.args
            ? (tc.args as Record<string, unknown>)
            : fnArgs && typeof fnArgs === "string"
              ? JSON.parse(fnArgs)
              : {},
        };
      });
    }
  }

  return [];
}

/**
 * Extract tool call ID from a tool message.
 */
export function getToolCallId(message: unknown): string | null {
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;

  if (typeof msg.tool_call_id === "string") {
    return msg.tool_call_id;
  }

  return null;
}

/**
 * Extract tool name from a tool message.
 */
export function getToolName(message: unknown): string | null {
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;

  if (typeof msg.name === "string") {
    return msg.name;
  }

  return null;
}
