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

export async function loadDrafts(storage = chrome.storage.local) {
  const result = await storage.get(STORAGE_KEYS.DRAFTS);
  return Array.isArray(result[STORAGE_KEYS.DRAFTS])
    ? result[STORAGE_KEYS.DRAFTS]
    : [];
}

export async function clearDrafts(storage = chrome.storage.local) {
  await storage.remove([STORAGE_KEYS.DRAFTS]);
}

export async function exportLocalData(storage = chrome.storage.local) {
  const settings = await loadSettings(storage);
  const drafts = await loadDrafts(storage);
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings: { ...settings, apiKey: undefined },
    drafts,
  };
}

export async function saveDraft(draft, storage = chrome.storage.local) {
  const drafts = await loadDrafts(storage);
  const next = [
    { ...draft, createdAt: new Date().toISOString() },
    ...drafts,
  ].slice(0, LIMITS.MAX_DRAFTS);
  await storage.set({ [STORAGE_KEYS.DRAFTS]: next });
  return next;
}
