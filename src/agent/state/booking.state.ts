import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export const BookingState = Annotation.Root({
  customerId: Annotation<string>(),

  conversationId: Annotation<string>(),

  messages: Annotation<BaseMessage[]>({
    reducer: (_, right) => right,

    default: () => [],
  }),

  /**
   * Messages generated during
   * the current graph execution.
   */
  newMessages: Annotation<BaseMessage[]>({
    reducer: (_, value) => value,
    default: () => [],
  }),

  /**
   * Results returned by tool executions.
   *
   * Example:
   * [
   *   {
   *      tool: "searchDoctor",
   *      result: {...}
   *   }
   * ]
   *
   * The LLM can use these results during
   * the next reasoning step.
   */
  toolResults: Annotation<any[]>({
    reducer: (_, right) => right,

    default: () => [],
  }),

  /**
   * Final response returned to Telegram.
   */
  response: Annotation<string>({
    reducer: (_, right) => right,

    default: () => "",
  }),
});

export type BookingAgentState = typeof BookingState.State;
