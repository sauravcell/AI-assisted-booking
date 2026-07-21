import { SYSTEM_PROMPT } from "../prompts/system.prompt";
import { BookingAgentState } from "../state/booking.state";
import { AIProvider } from "../providers/ai-provider";

export class LLMNode {
  constructor(private provider: AIProvider) {}

  async execute(state: BookingAgentState) {
    const response = await this.provider.invoke([
      SYSTEM_PROMPT,

      ...state.messages,
    ]);
    console.log("\n===== LLM =====");
    console.log("Content:", response.content);
    console.log("Tool Calls:", response.tool_calls);
    console.log("================\n");

    const hasToolCalls = (response.tool_calls?.length ?? 0) > 0;

    return {
      messages: [...state.messages, response],
      newMessages: [...state.newMessages, response],
      response: hasToolCalls ? state.response : response.text,
    };
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
