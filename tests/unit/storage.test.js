import { describe, expect, it } from "vitest";
import {
  clearDrafts,
  clearLocalData,
  loadDrafts,
  loadSettings,
  saveDraft,
  saveSettings,
} from "../../src/services/storage.js";

function memoryStorage(initial = {}) {
  const state = { ...initial };
  return {
    state,
    async get(key) {
      if (Array.isArray(key))
        return Object.fromEntries(key.map((item) => [item, state[item]]));
      return { [key]: state[key] };
    },
    async set(value) {
      Object.assign(state, value);
    },
    async remove(keys) {
      for (const key of keys) delete state[key];
    },
  };
}

describe("local storage service", () => {
  it("round-trips settings", async () => {
    const storage = memoryStorage();
    await saveSettings({ senderName: "Alex" }, storage);
    expect((await loadSettings(storage)).senderName).toBe("Alex");
  });

  it("retains only five recent drafts", async () => {
    const storage = memoryStorage();
    for (let index = 0; index < 7; index += 1)
      await saveDraft({ message: String(index) }, storage);
    expect(storage.state.drafts).toHaveLength(5);
    expect(storage.state.drafts[0].message).toBe("6");
    expect((await loadDrafts(storage))[0].message).toBe("6");
  });

  it("loads and clears saved drafts without deleting settings", async () => {
    const storage = memoryStorage({
      settings: { senderName: "Alex" },
      drafts: [{ message: "A saved draft" }],
    });
    expect(await loadDrafts(storage)).toEqual([{ message: "A saved draft" }]);
    await clearDrafts(storage);
    expect(storage.state).toEqual({ settings: { senderName: "Alex" } });
  });

  it("clears settings and drafts", async () => {
    const storage = memoryStorage({ settings: {}, drafts: [] });
    await clearLocalData(storage);
    expect(storage.state).toEqual({});
  });
});
