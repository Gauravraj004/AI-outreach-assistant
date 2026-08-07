# Privacy policy

Last updated: August 6, 2026

AI Outreach Assistant is a locally installed, open-source Chrome extension. It has no project-operated backend and does not collect analytics.

## Data stored locally

The extension can store the Gemini API key supplied by the user, sender details, model preferences, and up to five recent drafts when the user explicitly enables this option. A selected resume is parsed locally; the original file is not uploaded or retained by the extension. If the user explicitly checks the resume consent box and clicks **Create profile**, the imported resume text is sent to Gemini in one request to produce an editable sender profile. The **Delete local data** control removes all stored values.

## Data sent to Gemini

Nothing is sent to an AI provider when the popup opens or previews a profile. After explicit user consent and a click on **Generate**, the extension sends up to 12,000 characters of visible LinkedIn profile text, sender context, and selected writing instructions directly to the selected Google Gemini API model. Google's terms and privacy practices apply.

## Data not collected by this project

The project does not operate servers, receive API keys, collect telemetry, sell data, automate message sending, or maintain a remote contact database.

## Security limitations

Secrets stored in a browser extension cannot be perfectly protected from someone with access to the browser profile or extension debugging tools. Use a dedicated API key with appropriate quotas or restrictions, and revoke it if exposure is suspected.

## Contact

Use a private GitHub security advisory for security or privacy concerns. Do not include live credentials or private profile information in reports.
