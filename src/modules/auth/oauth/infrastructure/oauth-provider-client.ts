import { decodeJwt } from "jose";

import type { OAuthProviderDefinition } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type {
  ExchangeOAuthCodeInput,
  IOauthProviderClient,
  OAuthProviderProfile,
  OAuthProviderTokens,
} from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import { ExternalServiceError } from "@/shared/http-client/errors/external-service.error";
import type { IHttpClient } from "@/shared/http-client/http-client.port";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const readSubject = (value: unknown): string | null => {
  const asString = readString(value);

  if (asString !== null) {
    return asString;
  }

  return typeof value === "number" && Number.isFinite(value) ? String(value) : null;
};

const readBoolean = (value: unknown): boolean => value === true || value === "true";

const parseTokenPayload = (data: unknown): Record<string, unknown> | null => {
  if (isRecord(data)) {
    return data;
  }

  if (typeof data === "string" && data.length > 0) {
    const params = new URLSearchParams(data);
    const record: Record<string, unknown> = {};

    for (const [key, value] of params.entries()) {
      record[key] = value;
    }

    return record;
  }

  return null;
};

const audienceMatches = (aud: unknown, clientId: string): boolean => {
  if (typeof aud === "string") {
    return aud === clientId;
  }

  return Array.isArray(aud) && aud.includes(clientId);
};

export class OauthProviderClient implements IOauthProviderClient {
  public constructor(private readonly httpClient: IHttpClient) {}

  public async exchangeAuthorizationCode(
    input: ExchangeOAuthCodeInput,
  ): Promise<OAuthProviderTokens> {
    const tokenUrl = input.definition.tokenUrl;
    const clientSecret = input.definition.clientSecret;

    if (tokenUrl === undefined || clientSecret === undefined) {
      throw new ExternalServiceError({
        message: "OAuth provider is missing token endpoint credentials.",
      });
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: input.definition.clientId,
      client_secret: clientSecret,
      code_verifier: input.codeVerifier,
    });

    const response = await this.httpClient.request<unknown>({
      method: "POST",
      url: tokenUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      retry: false,
    });

    const payload = parseTokenPayload(response.data);

    if (payload === null || readString(payload.error) !== null) {
      throw new ExternalServiceError({
        message: "OAuth provider token exchange failed.",
        externalStatus: response.status,
      });
    }

    const accessToken = readString(payload.access_token);

    if (accessToken === null) {
      throw new ExternalServiceError({
        message: "OAuth provider token response is missing an access token.",
      });
    }

    const idToken = readString(payload.id_token);

    return {
      accessToken,
      ...(idToken !== null ? { idToken } : {}),
    };
  }

  public async fetchProfile(
    definition: OAuthProviderDefinition,
    tokens: OAuthProviderTokens,
  ): Promise<OAuthProviderProfile> {
    const fromIdToken =
      tokens.idToken !== undefined ? this.profileFromIdToken(tokens.idToken) : null;
    const fromUserinfo =
      definition.userinfoUrl !== undefined
        ? await this.profileFromUserinfo(definition.userinfoUrl, tokens.accessToken)
        : null;

    let email = fromUserinfo?.email ?? fromIdToken?.email ?? null;
    let emailVerified = fromUserinfo?.emailVerified ?? fromIdToken?.emailVerified ?? false;

    if (email === null && definition.emailsUrl !== undefined) {
      const fromEmails = await this.profileFromEmails(definition.emailsUrl, tokens.accessToken);
      email = fromEmails.email;
      emailVerified = fromEmails.emailVerified;
    }

    const providerUserId = fromUserinfo?.providerUserId ?? fromIdToken?.providerUserId ?? null;

    if (providerUserId === null) {
      throw new ExternalServiceError({
        message: "OAuth provider profile is missing a subject.",
      });
    }

    if (fromIdToken !== null && !audienceMatches(fromIdToken.aud, definition.clientId)) {
      throw new ExternalServiceError({
        message: "OAuth id_token audience does not match the client.",
      });
    }

    if (
      fromIdToken !== null &&
      definition.issuer !== undefined &&
      fromIdToken.issuer !== null &&
      fromIdToken.issuer !== definition.issuer
    ) {
      throw new ExternalServiceError({
        message: "OAuth id_token issuer does not match the provider.",
      });
    }

    return {
      providerUserId,
      issuer: fromIdToken?.issuer ?? definition.issuer ?? null,
      email,
      emailVerified,
      displayName: fromUserinfo?.displayName ?? fromIdToken?.displayName ?? null,
      avatarUrl: fromUserinfo?.avatarUrl ?? fromIdToken?.avatarUrl ?? null,
    };
  }

  private profileFromIdToken(idToken: string): {
    providerUserId: string | null;
    issuer: string | null;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
    avatarUrl: string | null;
    aud: unknown;
  } {
    const claims = decodeJwt(idToken);

    if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
      throw new ExternalServiceError({
        message: "OAuth id_token has expired.",
      });
    }

    return {
      providerUserId: readSubject(claims.sub),
      issuer: readString(claims.iss),
      email: readString(claims.email),
      emailVerified: readBoolean(claims.email_verified),
      displayName: readString(claims.name),
      avatarUrl: readString(claims.picture),
      aud: claims.aud,
    };
  }

  private async profileFromUserinfo(
    userinfoUrl: string,
    accessToken: string,
  ): Promise<{
    providerUserId: string | null;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
    avatarUrl: string | null;
  }> {
    const response = await this.httpClient.request<unknown>({
      method: "GET",
      url: userinfoUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "node-express-clean-architecture",
      },
      retry: false,
    });

    if (!isRecord(response.data)) {
      throw new ExternalServiceError({
        message: "OAuth provider userinfo response is invalid.",
      });
    }

    return {
      providerUserId: readSubject(response.data.sub) ?? readSubject(response.data.id),
      email: readString(response.data.email),
      emailVerified: readBoolean(response.data.email_verified),
      displayName: readString(response.data.name) ?? readString(response.data.login),
      avatarUrl: readString(response.data.picture) ?? readString(response.data.avatar_url),
    };
  }

  private async profileFromEmails(
    emailsUrl: string,
    accessToken: string,
  ): Promise<{ email: string | null; emailVerified: boolean }> {
    const response = await this.httpClient.request<unknown>({
      method: "GET",
      url: emailsUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "node-express-clean-architecture",
      },
      retry: false,
    });

    if (!Array.isArray(response.data)) {
      return { email: null, emailVerified: false };
    }

    const emails = response.data.filter(isRecord);
    const primaryVerified = emails.find(
      (row) => row.primary === true && row.verified === true && readString(row.email) !== null,
    );
    const anyVerified = emails.find(
      (row) => row.verified === true && readString(row.email) !== null,
    );
    const chosen = primaryVerified ?? anyVerified;

    if (!chosen) {
      return { email: null, emailVerified: false };
    }

    return {
      email: readString(chosen.email),
      emailVerified: true,
    };
  }
}
