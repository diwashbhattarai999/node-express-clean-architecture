import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockObjectStorage = {
  putObject: vi.fn(),
  getObject: vi.fn(),
  deleteObject: vi.fn(),
  exists: vi.fn(),
  getSignedUrl: vi.fn(),
  getPublicUrl: vi.fn(),
};

vi.mock("@/infrastructure/storage", () => ({
  createObjectStorage: vi.fn(() => mockObjectStorage),
}));

const { createApp } = await import("@/app/create-app");

describe("Uploads API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockObjectStorage.putObject.mockImplementation(async ({ key }: { key: string }) => ({ key }));
    mockObjectStorage.getPublicUrl.mockReturnValue(null);
    mockObjectStorage.getSignedUrl.mockRejectedValue(new Error("no signed url"));
    mockObjectStorage.exists.mockResolvedValue(true);
    mockObjectStorage.deleteObject.mockResolvedValue(undefined);
  });

  describe("POST /api/v1/uploads", () => {
    it("uploads a file via multipart and returns metadata", async () => {
      const response = await request(app)
        .post("/api/v1/uploads")
        .attach("file", Buffer.from("fake-png"), {
          filename: "photo.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: "File uploaded.",
        data: {
          contentType: "image/png",
          size: 8,
          publicUrl: null,
          signedUrl: null,
        },
      });
      expect(response.body.data.key).toMatch(/^uploads\/[0-9a-f-]{36}-photo\.png$/);
      expect(mockObjectStorage.putObject).toHaveBeenCalledOnce();
    });

    it("rejects disallowed MIME types", async () => {
      const response = await request(app)
        .post("/api/v1/uploads")
        .attach("file", Buffer.from("hello"), {
          filename: "note.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      });
      expect(mockObjectStorage.putObject).not.toHaveBeenCalled();
    });

    it("rejects requests without a file", async () => {
      const response = await request(app).post("/api/v1/uploads");

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("GET /api/v1/uploads/:key", () => {
    it("returns file metadata for an encoded key", async () => {
      mockObjectStorage.exists.mockResolvedValue(true);
      mockObjectStorage.getPublicUrl.mockReturnValue(null);
      mockObjectStorage.getSignedUrl.mockRejectedValue(new Error("no signed url"));

      const key = encodeURIComponent("uploads/abc-photo.png");
      const response = await request(app).get(`/api/v1/uploads/${key}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "File metadata retrieved.",
        data: {
          key: "uploads/abc-photo.png",
          exists: true,
          publicUrl: null,
          signedUrl: null,
        },
      });
    });
  });

  describe("DELETE /api/v1/uploads/:key", () => {
    it("deletes an existing file", async () => {
      mockObjectStorage.exists.mockResolvedValue(true);

      const key = encodeURIComponent("uploads/abc-photo.png");
      const response = await request(app).delete(`/api/v1/uploads/${key}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "File deleted.",
        data: null,
      });
      expect(mockObjectStorage.deleteObject).toHaveBeenCalledWith("uploads/abc-photo.png");
    });

    it("returns 404 when the file does not exist", async () => {
      mockObjectStorage.exists.mockResolvedValue(false);

      const key = encodeURIComponent("uploads/missing.png");
      const response = await request(app).delete(`/api/v1/uploads/${key}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      });
    });
  });
});
