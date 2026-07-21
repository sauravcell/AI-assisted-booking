/**
 * Groq implementation of AIProvider.
 *
 * The rest of the application never imports ChatGroq.
 *
 * Only this file knows Groq exists.
 *
 * Later replacing Groq with OpenAI
 * requires changing only this file.
 */
import { AIProvider } from "./ai-provider";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";

export class GroqProvider implements AIProvider {
  constructor(private readonly chat: Runnable<BaseMessage[], AIMessage>) {}

  async invoke(messages: BaseMessage[]): Promise<AIMessage> {
    return this.chat.invoke(messages);
  }
}
/*
import { AIProvider } from "./ai-provider";
import { BaseMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { config } from "../../config";

export class GroqProvider implements AIProvider {
  private readonly model: ChatGroq;

  constructor() {
    this.model = new ChatGroq({
      apiKey: config.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });
  }

  async invoke(messages: BaseMessage[]): Promise<BaseMessage> {
    return await this.model.invoke(messages);
  }
}
*/
