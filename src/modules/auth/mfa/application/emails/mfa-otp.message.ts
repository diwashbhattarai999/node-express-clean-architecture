import type { EmailMessage } from "@/shared/email/email.message";
import { escapeHtml } from "@/shared/html/escape-html";

export type MfaOtpMessageParams = {
  email: string;
  code: string;
  brandName?: string;
};

export const buildMfaOtpMessage = (params: MfaOtpMessageParams): EmailMessage => {
  const brandName = params.brandName?.trim() || "Node Express Clean Architecture";
  const safeBrandName = escapeHtml(brandName);
  const safeCode = escapeHtml(params.code);
  const year = new Date().getFullYear();
  const subject = "Your sign-in code";

  const text = [
    "Your sign-in code",
    "",
    `Use this code to finish signing in: ${params.code}`,
    "",
    "This code expires in 10 minutes.",
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#202124;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8eaed;border-radius:12px;">
          <tr>
            <td align="center" style="padding:36px 32px 16px;font-size:22px;font-weight:700;">${safeBrandName}</td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:24px;">Your sign-in code</h1>
              <p style="margin:0 0 24px;color:#5f6368;font-size:15px;">Use this code to finish multi-factor authentication. It expires in 10 minutes.</p>
              <p style="margin:0;font-size:32px;letter-spacing:6px;font-weight:700;">${safeCode}</p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#80868b;">© ${year} ${safeBrandName}. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    to: { email: params.email },
    subject,
    text,
    html,
    tags: { purpose: "mfa_otp" },
  };
};
