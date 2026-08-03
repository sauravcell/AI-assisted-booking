import { Pool } from "pg";

import { db } from "../database/database";

import { CreateMessage, Message } from "./message.types";

export class MessageRepository {
  constructor(private readonly pool: Pool = db) {}

  /**
   * pg returns raw snake_case columns. Without this mapping,
   * message.toolCallId/toolName/conversationId read as undefined
   * at runtime despite the Message interface declaring them -
   * TypeScript doesn't check the shape of what pg actually hands
   * back.
   */
  private mapRow(row: any): Message {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      toolCallId: row.tool_call_id ?? undefined,
      toolName: row.tool_name,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }

  async create(message: CreateMessage): Promise<Message> {
    const query = `
        INSERT INTO messages (
            conversation_id,
            role,
            content,
            tool_call_id,
            tool_name,
            metadata
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *;
    `;

    const result = await this.pool.query(query, [
      message.conversationId,
      message.role,
      message.content,
      message.toolCallId ?? null,
      message.toolName ?? null,
      message.metadata ?? null,
    ]);

    return this.mapRow(result.rows[0]);
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    const query = `
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC;
    `;

    const result = await this.pool.query(query, [conversationId]);

    return result.rows.map((row) => this.mapRow(row));
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await this.pool.query(
      `
      DELETE
      FROM messages
      WHERE conversation_id = $1;
      `,
      [conversationId],
    );
  }

  async findLatest(conversationId: string): Promise<Message | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
      `,
      [conversationId],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async saveMany(messages: CreateMessage[]): Promise<Message[]> {
    if (messages.length === 0) {
      return [];
    }

    const values: unknown[] = [];

    const placeholders = messages
      .map((message, index) => {
        const offset = index * 6;

        values.push(
          message.conversationId,
          message.role,
          message.content,
          message.toolCallId ?? null,
          message.toolName ?? null,
          message.metadata ?? null,
        );

        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      })
      .join(", ");

    const query = `
    INSERT INTO messages (
      conversation_id,
      role,
      content,
      tool_call_id,
      tool_name,
      metadata
    )
    VALUES ${placeholders}
    RETURNING *;
  `;

    const result = await this.pool.query(query, values);

    return result.rows.map((row) => this.mapRow(row));
  }
}
