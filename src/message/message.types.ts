export type MessageRole = "user" | "assistant" | "tool";

export interface Message {
  id: string;

  conversationId: string;

  role: MessageRole;

  content: string;

  toolCallId?: string;

  toolName: string | null;

  metadata: Record<string, any> | null;

  createdAt: Date;
}

/**
 * Minimal shape needed to replay conversation history into
 * LangChain messages (see toLangChainMessages). findByConversationId
 * returns this instead of the full Message, since nothing in that
 * path reads id/conversationId/toolName/createdAt.
 */
export type MessageForContext = Pick<
  Message,
  "role" | "content" | "toolCallId" | "metadata"
>;

export interface CreateMessage {
  conversationId: string;

  role: MessageRole;

  content: string;

  toolCallId?: string;

  toolName?: string | null;

  metadata?: Record<string, any> | null;
}
