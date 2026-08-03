import { AIMessage } from "@langchain/core/messages";

import { logger } from "../../shared/logger/logger";

import { BookingAgentState } from "../state/booking.state";

export class RouterNode {
  route(state: BookingAgentState): "tool" | "__end__" {
    const lastMessage = state.messages.at(-1);

    const hasToolCalls =
      lastMessage instanceof AIMessage &&
      (lastMessage.tool_calls?.length ?? 0) > 0;

    const destination = hasToolCalls ? "tool" : "__end__";

    logger.debug(
      {
        conversationId: state.conversationId,
        destination,
        toolCalls: hasToolCalls
          ? (lastMessage as AIMessage).tool_calls?.map((call) => call.name)
          : [],
      },
      "[router] routing decision",
    );

    return destination;
  }
}
