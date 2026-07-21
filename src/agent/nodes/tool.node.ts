import { AIMessage, ToolMessage } from "@langchain/core/messages";

import { BookingAgentState } from "../state/booking.state";
import { ToolRegistry } from "../registry/tool.registry";

export class ToolNode {
  constructor(private readonly registry: ToolRegistry) {}

  async execute(state: BookingAgentState) {
    const aiMessage = state.messages.at(-1);

    if (!(aiMessage instanceof AIMessage) || !("tool_calls" in aiMessage)) {
      return state;
    }

    const toolMessages: ToolMessage[] = [];

    for (const toolCall of aiMessage.tool_calls ?? []) {
      const tool = this.registry.get(toolCall.name);

      if (!tool) {
        throw new Error(`Unknown tool: ${toolCall.name}`);
      }
      if (!toolCall.id) {
        throw new Error(`Tool call '${toolCall.name}' is missing an id.`);
      }

      const result = await tool.execute(toolCall.args);

      console.log("\n========== TOOL ==========");
      console.log("Tool:", toolCall.name);
      console.log("Arguments:");
      console.dir(toolCall.args, { depth: null });
      console.log("Result:");
      console.dir(result, { depth: null });
      console.log("==========================\n");

      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        }),
      );
    }

    return {
      messages: [...state.messages, ...toolMessages],

      newMessages: [...state.newMessages, ...toolMessages],
    };
  }
}
