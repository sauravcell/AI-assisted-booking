import { Request, Response } from "express";

import { TelegramService } from "./telegram.service";

export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Telegram webhook endpoint.
   *
   * Always acknowledge Telegram immediately.
   * Process the update asynchronously to avoid retries.
   */
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    res.sendStatus(200);
    console.log("Message received: ", req.body);
    try {
      await this.telegramService.handleUpdate(req.body);
    } catch (error) {
      console.error("Telegram webhook failed:", error);
    }
  };
}
