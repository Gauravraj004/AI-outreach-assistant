export const DEFAULT_SETTINGS = Object.freeze({
  apiKey: "",
  modelName: "gemini-3.1-flash-lite",
  senderName: "",
  senderContext: "",
  saveDrafts: false,
});

export const STORAGE_KEYS = Object.freeze({
  SETTINGS: "settings",
  DRAFTS: "drafts",
});

export const LIMITS = Object.freeze({
  PROFILE_CHARACTERS: 12000,
  CONNECTION_CHARACTERS: 280,
  MAX_DRAFTS: 5,
});

export const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
