import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export type TAuthProviderType = "oauth" | "oidc" | "password" | "magic_link";

export type AuthProviderPublic = {
  id: string;
  name: string;
  type: TAuthProviderType;
  enabled: boolean;
};

export const AUTH_PROVIDER_PUBLIC_LABELS: Record<TOauthProviderName, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
  microsoft: "Microsoft",
  oidc: "OIDC",
};
