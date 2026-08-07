import { LIMITS } from "../shared/constants.js";

const SUPPORTED_RESUME_EXTENSIONS = [".pdf", ".txt", ".md"];

export function isSupportedResumeFile(file) {
  const name = String(file?.name || "").toLowerCase();
  return SUPPORTED_RESUME_EXTENSIONS.some((extension) =>
    name.endsWith(extension),
  );
}

export function normalizeResumeText(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    // Imported files can contain invisible control bytes that should not reach a prompt.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.join("\n").slice(0, LIMITS.SENDER_CONTEXT_CHARACTERS);
}

function base64FromBytes(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let start = 0; start < bytes.length; start += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(start, start + chunkSize));
  }
  return btoa(binary);
}

export async function loadResumeFile(file) {
  if (!isSupportedResumeFile(file))
    throw new Error("Choose a PDF, plain-text, or Markdown resume.");
  if (file.size > LIMITS.RESUME_FILE_BYTES)
    throw new Error("Choose a resume file smaller than 500 KB.");

  const isPdf = String(file.name).toLowerCase().endsWith(".pdf");
  if (isPdf) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return {
      label: `Loaded a ${(file.size / 1024).toFixed(1)} KB PDF locally.`,
      promptText: "A resume PDF is attached as input.",
      attachment: {
        inlineData: {
          mimeType: "application/pdf",
          data: base64FromBytes(bytes),
        },
      },
    };
  }

  const text = normalizeResumeText(await file.text());
  if (text.length < 30)
    throw new Error("That file does not contain enough readable resume text.");
  return {
    label: `Read ${text.length.toLocaleString()} characters locally.`,
    promptText: text,
    attachment: null,
  };
}
