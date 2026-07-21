import { Pool } from "pg";
import { db } from "../database/database";
import { Conversation, CreateConversation } from "./conversation.types";

export class ConversationRepository {
  constructor(private readonly pool: Pool = db) {}

  private mapRow(row: any): Conversation {
    return {
      id: row.id,
      customerId: row.customer_id,
      startedAt: row.started_at,
      lastMessageAt: row.last_message_at,
      isActive: row.is_active,
    };
  }

  async findActiveByCustomerId(
    customerId: string,
  ): Promise<Conversation | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM conversations
      WHERE customer_id = $1
      AND is_active = TRUE
      LIMIT 1;
      `,
      [customerId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async create(data: CreateConversation): Promise<Conversation> {
    const result = await this.pool.query(
      `
      INSERT INTO conversations(customer_id)
      VALUES($1)
      RETURNING *;
      `,
      [data.customerId],
    );

    return this.mapRow(result.rows[0]);
  }

  async updateLastMessageTime(conversationId: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE conversations
      SET last_message_at = NOW()
      WHERE id = $1;
      `,
      [conversationId],
    );
  }

  async close(conversationId: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE conversations
      SET is_active = FALSE
      WHERE id = $1;
      `,
      [conversationId],
    );
  }
}
