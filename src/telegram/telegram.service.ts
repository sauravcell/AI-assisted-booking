import axios from "axios";

import { config } from "../config";

import { logger } from "../shared/logger/logger";

import { CustomerService } from "../customer/customer.service";
import { AIChatService } from "../ai/ai-chat.service";

import { TelegramMessage, TelegramUpdate } from "./telegram.types";
export class TelegramService {
  private readonly apiUrl: string;

  constructor(
    private readonly customerService: CustomerService,
    private readonly aiChatService: AIChatService,
  ) {
    this.apiUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;
  }

  /**
   * Entry point from the webhook.
   */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;

    if (!message) {
      logger.debug({ update }, "[telegram] update has no message, skipping");

      return;
    }

    const chatId = message.chat.id;

    if (!message.text) {
      logger.debug({ chatId }, "[telegram] non-text message received, ignoring");

      await this.sendMessage(
        chatId,
        "Sorry, I currently support text messages only.",
      );

      return;
    }

    logger.debug({ chatId, text: message.text }, "[telegram] text message received");

    try {
      await this.handleTextMessage(message);
    } catch (error) {
      logger.error({ err: error, chatId }, "[telegram] failed to handle message");

      await this.sendMessage(
        chatId,
        "Sorry, something went wrong. Please try again.",
      );
    }
  }

  /**
   * Handles incoming text messages.
   */
  private async handleTextMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;

    const customer = await this.customerService.findOrCreate({
      //   telegramChatId: String(message.chat.id),
      telegramChatId: chatId, //currently number type is used

      telegramUsername: message.from?.username ?? "",
    });

    logger.debug(
      { chatId, customerId: customer.id },
      "[telegram] resolved customer",
    );

    const startedAt = Date.now();

    const aiResponse = await this.aiChatService.chat({
      customerId: customer.id,

      text: message.text!,
    });

    logger.debug(
      {
        chatId,
        customerId: customer.id,
        conversationId: aiResponse.conversationId,
        durationMs: Date.now() - startedAt,
        response: aiResponse.response,
      },
      "[telegram] agent responded",
    );

    await this.sendMessage(chatId, aiResponse.response);

    logger.debug({ chatId }, "[telegram] reply sent");
  }

  /**
   * Sends a text message back to Telegram.
   */
  private async sendMessage(chatId: number, text: string): Promise<void> {
    await axios.post(`${this.apiUrl}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  }
}
