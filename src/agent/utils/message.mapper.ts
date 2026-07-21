import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";

import { CreateMessage, Message } from "../../message/message.types";

/**
 * -------------------------
 * Database -> LangChain
 * -------------------------
 */
export function toLangChainMessages(messages: Message[]): BaseMessage[] {
  return messages.map((message) => {
    switch (message.role) {
      case "user":
        return new HumanMessage(message.content);

      case "assistant":
        return new AIMessage({
          content: message.content,
        });

      case "tool":
        return new ToolMessage({
          content: message.content,
          tool_call_id: message.toolCallId ?? "",
        });

      default:
        throw new Error(`Unsupported role: ${message.role}`);
    }
  });
}

/**
 * -------------------------
 * LangChain -> Database
 * -------------------------
 */
export function toDatabaseMessage(
  conversationId: string,
  message: BaseMessage,
): CreateMessage {
  if (message instanceof HumanMessage) {
    return {
      conversationId,
      role: "user",
      content: extractContent(message),
    };
  }

  if (message instanceof ToolMessage) {
    return {
      conversationId,
      role: "tool",
      content: extractContent(message),
      toolCallId: message.tool_call_id,
    };
  }

  if (message instanceof AIMessage) {
    return {
      conversationId,
      role: "assistant",
      content: extractContent(message),

      // <-- preserve first tool call information
      toolCallId: message.tool_calls?.[0]?.id,
      toolName: message.tool_calls?.[0]?.name,
    };
  }

  throw new Error(`Unsupported LangChain message: ${message.constructor.name}`);
}

export function toDatabaseMessages(
  conversationId: string,
  messages: BaseMessage[],
): CreateMessage[] {
  return messages.map((m) => toDatabaseMessage(conversationId, m));
}

export function extractContent(message: BaseMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  return JSON.stringify(message.content);
}
