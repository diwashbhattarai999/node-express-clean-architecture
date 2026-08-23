import { createApp } from "@/app/create-app";
import { env } from "@/config/env";
import { createHttpServer } from "@/server/create-server";
import { createShutdownHandler } from "@/server/shutdown";
import { logger } from "@/shared/logger/logger";

import { registerProcessHandlers } from "./server/process-handlers";

const startServer = async (): Promise<void> => {
  const app = createApp();
  const server = createHttpServer(app);

  const shutdown = createShutdownHandler(server);
  registerProcessHandlers(shutdown);

  server.listen(env.PORT, env.HOST, () => {
    logger.info(`Server started on ${env.BASE_URL} — Environment: ${env.NODE_ENV}`);
  });
};

startServer().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to start server");

  process.exit(1);
});
