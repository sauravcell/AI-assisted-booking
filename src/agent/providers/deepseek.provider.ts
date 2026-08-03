/**
 * DeepSeek implementation of AIProvider.
 *
 * The rest of the application never imports ChatDeepSeek.
 *
 * Only this file knows DeepSeek exists.
 *
 * Note: as of this writing, DeepSeek's "deepseek-reasoner" model does not
 * support tool calling - use "deepseek-chat" (V3) for this agent.
 */
import { AIProvider } from "./ai-provider";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";

export class DeepSeekProvider implements AIProvider {
  constructor(private readonly chat: Runnable<BaseMessage[], AIMessage>) {}

  async invoke(messages: BaseMessage[]): Promise<AIMessage> {
    return this.chat.invoke(messages);
  }
}
