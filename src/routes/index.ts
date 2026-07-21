import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
  res.json({
    success: true,
    message: "AI Booking Platform is running.",
  });
});

export default router;
