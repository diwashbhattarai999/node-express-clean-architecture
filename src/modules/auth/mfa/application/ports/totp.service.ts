export type GenerateTotpSecretResult = {
  secret: string;
};

export type BuildOtpauthUrlParams = {
  secret: string;
  accountName: string;
  issuer: string;
};

export interface ITotpService {
  generateSecret(): GenerateTotpSecretResult;
  buildOtpauthUrl(params: BuildOtpauthUrlParams): string;
  generate(secret: string, at?: Date): string;
  verify(secret: string, code: string, at?: Date): boolean;
}
