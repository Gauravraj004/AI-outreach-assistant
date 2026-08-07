export function parseDraftResponse(rawResponse) {
  const cleaned = String(rawResponse || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned an unexpected response format.");
  }

  if (typeof parsed.message !== "string" || !parsed.message.trim()) {
    throw new Error("Gemini did not return a usable message.");
  }

  const allowedCategories = new Set([
    "tech",
    "business",
    "recruiting",
    "other",
  ]);
  return {
    message: parsed.message.trim(),
    category: allowedCategories.has(parsed.category)
      ? parsed.category
      : "other",
  };
}

export function parseSenderProfileResponse(rawResponse) {
  const cleaned = String(rawResponse || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned an unexpected profile format.");
  }

  const senderContext = String(parsed.senderContext || "").trim();
  if (senderContext.length < 30)
    throw new Error("Gemini did not return a usable sender profile.");

  return {
    senderName: String(parsed.senderName || "")
      .trim()
      .slice(0, 80),
    senderContext: senderContext.slice(0, 6000),
  };
}
