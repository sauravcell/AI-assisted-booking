export interface Conversation {
  id: string;
  customerId: string;
  startedAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
}

export interface CreateConversation {
  customerId: string;
}
