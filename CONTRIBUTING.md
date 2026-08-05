# Contributing

Thank you for improving AI Outreach Assistant.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm ci`.
3. Make one coherent change with tests.
4. Run `npm run check` and `npm run test:e2e`.
5. Open a pull request using the repository template.

Use Conventional Commit-style messages such as `feat: add recipient preview` or `fix: handle malformed model output`.

## Product boundaries

Contributions must preserve explicit user consent and human review. Features for automatic sending, bulk profile harvesting, evading platform controls, deceptive claims, or hidden telemetry will not be accepted.

## Coding expectations

- Keep prompt construction, network access, storage, extraction, and UI behavior separated.
- Add tests for new behavior and failure modes.
- Never commit credentials, real contact datasets, or private profile content.
- Use accessible labels and keyboard-visible focus styles.
- Update privacy and architecture documentation when data flow changes.

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
