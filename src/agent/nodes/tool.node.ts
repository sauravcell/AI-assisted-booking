import { AIMessage, ToolMessage } from "@langchain/core/messages";

import { ToolRegistry } from "../registry/tool.registry";
import { BookingAgentState } from "../state/booking.state";

export class ToolNode {
  constructor(private readonly registry: ToolRegistry) {}

  async execute(state: BookingAgentState) {
    const lastMessage = state.messages.at(-1);

    if (!(lastMessage instanceof AIMessage)) {
      return state;
    }

    for (const toolCall of lastMessage.tool_calls ?? []) {
      const tool = this.registry.get(toolCall.name);

      if (!tool) {
        state.messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id ?? toolCall.name,
            content: `Unknown tool: ${toolCall.name}`,
          }),
        );

        continue;
      }

      const result = await tool.execute(toolCall.args);
      console.log("\n========== TOOL ==========");
      console.log("Tool:", tool.name);

      console.log("Arguments:");
      console.dir(toolCall.args, { depth: null });

      console.log("Result:");
      console.dir(result, { depth: null });

      console.log("==========================\n");
      state.messages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? toolCall.name,
          content: JSON.stringify(result),
        }),
      );
    }

    return state;
  }
}
