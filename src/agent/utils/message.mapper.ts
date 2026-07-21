// fromLangChainMessage();

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";

import { Message } from "../../message/message.types";

export function toLangChainMessages(messages: Message[]): BaseMessage[] {
  return messages.map((message) => {
    switch (message.role) {
      case "user":
        return new HumanMessage(message.content);

      case "assistant":
        return new AIMessage(message.content);

      case "tool":
        return new ToolMessage({
          content: message.content,
          tool_call_id: message.toolName ?? "unknown",
        });

      default:
        throw new Error(`Unsupported message role: ${message.role}`);
    }
  });
}

export function fromAIMessage(message: AIMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  return JSON.stringify(message.content);
}
