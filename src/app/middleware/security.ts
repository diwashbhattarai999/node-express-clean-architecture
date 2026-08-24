import helmet from "helmet";

import { env } from "@/config/env";
import { Environment } from "@/config/environment";

export const securityMiddleware = helmet({
  /**
   * Disables the Content Security Policy.
   * This is a security measure to prevent XSS attacks.
   */
  contentSecurityPolicy: false,

  /**
   * Disables the Cross-Origin Embedder Policy.
   * This is a security measure to prevent CSRF attacks.
   */
  crossOriginEmbedderPolicy: false,

  /**
   * Sets the Referrer Policy to strict-origin-when-cross-origin.
   * This is a security measure to prevent data leaks.
   */
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  /**
   * Sets the Strict Transport Security.
   * This is a security measure to prevent HTTP to HTTPS redirects.
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
   */
  strictTransportSecurity:
    env.NODE_ENV === Environment.PRODUCTION
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: false,
        }
      : false,
});
