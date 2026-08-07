import { describe, expect, it } from "vitest";
import {
  parseDraftResponse,
  parseSenderProfileResponse,
} from "../../src/shared/json-response.js";

describe("parseDraftResponse", () => {
  it("parses clean and fenced JSON", () => {
    expect(
      parseDraftResponse('{"category":"tech","message":"Hi Sam"}'),
    ).toEqual({ category: "tech", message: "Hi Sam" });
    expect(
      parseDraftResponse(
        '```json\n{"category":"business","message":"Hello"}\n```',
      ).message,
    ).toBe("Hello");
  });

  it("uses a safe category fallback", () => {
    expect(
      parseDraftResponse('{"category":"unknown","message":"Hello"}').category,
    ).toBe("other");
  });

  it("rejects malformed or empty responses", () => {
    expect(() => parseDraftResponse("not json")).toThrow(
      "unexpected response format",
    );
    expect(() => parseDraftResponse('{"message":""}')).toThrow(
      "usable message",
    );
  });
});

describe("parseSenderProfileResponse", () => {
  it("accepts a usable profile response", () => {
    expect(
      parseSenderProfileResponse(
        '{"senderName":"Alex Morgan","senderContext":"Product engineer focused on privacy-conscious developer tools."}',
      ),
    ).toEqual({
      senderName: "Alex Morgan",
      senderContext:
        "Product engineer focused on privacy-conscious developer tools.",
    });
  });

  it("rejects a missing sender profile", () => {
    expect(() => parseSenderProfileResponse('{"senderName":"Alex"}')).toThrow(
      "usable sender profile",
    );
  });
});
