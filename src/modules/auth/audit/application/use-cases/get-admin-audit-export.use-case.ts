import { auditLogExportStorageKey } from "@/modules/auth/audit/application/constants/audit-export";
import {
  AUDIT_LOG_EXPORT_FORMATS,
  type TAuditLogExportFormat,
} from "@/modules/auth/audit/application/constants/security-events";
import { AuditExportNotFoundError } from "@/modules/auth/audit/application/errors/audit-export-not-found.error";
import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { StorageObjectNotFoundError } from "@/shared/storage/errors/storage.error";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

export type GetAdminAuditExportInput = {
  userId: string;
  sessionId: string;
  exportId: string;
};

export type GetAdminAuditExportResult = {
  format: TAuditLogExportFormat;
  filename: string;
  contentType: string;
  body: Buffer;
};

const CONTENT_TYPE: Record<TAuditLogExportFormat, string> = {
  csv: "text/csv",
  json: "application/json",
};

export class GetAdminAuditExportUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
    private readonly objectStorage: IObjectStorage,
  ) {}

  public async execute(input: GetAdminAuditExportInput): Promise<GetAdminAuditExportResult> {
    const principal = await this.identityRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (principal.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        break;
    }

    const allowed = await this.permissionRepository.hasKeyForUser(
      input.userId,
      PermissionKey.AUDIT_LOGS_EXPORT,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    for (const format of AUDIT_LOG_EXPORT_FORMATS) {
      const key = auditLogExportStorageKey(input.exportId, format);
      const exists = await this.objectStorage.exists(key);

      if (!exists) {
        continue;
      }

      try {
        const object = await this.objectStorage.getObject(key);

        return {
          format,
          filename: `audit-export-${input.exportId}.${format}`,
          contentType: CONTENT_TYPE[format],
          body: object.body,
        };
      } catch (error) {
        if (error instanceof StorageObjectNotFoundError) {
          continue;
        }

        throw error;
      }
    }

    throw new AuditExportNotFoundError();
  }
}
