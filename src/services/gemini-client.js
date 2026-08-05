import { GEMINI_ENDPOINT } from "../shared/constants.js";

export class GeminiError extends Error {
  constructor(message, code = "unknown") {
    super(message);
    this.name = "GeminiError";
    this.code = code;
  }
}

export async function generateDraft({
  apiKey,
  modelName,
  prompt,
  maxOutputTokens,
  fetchImpl = fetch,
  timeoutMs = 25000,
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(
      `${GEMINI_ENDPOINT}/${encodeURIComponent(modelName)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code =
        response.status === 429
          ? "quota"
          : response.status === 401 || response.status === 403
            ? "auth"
            : "api";
      throw new GeminiError(
        payload?.error?.message ||
          `Gemini request failed (${response.status}).`,
        code,
      );
    }

    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const text =
      parts.find((part) => part.text && !part.thought)?.text ||
      parts.find((part) => part.text)?.text;
    if (!text)
      throw new GeminiError("Gemini returned an empty response.", "empty");
    return text.trim();
  } catch (error) {
    if (error.name === "AbortError")
      throw new GeminiError(
        "The Gemini request timed out. Please try again.",
        "timeout",
      );
    if (error instanceof GeminiError) throw error;
    throw new GeminiError(
      "The request could not reach Gemini. Check your connection and try again.",
      "network",
    );
  } finally {
    clearTimeout(timeout);
  }
}
