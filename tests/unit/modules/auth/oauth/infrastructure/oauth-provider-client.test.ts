import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OauthProviderClient } from "@/modules/auth/oauth/infrastructure/oauth-provider-client";
import { ExternalServiceError } from "@/shared/http-client/errors/external-service.error";
import type { IHttpClient } from "@/shared/http-client/http-client.port";

describe("OauthProviderClient", () => {
  const httpClient: IHttpClient = {
    request: vi.fn(),
  };

  const client = new OauthProviderClient(httpClient);

  const google = {
    name: OAuthProviderName.GOOGLE,
    clientId: "google-client",
    clientSecret: "google-secret",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    issuer: "https://accounts.google.com",
    scopes: ["openid", "email", "profile"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges an authorization code and reads the access token", async () => {
    vi.mocked(httpClient.request).mockResolvedValue({
      status: 200,
      headers: {},
      data: { access_token: "idp-access", id_token: "header.payload.sig" },
    });

    const tokens = await client.exchangeAuthorizationCode({
      definition: google,
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: "http://localhost:3000/api/v1/auth/oauth/google/callback",
    });

    expect(tokens.accessToken).toBe("idp-access");
    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://oauth2.googleapis.com/token",
        retry: false,
      }),
    );
  });

  it("throws when the token payload has no access token", async () => {
    vi.mocked(httpClient.request).mockResolvedValue({
      status: 200,
      headers: {},
      data: { error: "invalid_grant" },
    });

    await expect(
      client.exchangeAuthorizationCode({
        definition: google,
        code: "auth-code",
        codeVerifier: "verifier",
        redirectUri: "http://localhost:3000/api/v1/auth/oauth/google/callback",
      }),
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });

  it("reads subject and email from userinfo", async () => {
    vi.mocked(httpClient.request).mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        sub: "google-sub-1",
        email: "ada@example.com",
        email_verified: true,
        name: "Ada",
        picture: "https://example.com/ada.png",
      },
    });

    const profile = await client.fetchProfile(google, { accessToken: "idp-access" });

    expect(profile).toEqual({
      providerUserId: "google-sub-1",
      issuer: "https://accounts.google.com",
      email: "ada@example.com",
      emailVerified: true,
      displayName: "Ada",
      avatarUrl: "https://example.com/ada.png",
    });
  });
});
