import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import { getAuthContext } from "@/modules/auth/presentation/http/middleware/auth-context";
import { requireRefreshAuth } from "@/modules/auth/presentation/http/middleware/require-refresh-auth.middleware";
import { ForbiddenError } from "@/shared/errors/forbidden-error";

describe("requireRefreshAuth", () => {
  const res = {} as Response;

  it("attaches refresh credentials from the body", async () => {
    const req = {
      body: { refreshToken: "body-token" },
      cookies: {},
      get: vi.fn(),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await new Promise<void>((resolve, reject) => {
      requireRefreshAuth(req, res, ((error?: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }) as NextFunction);
    });

    expect(getAuthContext(req)).toEqual({
      refresh: { refreshToken: "body-token", fromCookie: false },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("requires CSRF when refresh comes from cookie", async () => {
    const req = {
      body: {},
      cookies: { refresh_token: "cookie-token", csrf_token: "csrf" },
      get: vi.fn(() => "csrf"),
    } as unknown as Request;

    await new Promise<void>((resolve, reject) => {
      requireRefreshAuth(req, res, ((error?: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }) as NextFunction);
    });

    expect(getAuthContext(req)?.refresh).toMatchObject({
      refreshToken: "cookie-token",
      fromCookie: true,
    });
  });

  it("rejects missing refresh credentials", async () => {
    const req = {
      body: {},
      cookies: {},
      get: vi.fn(),
    } as unknown as Request;

    await expect(
      new Promise<void>((resolve, reject) => {
        requireRefreshAuth(req, res, ((error?: unknown) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        }) as NextFunction);
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("rejects cookie refresh without CSRF", async () => {
    const req = {
      body: {},
      cookies: { refresh_token: "cookie-token" },
      get: vi.fn(() => undefined),
    } as unknown as Request;

    await expect(
      new Promise<void>((resolve, reject) => {
        requireRefreshAuth(req, res, ((error?: unknown) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        }) as NextFunction);
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
