import { Router } from "express";

import telegramRoutes from "../telegram/telegram.routes";

const router = Router();

router.get("/", (_, res) => {
  res.send("AI Booking Platform");
});

router.use("/v1/webhook", telegramRoutes);

export default router;
