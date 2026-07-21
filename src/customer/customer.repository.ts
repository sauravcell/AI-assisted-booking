import { Pool } from "pg";
import { db } from "../database/database";
import { CreateCustomer, Customer } from "./customer.types";

export class CustomerRepository {
  constructor(private readonly pool: Pool = db) {}

  /**
   * Maps a PostgreSQL row to our domain model.
   * This keeps database column names out of the rest of the application.
   */
  private mapRowToCustomer(row: any): Customer {
    return {
      id: row.id,
      telegramChatId: row.telegram_chat_id,
      telegramUsername: row.telegram_username,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      languageCode: row.language_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Finds a customer by Telegram chat ID.
   */
  async findByTelegramChatId(chatId: number): Promise<Customer | null> {
    const query = `
      SELECT *
      FROM customers
      WHERE telegram_chat_id = $1
      LIMIT 1;
    `;

    const result = await this.pool.query(query, [chatId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCustomer(result.rows[0]);
  }

  /**
   * Create new customer.
   */
  async create(customer: CreateCustomer): Promise<Customer> {
    const query = `
    INSERT INTO customers
    (
      telegram_chat_id,
      telegram_username,
      first_name,
      last_name,
      language_code
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

    const values = [
      customer.telegramChatId,
      customer.telegramUsername ?? null,
      customer.firstName ?? null,
      customer.lastName ?? null,
      customer.languageCode ?? null,
    ];

    const result = await this.pool.query(query, values);

    return this.mapRowToCustomer(result.rows[0]);
  }

  /**
   * if not existing then create
   */
  async findOrCreate(customer: CreateCustomer): Promise<Customer> {
    const existingCustomer = await this.findByTelegramChatId(
      customer.telegramChatId,
    );

    if (existingCustomer) {
      return existingCustomer;
    }

    return this.create(customer);
  }
}
