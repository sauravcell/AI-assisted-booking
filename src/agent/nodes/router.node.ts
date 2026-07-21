import { AIMessage } from "@langchain/core/messages";

import { BookingAgentState } from "../state/booking.state";

export class RouterNode {
  route(state: BookingAgentState): "tool" | "__end__" {
    const lastMessage = state.messages.at(-1);

    if (
      lastMessage instanceof AIMessage &&
      (lastMessage.tool_calls?.length ?? 0) > 0
    ) {
      return "tool";
    }

    return "__end__";
  }
}
