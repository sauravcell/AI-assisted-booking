import { AIMessage, ToolMessage } from "@langchain/core/messages";

import { logger } from "../../shared/logger/logger";

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
        logger.error(
          { conversationId: state.conversationId, toolName: toolCall.name },
          "[tool] model requested an unregistered tool",
        );

        throw new Error(`Unknown tool: ${toolCall.name}`);
      }
      if (!toolCall.id) {
        logger.error(
          { conversationId: state.conversationId, toolName: toolCall.name },
          "[tool] tool call is missing an id",
        );

        throw new Error(`Tool call '${toolCall.name}' is missing an id.`);
      }

      logger.debug(
        {
          conversationId: state.conversationId,
          toolName: toolCall.name,
          args: toolCall.args,
        },
        "[tool] executing",
      );

      /**
       * Validate the LLM-supplied arguments against the tool's own
       * schema before running it. A malformed/hallucinated argument
       * (e.g. a doctor's name where a UUID is expected) becomes a
       * normal tool result the LLM can react to, instead of an
       * uncaught database error crashing the whole turn.
       */
      const parsedArgs = tool.schema.safeParse(toolCall.args);

      let result: unknown;

      if (!parsedArgs.success) {
        result = {
          success: false,
          reason: "INVALID_INPUT",
          message: `Invalid arguments for "${toolCall.name}": ${parsedArgs.error.issues
            .map((issue) => issue.message)
            .join("; ")}`,
        };
      } else {
        try {
          result = await tool.execute(parsedArgs.data, {
            customerId: state.customerId,
          });
        } catch (error) {
          /**
           * A thrown error here (dropped DB connection, pool
           * exhaustion, an unexpected constraint violation) used to
           * propagate uncaught through the whole graph invocation.
           * Turn it into the same kind of structured failure result
           * every other tool outcome uses, so the LLM sees it and
           * reacts instead of the turn crashing.
           */
          logger.error(
            {
              conversationId: state.conversationId,
              toolName: toolCall.name,
              err: error,
            },
            "[tool] threw during execution",
          );

          result = {
            success: false,
            reason: "TOOL_EXECUTION_ERROR",
            message: `Something went wrong while running "${toolCall.name}". Please try again.`,
          };
        }
      }

      logger.debug(
        {
          conversationId: state.conversationId,
          toolName: toolCall.name,
          result,
        },
        "[tool] result",
      );

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
