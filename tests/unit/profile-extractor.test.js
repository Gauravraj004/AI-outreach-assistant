import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractProfileData,
  normalizeVisibleText,
} from "../../src/content/profile-extractor.js";

describe("profile extraction", () => {
  it("extracts identity and deduplicated visible context from a fixture", () => {
    document.body.innerHTML = readFileSync(
      resolve("tests/fixtures/profile.html"),
      "utf8",
    );
    const profile = extractProfileData(document);
    expect(profile.name).toBe("Sam Rivera");
    expect(profile.headline).toContain("Engineering Lead");
    expect(profile.fullText).not.toContain("People you may know");
    expect(profile.fullText.match(/Building reliable/g)).toHaveLength(1);
  });

  it("normalizes repeated and noisy lines", () => {
    expect(normalizeVisibleText("Hello\nHello\nMessaging\nWorld")).toBe(
      "Hello\nWorld",
    );
  });

  it("fails clearly when the main profile region is unavailable", () => {
    document.body.innerHTML = "<h1>Loading</h1>";
    expect(() => extractProfileData(document)).toThrow("main LinkedIn profile");
  });

  it("fails when a nearly empty profile has no detected name", () => {
    document.body.innerHTML = "<main><p>Loading</p></main>";
    expect(() => extractProfileData(document)).toThrow("not finished loading");
  });
});
