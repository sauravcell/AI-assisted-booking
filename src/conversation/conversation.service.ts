import { ConversationRepository } from "./conversation.repository";
import { Conversation } from "./conversation.types";

export class ConversationService {
  constructor(private readonly repository = new ConversationRepository()) {}

  async findOrCreate(customerId: string): Promise<Conversation> {
    const existing = await this.repository.findActiveByCustomerId(customerId);

    if (existing) {
      return existing;
    }

    return this.repository.create({
      customerId,
    });
  }

  async touch(conversationId: string) {
    await this.repository.updateLastMessageTime(conversationId);
  }

  async close(conversationId: string) {
    await this.repository.close(conversationId);
  }
}
