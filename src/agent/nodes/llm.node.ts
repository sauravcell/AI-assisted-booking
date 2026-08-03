import { ToolMessage } from "@langchain/core/messages";

import { logger } from "../../shared/logger/logger";

import { SYSTEM_PROMPT } from "../prompts/system.prompt";
import { BookingAgentState } from "../state/booking.state";
import { AIProvider } from "../providers/ai-provider";

/** Matches confidently-affirmative phrasing a final answer might use. */
const CLAIMS_SUCCESS = /\b(confirmed|booked|scheduled|all set|success(ful)?|done)\b/i;

/** Matches phrasing that already acknowledges something went wrong. */
const ACKNOWLEDGES_FAILURE =
  /\b(sorry|unable|couldn't|cannot|can't|failed|unfortunately|no longer|not available)\b/i;

export class LLMNode {
  constructor(private provider: AIProvider) {}

  async execute(state: BookingAgentState) {
    logger.debug(
      {
        conversationId: state.conversationId,
        messageCount: state.messages.length,
      },
      "[llm] invoking model",
    );

    const response = await this.provider.invoke([
      SYSTEM_PROMPT,

      ...state.messages,
    ]);

    const hasToolCalls = (response.tool_calls?.length ?? 0) > 0;

    logger.debug(
      {
        conversationId: state.conversationId,
        content: response.content,
        toolCalls: response.tool_calls?.map((call) => ({
          name: call.name,
          args: call.args,
        })),
      },
      "[llm] model responded",
    );

    const finalResponse = hasToolCalls
      ? state.response
      : this.groundResponse(state, response.text);

    return {
      messages: [...state.messages, response],
      newMessages: [...state.newMessages, response],
      response: finalResponse,
    };
  }

  /**
   * The model sees the last tool result as plain JSON in a ToolMessage
   * and is trusted to describe it accurately. If it instead claims
   * success right after a tool reported success: false, that's a
   * hallucinated confirmation - the worst failure mode for a booking
   * bot. Fall back to the tool's own (accurate) message rather than
   * let the model's contradicting text reach the patient.
   */
  private groundResponse(state: BookingAgentState, responseText: string): string {
    const failedResult = this.getTrailingToolResults(state).find(
      (result) => result?.success === false,
    );

    if (!failedResult) {
      return responseText;
    }

    const claimsSuccess = CLAIMS_SUCCESS.test(responseText);
    const acknowledgesFailure = ACKNOWLEDGES_FAILURE.test(responseText);

    if (claimsSuccess && !acknowledgesFailure) {
      logger.warn(
        {
          conversationId: state.conversationId,
          responseText,
          failedResult,
        },
        "[llm] grounding check overrode a response that contradicted a failed tool result",
      );

      return (
        failedResult.message ?? "Sorry, that action didn't go through. Could you try again?"
      );
    }

    return responseText;
  }

  /** Parses every ToolMessage from the most recent tool-call batch. */
  private getTrailingToolResults(state: BookingAgentState): any[] {
    const results: any[] = [];

    for (let i = state.messages.length - 1; i >= 0; i--) {
      const message = state.messages[i];

      if (!(message instanceof ToolMessage)) {
        break;
      }

      try {
        results.push(JSON.parse(String(message.content)));
      } catch {
        // Non-JSON tool content; nothing to ground against.
      }
    }

    return results;
  }
}

/*
export class LLMNode {
  constructor(private readonly provider: AIProvider) {}

  async execute(state: BookingAgentState): Promise<Partial<BookingAgentState>> {
    const response = await this.provider.invoke([
      SYSTEM_PROMPT,
      ...state.messages,
    ]);

    return {
      messages: [...state.messages, response],
      response: response.content.toString(),
    };
  }
}
*/
