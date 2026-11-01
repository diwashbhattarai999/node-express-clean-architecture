import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export type MfaRequiredDetails = {
  mfaToken: string;
};

export class MfaRequiredError extends AppError {
  public constructor(mfaToken: string) {
    super({
      code: ErrorCode.MFA_REQUIRED,
      message: "Multi-factor authentication is required.",
      statusCode: HttpStatus.FORBIDDEN,
      details: { mfaToken } satisfies MfaRequiredDetails,
    });

    this.name = "MfaRequiredError";
  }
}
