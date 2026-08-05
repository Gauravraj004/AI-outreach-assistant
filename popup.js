/**
 * AI Outreach Assistant
 * User settings stay in chrome.storage.local. Profile text is sent to Gemini
 * only after the user explicitly clicks Generate.
 */

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    statusBar: document.getElementById('status-bar'),
    statusText: document.getElementById('status-text'),
    settingsToggle: document.getElementById('settings-toggle'),
    settingsPane: document.getElementById('settings-pane'),
    apiKey: document.getElementById('api-key'),
    modelName: document.getElementById('model-name'),
    senderName: document.getElementById('sender-name'),
    senderContext: document.getElementById('sender-context'),
    saveSettings: document.getElementById('save-settings'),
    customNotes: document.getElementById('custom-notes'),
    generateBtn: document.getElementById('generate-btn'),
    errorBox: document.getElementById('error-message'),
    resultsPanel: document.getElementById('results-panel'),
    techBadge: document.getElementById('tech-badge'),
    badgeText: document.getElementById('badge-text'),
    outputText: document.getElementById('output-text'),
    charCounter: document.getElementById('char-counter'),
    copyBtn: document.getElementById('copy-btn')
  };

  let activeTab = null;
  let settings = null;
  let isProfilePage = false;

  const objective = () => document.querySelector('input[name="objective"]:checked')?.value || 'direct_message';

  init();

  async function init() {
    settings = await chrome.storage.local.get(['apiKey', 'modelName', 'senderName', 'senderContext']);
    elements.apiKey.value = settings.apiKey || '';
    elements.modelName.value = settings.modelName || 'gemini-3.1-flash-lite';
    elements.senderName.value = settings.senderName || '';
    elements.senderContext.value = settings.senderContext || '';

    elements.settingsToggle.addEventListener('click', toggleSettings);
    elements.saveSettings.addEventListener('click', saveSettings);
    elements.generateBtn.addEventListener('click', generateOutreach);
    elements.copyBtn.addEventListener('click', copyMessage);
    elements.outputText.addEventListener('input', updateCharacterCount);
    document.querySelectorAll('input[name="objective"]').forEach((input) => {
      input.addEventListener('change', () => {
        clearResults();
        updateCharacterCount();
      });
    });

    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    activeTab = tabs[0] || null;
    isProfilePage = Boolean(activeTab?.url?.includes('linkedin.com/in/'));
    refreshStatus();

    if (!hasRequiredSettings()) {
      elements.settingsPane.classList.remove('hidden');
    }
  }

  function hasRequiredSettings() {
    return Boolean(settings?.apiKey && settings?.senderName && settings?.senderContext);
  }

  function toggleSettings() {
    elements.settingsPane.classList.toggle('hidden');
  }

  async function saveSettings() {
    const nextSettings = {
      apiKey: elements.apiKey.value.trim(),
      modelName: elements.modelName.value.trim() || 'gemini-3.1-flash-lite',
      senderName: elements.senderName.value.trim(),
      senderContext: elements.senderContext.value.trim()
    };

    if (!nextSettings.apiKey || !nextSettings.senderName || !nextSettings.senderContext) {
      showError('Add an API key, your name, and your background before saving.');
      return;
    }

    await chrome.storage.local.set(nextSettings);
    settings = nextSettings;
    hideError();
    elements.saveSettings.textContent = 'Saved';
    setTimeout(() => { elements.saveSettings.textContent = 'Save settings'; }, 1200);
    refreshStatus();
  }

  function refreshStatus() {
    if (!hasRequiredSettings()) {
      updateStatus('warning', 'Add your local settings to begin');
    } else if (!isProfilePage) {
      updateStatus('neutral', 'Open a LinkedIn member profile');
    } else {
      updateStatus('success', 'Profile ready · review before sending');
    }
    elements.generateBtn.disabled = !(hasRequiredSettings() && isProfilePage);
  }

  function updateStatus(type, message) {
    elements.statusBar.className = `status-bar ${type}`;
    elements.statusText.textContent = message;
  }

  async function generateOutreach() {
    hideError();
    clearResults();
    setLoading(true);

    try {
      const response = await extractProfile();
      if (!response?.success) {
        throw new Error(response?.error || 'Could not read this profile. Refresh the page and try again.');
      }
      const result = await callGemini(response.data);
      displayResult(result);
    } catch (error) {
      showError(error.message || 'Could not generate a draft.');
    } finally {
      setLoading(false);
    }
  }

  async function extractProfile() {
    try {
      return await chrome.tabs.sendMessage(activeTab.id, { action: 'extractProfile' });
    } catch (_error) {
      await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['content.js'] });
      return chrome.tabs.sendMessage(activeTab.id, { action: 'extractProfile' });
    }
  }

  async function callGemini(profile) {
    const connectionMode = objective() === 'connection';
    const lengthInstruction = connectionMode
      ? 'Write 2 short sentences and keep the entire note strictly under 280 characters.'
      : 'Write 3 short paragraphs and keep the message between 100 and 150 words.';

    const prompt = `
You are an outreach writing assistant. Draft a specific, truthful, conversational LinkedIn message.

Sender name: ${settings.senderName}
Sender background and goal:
${settings.senderContext}

Recipient name: ${profile.name || 'Unknown'}
Recipient headline: ${profile.headline || 'Unknown'}
Recipient profile text:
${(profile.fullText || '').slice(0, 12000)}

User's optional instructions:
${elements.customNotes.value.trim() || 'None'}

Rules:
- Use only facts supplied above. Never invent shared history, company details, achievements, or job openings.
- Personalize the opening with one concrete recipient detail when available.
- Make the sender's reason for reaching out clear.
- Avoid corporate filler, pressure, and exaggerated claims.
- Do not use em dashes.
- ${lengthInstruction}
- End with a natural sign-off using the sender's name.
- Return JSON only with this exact shape:
  {"isTechOrAIFocus": true, "message": "Complete message"}
Set isTechOrAIFocus based on the recipient's work, not the sender's background.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.modelName)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: connectionMode ? 160 : 700,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error?.message || `Gemini request failed (${response.status}).`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.find((part) => part.text && !part.thought)?.text
        || data?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
      if (!text) throw new Error('Gemini returned an empty response.');
      return text.trim();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The Gemini request timed out.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function displayResult(rawResponse) {
    const cleaned = rawResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_error) {
      throw new Error('Gemini returned an unexpected response format. Try again.');
    }

    if (typeof parsed.message !== 'string' || !parsed.message.trim()) {
      throw new Error('Gemini did not return a usable message.');
    }

    elements.outputText.value = parsed.message.trim();
    elements.resultsPanel.classList.remove('hidden');
    elements.techBadge.classList.remove('hidden', 'valid', 'invalid');
    elements.techBadge.classList.add(parsed.isTechOrAIFocus === true ? 'valid' : 'invalid');
    elements.badgeText.textContent = parsed.isTechOrAIFocus === true ? 'Tech/AI focus' : 'Other focus';
    updateCharacterCount();
  }

  function updateCharacterCount() {
    const length = elements.outputText.value.length;
    elements.charCounter.textContent = `${length} chars`;
    elements.charCounter.classList.toggle('limit-exceeded', objective() === 'connection' && length > 300);
  }

  async function copyMessage() {
    if (!elements.outputText.value) return;
    await navigator.clipboard.writeText(elements.outputText.value);
    elements.copyBtn.textContent = 'Copied';
    setTimeout(() => { elements.copyBtn.textContent = 'Copy message'; }, 1200);
  }

  function setLoading(loading) {
    elements.generateBtn.disabled = loading;
    elements.generateBtn.querySelector('.btn-text').textContent = loading ? 'Analyzing profile...' : 'Generate outreach draft';
    elements.generateBtn.querySelector('.loader').classList.toggle('hidden', !loading);
    if (!loading) refreshStatus();
  }

  function clearResults() {
    elements.resultsPanel.classList.add('hidden');
    elements.techBadge.classList.add('hidden');
    elements.outputText.value = '';
    updateCharacterCount();
  }

  function showError(message) {
    elements.errorBox.textContent = message;
    elements.errorBox.classList.remove('hidden');
  }

  function hideError() {
    elements.errorBox.textContent = '';
    elements.errorBox.classList.add('hidden');
  }
});
