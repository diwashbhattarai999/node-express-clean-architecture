import cors from "cors";

import { env } from "@/config/env";

export const corsMiddleware = cors({
  /**
   * The origins that are allowed to access the API.
   */
  origin: env.CORS_ORIGINS,

  /**
   * Whether the request can include credentials.
   */
  credentials: true,
});
