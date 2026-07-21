import { BaseMessage, AIMessage } from "@langchain/core/messages";

export interface AIProvider {
  invoke(messages: BaseMessage[]): Promise<AIMessage>;
}
