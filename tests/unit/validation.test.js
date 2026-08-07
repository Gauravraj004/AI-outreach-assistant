import { describe, expect, it } from "vitest";
import {
  isValidGeminiApiKey,
  messageLengthState,
  normalizeSettings,
  truncateProfile,
  validateSettings,
} from "../../src/shared/validation.js";

describe("settings validation", () => {
  it("recognizes Gemini API-key syntax", () => {
    expect(isValidGeminiApiKey(`AIza${"a".repeat(32)}`)).toBe(true);
    expect(isValidGeminiApiKey("not-a-key")).toBe(false);
  });

  it("accepts a complete BYOK configuration", () => {
    const result = validateSettings({
      apiKey: `AIza${"a".repeat(32)}`,
      modelName: "gemini-3.1-flash-lite",
      senderName: "Alex Morgan",
      senderContext:
        "Backend engineer seeking thoughtful technical collaborations.",
      saveDrafts: true,
    });
    expect(result.valid).toBe(true);
    expect(result.settings.saveDrafts).toBe(true);
  });

  it("rejects incomplete settings", () => {
    const result = validateSettings({
      apiKey: "bad",
      modelName: "invalid model name",
      senderName: "",
      senderContext: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.apiKey).toBeTruthy();
    expect(result.errors.senderContext).toBeTruthy();
    expect(result.errors.modelName).toBeTruthy();
  });

  it("normalizes optional values safely", () => {
    expect(normalizeSettings({ senderName: "  Alex  " }).senderName).toBe(
      "Alex",
    );
  });
});

describe("message and profile limits", () => {
  it("flags an oversized connection note", () => {
    expect(messageLengthState("x".repeat(281), "connection").overLimit).toBe(
      true,
    );
  });

  it("truncates oversized profile context", () => {
    expect(truncateProfile("x".repeat(13000))).toHaveLength(12000);
  });
});
