export type MessageRole = "user" | "assistant" | "tool";

export interface Message {
  id: string;

  conversationId: string;

  role: MessageRole;

  content: string;

  toolName: string | null;

  metadata: Record<string, any> | null;

  createdAt: Date;
}

export interface CreateMessage {
  conversationId: string;

  role: MessageRole;

  content: string;

  toolName?: string | null;

  metadata?: Record<string, any> | null;
}
