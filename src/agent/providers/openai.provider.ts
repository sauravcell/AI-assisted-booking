/**
 * OpenAI implementation of AIProvider.
 *
 * The rest of the application never imports ChatOpenAI.
 *
 * Only this file knows OpenAI exists.
 */
import { AIProvider } from "./ai-provider";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";

export class OpenAIProvider implements AIProvider {
  constructor(private readonly chat: Runnable<BaseMessage[], AIMessage>) {}

  async invoke(messages: BaseMessage[]): Promise<AIMessage> {
    return this.chat.invoke(messages);
  }
}
