import type { EmailMessage } from "@/shared/email/email.message";
import { buildFrontendUrl, FrontendRoutes } from "@/shared/frontend";
import { escapeHtml } from "@/shared/html/escape-html";

export type MagicLinkMessageParams = {
  email: string;
  token: string;
  frontendBaseUrl: string;
  brandName?: string;
};

export const buildMagicLinkMessage = (params: MagicLinkMessageParams): EmailMessage => {
  const brandName = params.brandName?.trim() || "Node Express Clean Architecture";
  const signInUrl = buildFrontendUrl({
    baseUrl: params.frontendBaseUrl,
    path: FrontendRoutes.magicLink,
    query: { token: params.token },
  });

  const safeSignInUrl = escapeHtml(signInUrl);
  const safeBrandName = escapeHtml(brandName);
  const year = new Date().getFullYear();

  const subject = "Sign in to your account";
  const previewText = "Use this link to sign in without a password.";

  const text = [
    "Sign in to your account",
    "",
    "We received a request to sign in with a magic link.",
    "Use the link below to continue.",
    "",
    `Sign in: ${signInUrl}`,
    "",
    "This link expires in 15 minutes.",
    "",
    "If you did not request this, you can safely ignore this email.",
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
                Sign in to your account
              </h1>

              <p style="
                margin: 0 0 28px;
                text-align: center;
                font-size: 15px;
                line-height: 25px;
                color: #5f6368;
              ">
                We received a request to sign in with a magic link.
                Use the button below to continue.
              </p>

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
                            href="${safeSignInUrl}"
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
                            Sign in
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
                This link expires in 15 minutes.
              </p>
            </td>
          </tr>

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
                Didn't request this?
              </p>

              <p style="
                margin: 0;
                font-size: 12px;
                line-height: 20px;
                color: #6f7378;
              ">
                You can safely ignore this email. Nobody can sign in
                unless they use the link above.
              </p>
            </td>
          </tr>
        </table>

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
    tags: { purpose: "magic_link" },
  };
};
