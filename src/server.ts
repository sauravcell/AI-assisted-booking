import app from "./app";

import { config } from "./config";

import { logger } from "./shared/logger/logger";

import { testConnection } from "./database/testConnection";
import { testGroqProvider } from "./agent/providers/testGroqProvider";
import { createAgent } from "./bootstrap/agent.bootstrap";

async function bootstrap() {
  try {
    logger.info("Starting AI Booking Platform...");

    await testConnection();

    logger.info("Database Connected");

    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
    await testGroqProvider();
  } catch (error) {
    logger.error(error);

    process.exit(1);
  }
}

bootstrap();
