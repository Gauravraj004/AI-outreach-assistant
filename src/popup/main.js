import { buildPrompt } from "../prompts/build-prompt.js";
import { getBrowserApi } from "../services/browser-api.js";
import { generateDraft, GeminiError } from "../services/gemini-client.js";
import {
  clearLocalData,
  loadSettings,
  saveDraft,
  saveSettings,
} from "../services/storage.js";
import { DEFAULT_SETTINGS } from "../shared/constants.js";
import { parseDraftResponse } from "../shared/json-response.js";
import { messageLengthState, validateSettings } from "../shared/validation.js";

const byId = (id) => document.getElementById(id);
const browserApi = getBrowserApi();

const ui = {
  settingsToggle: byId("settings-toggle"),
  settingsPanel: byId("settings-panel"),
  toggleKey: byId("toggle-key"),
  apiKey: byId("api-key"),
  modelName: byId("model-name"),
  senderName: byId("sender-name"),
  senderContext: byId("sender-context"),
  saveDrafts: byId("save-drafts"),
  saveSettings: byId("save-settings"),
  deleteData: byId("delete-data"),
  statusBar: byId("status-bar"),
  statusText: byId("status-text"),
  profilePreview: byId("profile-preview"),
  profileName: byId("profile-name"),
  profileHeadline: byId("profile-headline"),
  profileSummary: byId("profile-summary"),
  refreshProfile: byId("refresh-profile"),
  tone: byId("tone"),
  length: byId("length"),
  customNotes: byId("custom-notes"),
  consent: byId("consent"),
  generate: byId("generate-btn"),
  error: byId("error-message"),
  results: byId("results-panel"),
  focusBadge: byId("focus-badge"),
  charCounter: byId("char-counter"),
  output: byId("output-text"),
  regenerate: byId("regenerate-btn"),
  copy: byId("copy-btn"),
};

const state = {
  settings: { ...DEFAULT_SETTINGS },
  activeTab: null,
  profile: null,
  loading: false,
};

const objective = () =>
  document.querySelector('input[name="objective"]:checked')?.value ||
  "direct_message";

async function init() {
  bindEvents();
  state.settings = await loadSettings(browserApi.storage.local);
  populateSettingsForm();

  const [tab] = await browserApi.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  state.activeTab = tab || null;
  if (isLinkedInProfile(tab?.url)) await refreshProfile();
  else updateStatus("neutral", "Open a LinkedIn member profile to begin.");

  if (!validateSettings(state.settings).valid) setSettingsOpen(true);
  refreshGenerateState();
}

function bindEvents() {
  ui.settingsToggle.addEventListener("click", () =>
    setSettingsOpen(ui.settingsPanel.classList.contains("hidden")),
  );
  ui.toggleKey.addEventListener("click", toggleKeyVisibility);
  ui.saveSettings.addEventListener("click", handleSaveSettings);
  ui.deleteData.addEventListener("click", handleDeleteData);
  ui.refreshProfile.addEventListener("click", refreshProfile);
  ui.generate.addEventListener("click", handleGenerate);
  ui.regenerate.addEventListener("click", handleGenerate);
  ui.copy.addEventListener("click", copyDraft);
  ui.consent.addEventListener("change", refreshGenerateState);
  ui.output.addEventListener("input", updateCharacterCount);
  document.querySelectorAll('input[name="objective"]').forEach((input) => {
    input.addEventListener("change", () => {
      ui.length.disabled = objective() === "connection";
      ui.results.classList.add("hidden");
      updateCharacterCount();
    });
  });
}

function isLinkedInProfile(url = "") {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith("linkedin.com") &&
      parsed.pathname.startsWith("/in/")
    );
  } catch {
    return false;
  }
}

function populateSettingsForm() {
  ui.apiKey.value = state.settings.apiKey;
  ui.modelName.value = state.settings.modelName;
  ui.senderName.value = state.settings.senderName;
  ui.senderContext.value = state.settings.senderContext;
  ui.saveDrafts.checked = state.settings.saveDrafts;
}

function settingsFromForm() {
  return {
    apiKey: ui.apiKey.value,
    modelName: ui.modelName.value,
    senderName: ui.senderName.value,
    senderContext: ui.senderContext.value,
    saveDrafts: ui.saveDrafts.checked,
  };
}

async function handleSaveSettings() {
  hideError();
  const result = validateSettings(settingsFromForm());
  if (!result.valid) {
    showError(Object.values(result.errors)[0]);
    return;
  }
  await saveSettings(result.settings, browserApi.storage.local);
  state.settings = result.settings;
  ui.saveSettings.textContent = "Saved";
  setTimeout(() => {
    ui.saveSettings.textContent = "Save settings";
  }, 1000);
  refreshGenerateState();
}

async function handleDeleteData() {
  const approved = window.confirm(
    "Delete the API key, sender profile, settings, and saved drafts from this browser?",
  );
  if (!approved) return;
  await clearLocalData(browserApi.storage.local);
  state.settings = { ...DEFAULT_SETTINGS };
  populateSettingsForm();
  ui.consent.checked = false;
  ui.output.value = "";
  ui.results.classList.add("hidden");
  showError("Local extension data was deleted.");
  setSettingsOpen(true);
  refreshGenerateState();
}

function toggleKeyVisibility() {
  const visible = ui.apiKey.type === "text";
  ui.apiKey.type = visible ? "password" : "text";
  ui.toggleKey.textContent = visible ? "Show" : "Hide";
}

function setSettingsOpen(open) {
  ui.settingsPanel.classList.toggle("hidden", !open);
  ui.settingsToggle.setAttribute("aria-expanded", String(open));
}

async function refreshProfile() {
  hideError();
  updateStatus("neutral", "Reading visible profile details…");
  try {
    const response = await requestProfile();
    if (!response?.success)
      throw new Error(response?.error || "The profile could not be read.");
    state.profile = response.data;
    renderProfile();
    updateStatus(
      "success",
      "Profile preview ready. Nothing has been sent to Gemini.",
    );
  } catch (error) {
    state.profile = null;
    ui.profilePreview.classList.add("hidden");
    updateStatus("warning", "Refresh the LinkedIn profile, then try again.");
    showError(error.message);
  }
  refreshGenerateState();
}

async function requestProfile() {
  if (!state.activeTab?.id) throw new Error("No active browser tab was found.");
  try {
    return await browserApi.tabs.sendMessage(state.activeTab.id, {
      action: "extractProfile",
    });
  } catch {
    await browserApi.scripting.executeScript({
      target: { tabId: state.activeTab.id },
      files: ["content.js"],
    });
    return browserApi.tabs.sendMessage(state.activeTab.id, {
      action: "extractProfile",
    });
  }
}

function renderProfile() {
  ui.profileName.textContent = state.profile.name || "Name not detected";
  ui.profileHeadline.textContent =
    state.profile.headline || "Headline not detected";
  ui.profileSummary.textContent = `${state.profile.extractedCharacters.toLocaleString()} characters will be included in the request.`;
  ui.profilePreview.classList.remove("hidden");
}

async function handleGenerate() {
  hideError();
  if (!state.profile || !ui.consent.checked) return;

  const validated = validateSettings(state.settings);
  if (!validated.valid) {
    setSettingsOpen(true);
    showError("Complete and save the local settings first.");
    return;
  }

  setLoading(true);
  try {
    const currentObjective = objective();
    const prompt = buildPrompt({
      settings: state.settings,
      profile: state.profile,
      objective: currentObjective,
      tone: ui.tone.value,
      length: ui.length.value,
      notes: ui.customNotes.value.trim(),
    });
    const raw = await generateDraft({
      apiKey: state.settings.apiKey,
      modelName: state.settings.modelName,
      prompt,
      maxOutputTokens: currentObjective === "connection" ? 180 : 700,
    });
    const draft = parseDraftResponse(raw);
    renderDraft(draft);
    if (state.settings.saveDrafts) {
      await saveDraft(
        {
          message: draft.message,
          category: draft.category,
          objective: currentObjective,
        },
        browserApi.storage.local,
      );
    }
  } catch (error) {
    showError(errorMessage(error));
  } finally {
    setLoading(false);
  }
}

function renderDraft(draft) {
  ui.output.value = draft.message;
  ui.focusBadge.textContent = draft.category;
  ui.results.classList.remove("hidden");
  updateCharacterCount();
}

function errorMessage(error) {
  if (!(error instanceof GeminiError))
    return error.message || "The draft could not be generated.";
  if (error.code === "auth")
    return "Gemini rejected the API key. Check or replace it in Settings.";
  if (error.code === "quota")
    return "The Gemini quota is currently exhausted. Try later or use another dedicated key.";
  return error.message;
}

function refreshGenerateState() {
  const ready =
    validateSettings(state.settings).valid &&
    Boolean(state.profile) &&
    ui.consent.checked &&
    !state.loading;
  ui.generate.disabled = !ready;
}

function setLoading(loading) {
  state.loading = loading;
  ui.generate.querySelector(".button-label").textContent = loading
    ? "Generating…"
    : "Generate draft";
  ui.generate.querySelector(".spinner").classList.toggle("hidden", !loading);
  ui.regenerate.disabled = loading;
  refreshGenerateState();
}

function updateCharacterCount() {
  const info = messageLengthState(ui.output.value, objective());
  ui.charCounter.textContent = info.limit
    ? `${info.length}/${info.limit} chars`
    : `${info.length} chars`;
  ui.charCounter.classList.toggle("over-limit", info.overLimit);
  ui.copy.disabled = info.overLimit;
  ui.copy.title = info.overLimit
    ? "Shorten the connection note before copying."
    : "Copy the reviewed draft";
}

async function copyDraft() {
  if (!ui.output.value) return;
  try {
    await navigator.clipboard.writeText(ui.output.value);
    ui.copy.textContent = "Copied";
    setTimeout(() => {
      ui.copy.textContent = "Copy draft";
    }, 1000);
  } catch {
    showError("Clipboard access failed. Select and copy the draft manually.");
  }
}

function updateStatus(type, message) {
  ui.statusBar.className = `status ${type}`;
  ui.statusText.textContent = message;
}

function showError(message) {
  ui.error.textContent = message;
  ui.error.classList.remove("hidden");
}

function hideError() {
  ui.error.textContent = "";
  ui.error.classList.add("hidden");
}

init().catch((error) =>
  showError(error.message || "The extension could not start."),
);
