import { InvalidEmailError } from "@/modules/users/domain/errors/invalid-email.error";

export class Email {
  private constructor(private readonly value: string) {}

  public static create(value: string): Email {
    const normalizedValue = value.trim().toLowerCase();

    if (!Email.isValid(normalizedValue)) {
      throw new InvalidEmailError();
    }

    return new Email(normalizedValue);
  }

  private static isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
