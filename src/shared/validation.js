import { DEFAULT_SETTINGS, LIMITS } from "./constants.js";

export function isValidGeminiApiKey(apiKey) {
  return /^AIza[\w-]{20,}$/.test(String(apiKey || "").trim());
}

export function normalizeSettings(value = {}) {
  return {
    ...DEFAULT_SETTINGS,
    apiKey: String(value.apiKey || "").trim(),
    modelName: String(value.modelName || DEFAULT_SETTINGS.modelName).trim(),
    senderName: String(value.senderName || "").trim(),
    senderContext: String(value.senderContext || "")
      .trim()
      .slice(0, LIMITS.SENDER_CONTEXT_CHARACTERS),
    saveDrafts: value.saveDrafts === true,
  };
}

export function validateSettings(value) {
  const settings = normalizeSettings(value);
  const errors = {};

  if (!isValidGeminiApiKey(settings.apiKey))
    errors.apiKey = "Enter a valid Gemini API key.";
  if (!/^[\w.-]+$/.test(settings.modelName))
    errors.modelName = "Choose a valid Gemini model.";
  if (settings.senderName.length < 2) errors.senderName = "Enter your name.";
  if (settings.senderContext.length < 30)
    errors.senderContext =
      "Add at least 30 characters of truthful background and goals.";

  return { valid: Object.keys(errors).length === 0, errors, settings };
}

export function messageLengthState(message, objective) {
  const length = message.length;
  return {
    length,
    overLimit:
      objective === "connection" && length > LIMITS.CONNECTION_CHARACTERS,
    limit: objective === "connection" ? LIMITS.CONNECTION_CHARACTERS : null,
  };
}

export function draftWarnings(message, recipientName = "") {
  const value = String(message || "");
  const warnings = [];
  if (/\[.+?\]|\{\{.+?\}\}|<.+?>/.test(value))
    warnings.push("Replace any remaining placeholders before copying.");
  if (
    recipientName &&
    !value.toLowerCase().includes(recipientName.toLowerCase())
  )
    warnings.push("Check that the draft addresses the intended recipient.");
  if (/\b(?:guarantee|guaranteed|best|perfect)\b/i.test(value))
    warnings.push(
      "Review strong claims to ensure they are truthful and specific.",
    );
  return warnings;
}

export function truncateProfile(text) {
  return String(text || "").slice(0, LIMITS.PROFILE_CHARACTERS);
}
