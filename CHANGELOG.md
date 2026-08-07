# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- Local recent-draft history with explicit restore and clear controls
- Guided sender-profile setup with local PDF, text, and Markdown resume import, plus an explicit one-request Gemini profile generator
- First-run setup guidance, reusable outreach goals, and non-blocking draft review warnings
- Local data export that deliberately excludes API keys

## 1.0.0 - 2026-08-06

### Added

- Modular Manifest V3 extension architecture and Vite build
- Explicit profile preview and per-request consent
- Configurable Gemini model, tone, length, and sender profile
- Local-data deletion and opt-in recent-draft storage
- Structured API errors and response validation
- Unit, DOM fixture, browser-level, evaluation, and CI checks
- Privacy, security, architecture, contribution, and responsible-use documentation

### Security

- Removed embedded credentials and personal résumé prompts
- Moved the API key from the request URL to an API header
- Added content security policy, profile minimization, secret scanning, and dependency updates
