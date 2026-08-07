# AI Outreach Assistant

[![CI](https://github.com/Gauravraj004/AI-outreach-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/Gauravraj004/AI-outreach-assistant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c6df2.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-39d98a.svg)](public/manifest.json)

A privacy-conscious, human-in-the-loop Chrome extension that creates grounded LinkedIn outreach drafts from visible profile context using a user-provided Gemini API key.

The extension never sends a message, clicks LinkedIn action buttons, or runs bulk outreach. The user previews the recipient data, explicitly approves each AI request, reviews the draft, and copies it manually.

![AI Outreach Assistant popup](assets/popup-preview.jpg)

## Why this project exists

Writing relevant outreach takes research and care. This project reduces blank-page work without removing human judgment. It demonstrates browser-extension architecture, prompt grounding, privacy-aware product design, structured model output, automated testing, and release engineering.

## Features

- Direct-message and connection-note workflows
- Explicit preview and consent before profile data leaves the browser
- Configurable tone, length, sender profile, and Gemini model
- Bring-your-own-key setup stored in Chrome local extension storage
- API key sent through the `x-goog-api-key` header instead of the URL
- Robust profile extraction with noise removal, deduplication, and a 12,000-character cap
- Structured JSON parsing and human-readable API errors
- Editable draft, live character limit, regenerate, and copy controls
- Optional local storage for only the five most recent drafts, with restore and clear controls
- One-click deletion of all locally stored extension data
- No backend, analytics, automated sending, or bulk scraping

## Install from source

Requirements: Node.js 22 or newer and Chrome.

```bash
git clone https://github.com/Gauravraj004/AI-outreach-assistant.git
cd AI-outreach-assistant
npm ci
npm run build
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the generated `dist/` folder.
5. Open the extension settings and add a dedicated [Gemini API key](https://aistudio.google.com/apikey), your name, and a truthful sender profile.
6. Visit a LinkedIn member profile, preview the extracted information, approve the request, and generate a draft.

## Data flow

```mermaid
flowchart LR
  A["Visible LinkedIn profile"] --> B["Local extraction and minimization"]
  C["Local sender settings"] --> D{"Explicit user consent"}
  B --> D
  D -->|Approved| E["Gemini API"]
  E --> F["Editable draft"]
  F --> G["Manual copy and send"]
```

The API key, sender profile, preferences, and optional recent drafts are stored in `chrome.storage.local`. When the user clicks **Generate**, up to 12,000 characters of visible profile text plus the sender context and instructions are sent directly to Google's Gemini API. See [PRIVACY.md](PRIVACY.md) and the [threat model](docs/THREAT_MODEL.md).

## Architecture

```text
src/
├── content/      Profile extraction and content-script entry point
├── popup/        Popup UI and interaction controller
├── prompts/      Pure prompt construction
├── services/     Gemini and local-storage adapters
└── shared/       Limits, validation, and response parsing
```

Vite produces a module-based popup bundle and a separate IIFE content script compatible with Chrome Manifest V3. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions.

## Quality checks

```bash
npm run check       # formatting, lint, unit tests, build, evaluation
npm run test:e2e    # browser-level popup tests
npm run package     # production ZIP
```

Unit tests cover prompt construction, response parsing, storage behavior, API failure classification, validation, limits, and DOM-based profile extraction. GitHub Actions runs these checks, browser tests, and secret scanning on every pull request.

## Evaluation

`npm run evaluate` executes deterministic checks against anonymized fixtures for connection-note length, recipient-name inclusion, required grounding phrases, and placeholder leakage. This is an engineering regression suite, not a scientific model-quality benchmark. See [docs/EVALUATION.md](docs/EVALUATION.md).

## Responsible use

Use the extension for relevant, truthful, low-volume communication. Follow LinkedIn's terms, applicable privacy and anti-spam laws, and recipient preferences. Do not use it for deceptive claims, automated sending, bulk scraping, or harassment. Generated text can be wrong and must be reviewed.

## Contributing and security

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Report vulnerabilities using the instructions in [SECURITY.md](SECURITY.md).
- Review planned changes in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
