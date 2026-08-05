# Threat model

## Assets

- User-provided Gemini API key
- Sender background and goals
- Visible recipient profile text
- Optional recent drafts

## Threats and mitigations

| Threat                           | Mitigation                                                              | Residual risk                                       |
| -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Credential committed to Git      | No embedded keys, secret scanning, contributor guidance                 | Users can still paste keys into issues or forks     |
| Key exposed through request URLs | API key sent in `x-goog-api-key` header                                 | Browser debugging tools can inspect requests        |
| Excessive profile disclosure     | Preview, explicit consent, noise filtering, 12,000-character cap        | Visible text may still contain personal information |
| Prompt injection in profile text | Rules separate untrusted profile context; no tools or automatic actions | A model may still follow malicious text             |
| Hallucinated outreach claims     | Grounding rules, structured output, visible review warning              | Human review remains essential                      |
| Silent data retention            | Draft history is opt-in, capped at five, and locally deletable          | Device compromise is outside project control        |
| Cross-site privilege expansion   | Host permissions limited to LinkedIn and Gemini                         | LinkedIn DOM changes can break extraction           |
| Automated spam                   | No automatic sending, bulk workflow, or button clicking                 | A modified fork could remove these boundaries       |

## Out of scope

Compromised operating systems, malicious browser extensions, physical access to an unlocked browser profile, Google account compromise, and modified downstream forks are outside the project's security boundary.
