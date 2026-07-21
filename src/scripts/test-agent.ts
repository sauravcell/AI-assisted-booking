/**
 * ------------------------------------------------------------
 * AI Agent Integration Test
 * ------------------------------------------------------------
 *
 * Purpose:
 * Validate the complete AI pipeline:
 *
 * HumanMessage
 *      ↓
 * AgentService
 *      ↓
 * BookingGraph
 *      ↓
 * LLMNode
 *      ↓
 * ToolNode (if required)
 *      ↓
 * Final AI Response
 * ------------------------------------------------------------
 */

import "dotenv/config";

import { HumanMessage } from "@langchain/core/messages";

import { agent } from "../bootstrap/agent.bootstrap";

async function main() {
  console.log("\n==============================");
  console.log(" AI Booking Platform");
  console.log(" Agent Integration Test");
  console.log("==============================\n");

  const prompt = "Find me a cardiologist.";

  console.log("User:");
  console.log(prompt);
  console.log();

  const result = await agent.invoke({
    customerId: "customer-001",

    conversationId: "conversation-001",

    messages: [new HumanMessage(prompt)],

    toolResults: [],

    response: "",
  });

  console.log("\n===== FINAL STATE =====");

  console.log("\nFinal Response:");
  console.log(result.response);

  console.log("\nConversation History:");

  for (const message of result.messages) {
    console.log("--------------------------------");

    console.log(message.constructor.name);

    console.dir(message, {
      depth: null,
    });
  }

  console.log("\n==============================");
}

main().catch(console.error);
