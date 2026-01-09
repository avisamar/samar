import { NextRequest } from "next/server";
import { crmRepository } from "@/lib/crm";
import { runProfileAgent } from "@/lib/crm/profile-agent";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // useStream hook sends { input: { messages: [...] }, config: {...} }
    const messages = body.input?.messages || body.messages;

    // Validate messages array
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid messages array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch customer with notes
    const customer = await crmRepository.getCustomerWithNotes(id);
    if (!customer) {
      return new Response(
        JSON.stringify({ error: "Customer not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Run the profile agent with customer context
    return runProfileAgent({
      input: { messages },
      config: body.config || { configurable: {} },
      customer,
    });
  } catch (error) {
    console.error("Profile agent error:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
