import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestUser } from "@tests/helpers/users";

const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockPasswordHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

vi.mock("@/modules/users/infrastructure/repositories/postgres-user.repository", () => ({
  PostgresUserRepository: vi.fn(function PostgresUserRepository() {
    return mockUserRepository;
  }),
}));

vi.mock("@/modules/users/infrastructure/security/argon2-password-hasher", () => ({
  Argon2PasswordHasher: vi.fn(function Argon2PasswordHasher() {
    return mockPasswordHasher;
  }),
}));

const { createApp } = await import("@/app/create-app");

describe("Users API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPasswordHasher.hash.mockResolvedValue("hashed-password");
  });

  describe("POST /api/v1/users", () => {
    it("creates a user", async () => {
      const user = createTestUser({
        name: "John Doe",
        email: "john@example.com",
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(user);

      const response = await request(app).post("/api/v1/users").send({
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: "User created successfully.",
        data: {
          id: user.getId(),
          name: "John Doe",
          email: "john@example.com",
          createdAt: user.getCreatedAt().toISOString(),
          updatedAt: user.getUpdatedAt().toISOString(),
        },
      });
      expect(response.body.data).not.toHaveProperty("passwordHash");
    });

    it("returns validation errors for an invalid payload", async () => {
      const response = await request(app).post("/api/v1/users").send({});

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      });
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "field",
            path: "name",
            location: "body",
          }),
        ]),
      );
    });

    it("returns a conflict when the email already exists", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(createTestUser());

      const response = await request(app).post("/api/v1/users").send({
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        code: "USER_EMAIL_ALREADY_EXISTS",
      });
    });
  });

  describe("GET /api/v1/users", () => {
    it("lists users with pagination meta", async () => {
      const users = [
        createTestUser({ email: "john@example.com" }),
        createTestUser({ name: "Jane Doe", email: "jane@example.com" }),
      ];

      mockUserRepository.findMany.mockResolvedValue({
        items: users,
        total: 2,
      });

      const response = await request(app).get("/api/v1/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        totalRecords: 2,
        perPage: 10,
        currentPage: 1,
        recordShown: 2,
      });
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      );
    });
  });

  describe("GET /api/v1/users/:id", () => {
    it("returns a user by id", async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const response = await request(app).get(`/api/v1/users/${user.getId()}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "User retrieved successfully.",
        data: {
          id: user.getId(),
          name: user.getName(),
          email: user.getEmail().getValue(),
          createdAt: user.getCreatedAt().toISOString(),
          updatedAt: user.getUpdatedAt().toISOString(),
        },
      });
    });

    it("returns 404 when the user does not exist", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const response = await request(app).get("/api/v1/users/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      });
    });
  });

  describe("PATCH /api/v1/users/:id", () => {
    it("updates a user", async () => {
      const existingUser = createTestUser();
      const updatedUser = createTestUser({ name: "Updated Name" });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/api/v1/users/${existingUser.getId()}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: "User updated successfully.",
        data: {
          id: updatedUser.getId(),
          name: "Updated Name",
        },
      });
    });

    it("returns validation errors for an empty update body", async () => {
      const response = await request(app)
        .patch("/api/v1/users/550e8400-e29b-41d4-a716-446655440000")
        .send({});

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("DELETE /api/v1/users/:id", () => {
    it("deletes a user", async () => {
      mockUserRepository.delete.mockResolvedValue(true);

      const response = await request(app).delete(
        "/api/v1/users/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "User deleted successfully.",
        data: null,
      });
    });

    it("returns 404 when deleting a missing user", async () => {
      mockUserRepository.delete.mockResolvedValue(false);

      const response = await request(app).delete(
        "/api/v1/users/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      });
    });
  });
});
