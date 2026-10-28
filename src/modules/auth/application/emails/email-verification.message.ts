import type { EmailMessage } from "@/shared/email/email.message";
import { buildFrontendUrl, FrontendRoutes } from "@/shared/frontend";
import { escapeHtml } from "@/shared/html/escape-html";

export type EmailVerificationMessageParams = {
  email: string;
  token: string;
  frontendBaseUrl: string;
  brandName?: string;
};

export const buildEmailVerificationMessage = (
  params: EmailVerificationMessageParams,
): EmailMessage => {
  const brandName = params.brandName?.trim() || "Node Express Clean Architecture";
  const verificationUrl = buildFrontendUrl({
    baseUrl: params.frontendBaseUrl,
    path: FrontendRoutes.verifyEmail,
    query: { token: params.token },
  });

  const safeVerificationUrl = escapeHtml(verificationUrl);
  const safeBrandName = escapeHtml(brandName);
  const year = new Date().getFullYear();

  const subject = "Verify your email address";
  const previewText = "One quick step to finish setting up your account.";

  const text = [
    "Verify your email address",
    "",
    "Thanks for creating an account!",
    "Please verify your email address to finish setting up your account.",
    "",
    `Verify your email: ${verificationUrl}`,
    "",
    "This verification link expires in 24 hours.",
    "",
    "If you didn't create this account, you can safely ignore this email.",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${subject}</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f5f7;
  font-family: Arial, Helvetica, sans-serif;
  color: #202124;
  -webkit-text-size-adjust: 100%;
">
  <!-- Preheader -->
  <div style="
    display: none;
    font-size: 1px;
    color: #f4f5f7;
    line-height: 1px;
    max-height: 0;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    mso-hide: all;
  ">
    ${previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color: #f4f5f7;"
  >
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 560px;
            background-color: #ffffff;
            border: 1px solid #e8eaed;
            border-radius: 12px;
          "
        >
          <!-- Brand -->
          <tr>
            <td align="center" style="padding: 36px 32px 24px;">
              <div style="
                font-size: 22px;
                line-height: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
                color: #202124;
              ">
                ${safeBrandName}
              </div>
            </td>
          </tr>

          <!-- Verification icon -->
          <tr>
            <td align="center" style="padding: 0 32px 20px;">
              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width: 64px;
                  height: 64px;
                  background-color: #eef2ff;
                  border-radius: 50%;
                "
              >
                <tr>
                  <td
                    align="center"
                    valign="middle"
                    style="
                      color: #4338ca;
                      font-size: 30px;
                      line-height: 64px;
                      font-weight: 700;
                    "
                  >
                    ✓
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 0 32px;">
              <h1 style="
                margin: 0 0 14px;
                text-align: center;
                font-size: 27px;
                line-height: 35px;
                font-weight: 700;
                letter-spacing: -0.6px;
                color: #202124;
              ">
                Verify your email address
              </h1>

              <p style="
                margin: 0 0 28px;
                text-align: center;
                font-size: 15px;
                line-height: 25px;
                color: #5f6368;
              ">
                Thanks for creating an account! Verify your email
                address to finish setting up your account and get started.
              </p>

              <!-- Primary CTA -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td align="center">
                    <table
                      role="presentation"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td
                          align="center"
                          bgcolor="#4338ca"
                          style="border-radius: 8px;"
                        >
                          <a
                            href="${safeVerificationUrl}"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 15px 30px;
                              border: 1px solid #4338ca;
                              border-radius: 8px;
                              font-size: 15px;
                              line-height: 20px;
                              font-weight: 700;
                              color: #ffffff;
                              text-decoration: none;
                            "
                          >
                            Verify email address
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="
                margin: 18px 0 32px;
                text-align: center;
                font-size: 13px;
                line-height: 21px;
                color: #80868b;
              ">
                This verification link expires in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="
              padding: 22px 32px;
              background-color: #f8f9fa;
              border-top: 1px solid #e8eaed;
              border-radius: 0 0 12px 12px;
            ">
              <p style="
                margin: 0 0 8px;
                font-size: 13px;
                line-height: 20px;
                font-weight: 700;
                color: #3c4043;
              ">
                Didn't create an account?
              </p>

              <p style="
                margin: 0;
                font-size: 12px;
                line-height: 20px;
                color: #6f7378;
              ">
                You can safely ignore this email. Your email address
                won't be verified unless the verification process
                is completed.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width: 560px;"
        >
          <tr>
            <td align="center" style="padding: 24px 16px 0;">
              <p style="
                margin: 0 0 6px;
                font-size: 12px;
                line-height: 19px;
                color: #80868b;
              ">
                This is an automated message. Please do not reply.
              </p>

              <p style="
                margin: 0;
                font-size: 11px;
                line-height: 18px;
                color: #9aa0a6;
              ">
                © ${year} ${safeBrandName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

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
    tags: { purpose: "email_verification" },
  };
};
