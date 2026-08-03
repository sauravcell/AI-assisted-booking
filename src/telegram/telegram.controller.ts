import { Request, Response } from "express";

import { logger } from "../shared/logger/logger";

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

    logger.debug({ update: req.body }, "[webhook] update received");

    try {
      await this.telegramService.handleUpdate(req.body);
    } catch (error) {
      logger.error({ err: error }, "[webhook] update handling failed");
    }
  };
}
