import { describe, expect, it } from "vitest";
import { buildPrompt } from "../../src/prompts/build-prompt.js";

const input = {
  settings: {
    senderName: "Alex",
    senderContext:
      "I build reliable data products and want to learn about the team.",
  },
  profile: {
    name: "Sam",
    headline: "Engineering Lead at Example",
    fullText: "Sam builds distributed systems.",
  },
  tone: "conversational",
  length: "standard",
  notes: "Ask about platform reliability.",
};

describe("buildPrompt", () => {
  it("grounds direct messages in sender and recipient context", () => {
    const prompt = buildPrompt({ ...input, objective: "direct_message" });
    expect(prompt).toContain("Alex");
    expect(prompt).toContain("Sam builds distributed systems.");
    expect(prompt).toContain("Never invent");
    expect(prompt).toContain("100 to 150 words");
  });

  it("enforces the 280-character connection limit", () => {
    const prompt = buildPrompt({ ...input, objective: "connection" });
    expect(prompt).toContain("280 characters or fewer");
  });

  it("supports concise messages and missing optional recipient data", () => {
    const prompt = buildPrompt({
      ...input,
      profile: { fullText: "Relevant context" },
      objective: "direct_message",
      length: "concise",
      notes: "",
    });
    expect(prompt).toContain("70 to 100 words");
    expect(prompt).toContain("Name: Unknown");
    expect(prompt).toContain("Additional context: None");
  });
});
