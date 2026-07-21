import { MessageRepository } from "./message.repository";

import { CreateMessage, Message } from "./message.types";

export class MessageService {
  constructor(private readonly repository: MessageRepository) {}

  async saveMessage(message: CreateMessage): Promise<Message> {
    return this.repository.create(message);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.repository.findByConversationId(conversationId);
  }

  async getLatestMessage(conversationId: string): Promise<Message | null> {
    return this.repository.findLatest(conversationId);
  }

  async clearConversation(conversationId: string): Promise<void> {
    await this.repository.deleteByConversationId(conversationId);
  }

  async saveMany(messages: CreateMessage[]) {
    return this.repository.saveMany(messages);
  }
}
