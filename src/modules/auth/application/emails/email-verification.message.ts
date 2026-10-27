import type { EmailMessage } from "@/shared/email/email.message";

export type EmailVerificationMessageParams = {
  email: string;
  token: string;
  appBaseUrl: string;
};

export const buildEmailVerificationMessage = (
  params: EmailVerificationMessageParams,
): EmailMessage => {
  const verifyPath = `${params.appBaseUrl}/api/v1/auth/email/verify`;

  return {
    to: { email: params.email },
    subject: "Verify your email address",
    text: [
      "Thanks for registering.",
      "",
      `Your email verification token: ${params.token}`,
      "",
      `It expires in 24 hours. POST it to ${verifyPath}`,
      'as JSON: { "token": "<token>" }',
    ].join("\n"),
    html: [
      "<p>Thanks for registering.</p>",
      "<p>Your email verification token:</p>",
      `<p><code>${params.token}</code></p>`,
      `<p>It expires in 24 hours. Submit it to <code>POST ${verifyPath}</code>.</p>`,
    ].join(""),
    tags: { purpose: "email_verification" },
  };
};
