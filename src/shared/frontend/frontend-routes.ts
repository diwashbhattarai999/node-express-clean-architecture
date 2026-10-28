/**
 * Frontend pathnames used in emails, redirects, and deep links.
 * Keep route strings here so product URL changes stay in one place.
 */
export const FrontendRoutes = {
  verifyEmail: "/verify-email",
  resetPassword: "/reset-password",
} as const;

export type TFrontendRoute = (typeof FrontendRoutes)[keyof typeof FrontendRoutes];
