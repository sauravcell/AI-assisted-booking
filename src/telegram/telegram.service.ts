import axios from "axios";

import { config } from "../config";

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
      return;
    }

    if (!message.text) {
      await this.sendMessage(
        message.chat.id,
        "Sorry, I currently support text messages only.",
      );

      return;
    }

    try {
      await this.handleTextMessage(message);
    } catch (error) {
      console.error("Telegram update failed:", error);

      await this.sendMessage(
        message.chat.id,
        "Sorry, something went wrong. Please try again.",
      );
    }
  }

  /**
   * Handles incoming text messages.
   */
  private async handleTextMessage(message: TelegramMessage): Promise<void> {
    const customer = await this.customerService.findOrCreate({
      //   telegramChatId: String(message.chat.id),
      telegramChatId: message.chat.id, //currently number type is used

      telegramUsername: message.from?.username ?? "",
    });

    const aiResponse = await this.aiChatService.chat({
      customerId: customer.id,

      text: message.text!,
    });

    await this.sendMessage(message.chat.id, aiResponse.response);
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
