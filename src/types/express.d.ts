import "node:http";

import type { AuthContext } from "@/modules/auth/presentation/http/middleware/auth-context";

declare module "http" {
  interface IncomingMessage {
    requestId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      /** Set by auth middleware; absent on public routes. */
      auth?: AuthContext;
    }
  }
}
