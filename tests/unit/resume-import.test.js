import { describe, expect, it } from "vitest";
import {
  isSupportedResumeFile,
  normalizeResumeText,
  loadResumeFile,
} from "../../src/services/resume-import.js";

function resumeFile({
  name = "resume.md",
  size = 40,
  text = async () => "Alex Morgan\nProduct engineer seeking thoughtful roles.",
} = {}) {
  return { name, size, text };
}

describe("resume import", () => {
  it("accepts PDF, plaintext, and Markdown resume files", () => {
    expect(isSupportedResumeFile(resumeFile({ name: "resume.txt" }))).toBe(
      true,
    );
    expect(isSupportedResumeFile(resumeFile({ name: "resume.md" }))).toBe(true);
    expect(isSupportedResumeFile(resumeFile({ name: "resume.pdf" }))).toBe(
      true,
    );
    expect(isSupportedResumeFile(resumeFile({ name: "resume.docx" }))).toBe(
      false,
    );
  });

  it("cleans imported text and respects the sender-context limit", () => {
    expect(normalizeResumeText(" Alex \r\n\n Engineer ")).toBe(
      "Alex\nEngineer",
    );
    expect(normalizeResumeText("x".repeat(7000))).toHaveLength(6000);
  });

  it("reads a safe, supported text resume file", async () => {
    await expect(loadResumeFile(resumeFile())).resolves.toMatchObject({
      promptText: expect.stringContaining("Alex Morgan"),
      attachment: null,
    });
  });

  it("keeps a PDF in memory as a Gemini document attachment", async () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    const result = await loadResumeFile({
      name: "resume.pdf",
      size: bytes.length,
      async arrayBuffer() {
        return bytes.buffer;
      },
    });
    expect(result.attachment).toEqual({
      inlineData: { mimeType: "application/pdf", data: "JVBERg==" },
    });
  });

  it("rejects unsupported, oversized, and empty resume files", async () => {
    await expect(
      loadResumeFile(resumeFile({ name: "resume.docx" })),
    ).rejects.toThrow("PDF, plain-text, or Markdown");
    await expect(loadResumeFile(resumeFile({ size: 500001 }))).rejects.toThrow(
      "500 KB",
    );
    await expect(
      loadResumeFile(resumeFile({ text: async () => "too short" })),
    ).rejects.toThrow("enough readable");
  });
});
