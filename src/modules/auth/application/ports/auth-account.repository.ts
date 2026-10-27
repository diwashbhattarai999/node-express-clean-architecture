export type TLoginIdentityType = "email" | "phone" | "username";

export type RegisterEmailIdentity = {
  identifier: string;
  normalizedIdentifier: string;
};

export type RegisterPhoneIdentity = {
  identifier: string;
  normalizedIdentifier: string;
};

export type RegisterVerificationToken = {
  purpose: "email_verification" | "phone_verification";
  tokenHash: string;
  expiresAt: Date;
  maxAttempts?: number;
};

export type RegisterAccountInput = {
  id: string;
  displayName: string | null;
  passwordHash: string;
  email?: RegisterEmailIdentity;
  phone?: RegisterPhoneIdentity;
  verificationToken: RegisterVerificationToken;
};

export type RegisteredAccount = {
  id: string;
  status: "pending_verification";
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  username: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IAuthAccountRepository {
  findIdentityByNormalized(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<{ userId: string } | null>;

  register(input: RegisterAccountInput): Promise<RegisteredAccount>;
}
