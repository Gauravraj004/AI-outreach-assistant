import { DEFAULT_SETTINGS, LIMITS, STORAGE_KEYS } from "../shared/constants.js";
import { normalizeSettings } from "../shared/validation.js";

export async function loadSettings(storage = chrome.storage.local) {
  const result = await storage.get(STORAGE_KEYS.SETTINGS);
  return normalizeSettings(result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS);
}

export async function saveSettings(settings, storage = chrome.storage.local) {
  await storage.set({ [STORAGE_KEYS.SETTINGS]: normalizeSettings(settings) });
}

export async function clearLocalData(storage = chrome.storage.local) {
  await storage.remove([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.DRAFTS]);
}

export async function saveDraft(draft, storage = chrome.storage.local) {
  const result = await storage.get(STORAGE_KEYS.DRAFTS);
  const drafts = Array.isArray(result[STORAGE_KEYS.DRAFTS])
    ? result[STORAGE_KEYS.DRAFTS]
    : [];
  const next = [
    { ...draft, createdAt: new Date().toISOString() },
    ...drafts,
  ].slice(0, LIMITS.MAX_DRAFTS);
  await storage.set({ [STORAGE_KEYS.DRAFTS]: next });
  return next;
}
