/**
 * Gemini implementation of AIProvider.
 *
 * The rest of the application never imports ChatGoogleGenerativeAI.
 *
 * Only this file knows Gemini exists.
 */
import { AIProvider } from "./ai-provider";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";

export class GeminiProvider implements AIProvider {
  constructor(private readonly chat: Runnable<BaseMessage[], AIMessage>) {}

  async invoke(messages: BaseMessage[]): Promise<AIMessage> {
    return this.chat.invoke(messages);
  }
}
