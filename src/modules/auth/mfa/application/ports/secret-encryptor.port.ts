export interface ISecretEncryptor {
  encrypt(plaintext: string): string;
  decrypt(payload: string): string;
}
