import { describe, expect, it, vi } from "vitest";
import {
  generateDraft,
  GeminiError,
} from "../../src/services/gemini-client.js";

describe("generateDraft", () => {
  it("uses an API-key header and returns generated JSON text", async () => {
    const fetchImpl = vi.fn(async (_url, options) => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: '{"message":"Hi","category":"tech"}' }],
            },
          },
        ],
      }),
      options,
    }));
    const result = await generateDraft({
      apiKey: "secret",
      modelName: "gemini-test",
      prompt: "prompt",
      maxOutputTokens: 100,
      fetchImpl,
    });
    expect(result).toContain("Hi");
    expect(fetchImpl.mock.calls[0][1].headers["x-goog-api-key"]).toBe("secret");
    expect(fetchImpl.mock.calls[0][0]).not.toContain("secret");
  });

  it("classifies quota failures", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "Quota exceeded" } }),
    }));
    await expect(
      generateDraft({
        apiKey: "secret",
        modelName: "model",
        prompt: "prompt",
        maxOutputTokens: 100,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "quota" });
  });

  it("returns a typed empty-response error", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    await expect(
      generateDraft({
        apiKey: "secret",
        modelName: "model",
        prompt: "prompt",
        maxOutputTokens: 100,
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(GeminiError);
  });

  it("classifies authentication and general API failures", async () => {
    const authFetch = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: "Denied" } }),
    }));
    await expect(
      generateDraft({
        apiKey: "secret",
        modelName: "model",
        prompt: "prompt",
        maxOutputTokens: 100,
        fetchImpl: authFetch,
      }),
    ).rejects.toMatchObject({ code: "auth" });

    const apiFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid JSON");
      },
    }));
    await expect(
      generateDraft({
        apiKey: "secret",
        modelName: "model",
        prompt: "prompt",
        maxOutputTokens: 100,
        fetchImpl: apiFetch,
      }),
    ).rejects.toMatchObject({ code: "api" });
  });

  it("classifies network failures", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("offline");
    });
    await expect(
      generateDraft({
        apiKey: "secret",
        modelName: "model",
        prompt: "prompt",
        maxOutputTokens: 100,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "network" });
  });
});
