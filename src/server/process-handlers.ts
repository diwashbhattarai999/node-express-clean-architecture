import { logger } from "@/shared/logger/logger";

export const registerProcessHandlers = (
  onShutdown: (signal: NodeJS.Signals) => Promise<void>,
): void => {
  process.once("SIGTERM", () => {
    void onShutdown("SIGTERM");
  });

  process.once("SIGINT", () => {
    void onShutdown("SIGINT");
  });

  process.once("uncaughtException", (error) => {
    logger.fatal({ error }, "Uncaught exception");

    void onShutdown("SIGTERM");
  });

  process.once("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection");

    void onShutdown("SIGTERM");
  });
};
