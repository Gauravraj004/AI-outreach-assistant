import { buildPrompt } from "../prompts/build-prompt.js";
import { buildSenderProfilePrompt } from "../prompts/build-sender-profile-prompt.js";
import { getBrowserApi } from "../services/browser-api.js";
import { generateDraft, GeminiError } from "../services/gemini-client.js";
import { loadResumeFile } from "../services/resume-import.js";
import {
  clearDrafts,
  clearLocalData,
  loadDrafts,
  loadSettings,
  saveDraft,
  saveSettings,
} from "../services/storage.js";
import { DEFAULT_SETTINGS } from "../shared/constants.js";
import {
  parseDraftResponse,
  parseSenderProfileResponse,
} from "../shared/json-response.js";
import {
  isValidGeminiApiKey,
  messageLengthState,
  validateSettings,
} from "../shared/validation.js";

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
  resumeFile: byId("resume-file"),
  resumeImportStatus: byId("resume-import-status"),
  resumeAnalysis: byId("resume-analysis"),
  resumeConsent: byId("resume-consent"),
  analyzeResume: byId("analyze-resume"),
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
  draftHistory: byId("draft-history"),
  draftHistoryList: byId("draft-history-list"),
  clearDraftHistory: byId("clear-draft-history"),
};

const state = {
  settings: { ...DEFAULT_SETTINGS },
  activeTab: null,
  profile: null,
  loading: false,
  resume: null,
};

const objective = () =>
  document.querySelector('input[name="objective"]:checked')?.value ||
  "direct_message";

async function init() {
  bindEvents();
  state.settings = await loadSettings(browserApi.storage.local);
  populateSettingsForm();
  await renderDraftHistory();

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
  ui.resumeFile.addEventListener("change", handleResumeImport);
  ui.apiKey.addEventListener("input", refreshResumeAnalysisState);
  ui.resumeConsent.addEventListener("change", refreshResumeAnalysisState);
  ui.analyzeResume.addEventListener("click", handleResumeAnalysis);
  ui.deleteData.addEventListener("click", handleDeleteData);
  ui.refreshProfile.addEventListener("click", refreshProfile);
  ui.generate.addEventListener("click", handleGenerate);
  ui.regenerate.addEventListener("click", handleGenerate);
  ui.copy.addEventListener("click", copyDraft);
  ui.clearDraftHistory.addEventListener("click", handleClearDraftHistory);
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

async function handleResumeImport(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  hideError();
  try {
    const resume = await loadResumeFile(file);
    state.resume = resume;
    ui.resumeConsent.checked = false;
    ui.resumeAnalysis.classList.remove("hidden");
    ui.resumeImportStatus.textContent = `${resume.label} Create a concise profile with one Gemini request, or paste/edit it manually.`;
    refreshResumeAnalysisState();
  } catch (error) {
    ui.resumeImportStatus.textContent = "";
    showError(error.message);
  } finally {
    ui.resumeFile.value = "";
  }
}

function refreshResumeAnalysisState() {
  ui.analyzeResume.disabled = !(
    state.resume &&
    ui.resumeConsent.checked &&
    isValidGeminiApiKey(ui.apiKey.value)
  );
}

async function handleResumeAnalysis() {
  if (!state.resume || !ui.resumeConsent.checked) return;
  if (!isValidGeminiApiKey(ui.apiKey.value)) {
    showError("Add a valid Gemini API key before creating a sender profile.");
    return;
  }

  hideError();
  ui.analyzeResume.disabled = true;
  ui.analyzeResume.textContent = "Creating profile…";
  try {
    const raw = await generateDraft({
      apiKey: ui.apiKey.value.trim(),
      modelName: ui.modelName.value.trim(),
      prompt: buildSenderProfilePrompt(
        state.resume.promptText,
        Boolean(state.resume.attachment),
      ),
      maxOutputTokens: 1200,
      attachments: state.resume.attachment ? [state.resume.attachment] : [],
    });
    const profile = parseSenderProfileResponse(raw);
    if (!ui.senderName.value.trim() && profile.senderName)
      ui.senderName.value = profile.senderName;
    ui.senderContext.value = profile.senderContext;
    state.resume = null;
    ui.resumeAnalysis.classList.add("hidden");
    ui.resumeImportStatus.textContent =
      "Profile created. Review it, then save settings to keep it on this device.";
  } catch (error) {
    showError(errorMessage(error));
  } finally {
    ui.analyzeResume.textContent = "Create profile (1 request)";
    refreshResumeAnalysisState();
  }
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
  refreshResumeAnalysisState();
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
      await renderDraftHistory();
    }
  } catch (error) {
    showError(errorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function renderDraftHistory() {
  const drafts = await loadDrafts(browserApi.storage.local);
  ui.draftHistoryList.replaceChildren();

  if (!drafts.length) {
    ui.draftHistory.classList.add("hidden");
    return;
  }

  for (const draft of drafts) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const message = String(draft.message || "").trim();
    button.type = "button";
    button.className = "draft-history-item";
    button.textContent = message.slice(0, 110) || "Untitled draft";
    button.title = "Restore this saved draft";
    button.addEventListener("click", () => {
      ui.output.value = message;
      ui.focusBadge.textContent = draft.category || "saved";
      ui.results.classList.remove("hidden");
      updateCharacterCount();
    });
    item.append(button);
    ui.draftHistoryList.append(item);
  }
  ui.draftHistory.classList.remove("hidden");
}

async function handleClearDraftHistory() {
  await clearDrafts(browserApi.storage.local);
  await renderDraftHistory();
  updateStatus("success", "Saved drafts were deleted from this browser.");
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
