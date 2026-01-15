import type { ToolCall } from "@/lib/crm/message-utils";

/**
 * Message type for LangGraph SDK messages.
 */
export interface Message {
  id?: string;
  type: "human" | "ai" | "tool";
  content: string | unknown[];
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  name?: string;
  status?: "success" | "error";
}
