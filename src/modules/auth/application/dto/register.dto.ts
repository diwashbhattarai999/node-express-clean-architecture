export type RegisterDto = {
  email?: string | undefined;
  phone?: string | undefined;
  password: string;
  confirmPassword: string;
  displayName?: string | undefined;
};
