# AI Outreach Assistant

A human-in-the-loop Chrome extension that reads the LinkedIn profile currently open in your browser and uses the Gemini API to draft a personalized message. It creates drafts only: you review, edit, and send them yourself.

## Features

- Direct-message and connection-note modes
- User-configurable sender profile and outreach goal
- Profile-aware drafts grounded in visible LinkedIn text
- Editable output with a live character count
- Local Chrome storage for the Gemini API key and sender settings
- No automated sending, bulk messaging, or contact harvesting

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this repository folder.
5. Open the extension settings and add:
   - a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
   - your name
   - a short, factual summary of your background and outreach goal
6. Visit a LinkedIn member profile and click **Generate outreach draft**.

## Privacy and data flow

- Your API key and sender profile are stored in `chrome.storage.local` on your browser profile.
- When you click **Generate**, up to 12,000 characters of visible text extracted from the open LinkedIn profile, your sender context, and optional instructions are sent to Google's Gemini API.
- This project has no backend and does not collect analytics.
- Treat generated text as a draft. Verify every factual claim before sending.

API keys embedded in browser extensions cannot be perfectly protected from someone with local access. Use a dedicated key, configure appropriate quotas or restrictions where available, and never commit a key to Git.

## Responsible use

Use the extension for thoughtful, relevant, low-volume outreach. Follow LinkedIn's terms, applicable privacy and anti-spam laws, and the recipient's preferences. Do not use it for deceptive messaging, scraping at scale, or automated sending.

## Project structure

```text
manifest.json   Chrome Manifest V3 configuration
content.js      Extracts visible profile text on explicit request
popup.html      Extension interface
popup.css       Interface styles
popup.js        Settings, prompting, Gemini request, and draft display
```

## Development checks

```bash
node --check popup.js
node --check content.js
python3 -m json.tool manifest.json >/dev/null
```

## License

[MIT](LICENSE)
