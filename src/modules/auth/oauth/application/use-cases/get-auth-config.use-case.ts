import type { AuthProviderPublic } from "@/modules/auth/oauth/application/types/auth-provider-public";
import type { ListAuthProvidersUseCase } from "@/modules/auth/oauth/application/use-cases/list-auth-providers.use-case";
import { AUTH_PASSWORD_POLICY } from "@/modules/auth/shared/application/constants/password-policy";

export type AuthConfigFeatures = {
  registration: boolean;
  oauth: boolean;
  magicLink: boolean;
  mfa: boolean;
  passkeys: boolean;
  phoneAuth: boolean;
};

export type AuthConfig = {
  passwordPolicy: typeof AUTH_PASSWORD_POLICY;
  features: AuthConfigFeatures;
  providers: AuthProviderPublic[];
};

export class GetAuthConfigUseCase {
  public constructor(private readonly listAuthProvidersUseCase: ListAuthProvidersUseCase) {}

  public execute(): AuthConfig {
    const { providers } = this.listAuthProvidersUseCase.execute();

    return {
      passwordPolicy: AUTH_PASSWORD_POLICY,
      features: {
        registration: true,
        oauth: providers.some(
          (provider) => (provider.type === "oauth" || provider.type === "oidc") && provider.enabled,
        ),
        magicLink: providers.some((provider) => provider.type === "magic_link" && provider.enabled),
        mfa: true,
        passkeys: false,
        phoneAuth: true,
      },
      providers,
    };
  }
}
