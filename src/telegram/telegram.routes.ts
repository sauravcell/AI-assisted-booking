import { Router } from "express";

import { telegramController } from "../bootstrap/telegram.bootstrap";

const router = Router();

router.post("/webhook", telegramController.handleWebhook);

export default router;
