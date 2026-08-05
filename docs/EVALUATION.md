# Evaluation methodology

The included evaluation is a deterministic engineering regression suite, not a claim about universal message quality.

`npm run evaluate` reads anonymized synthetic cases and measures connection-note length, recipient-name presence, required grounding phrases, and unresolved placeholders. All bundled fixtures must pass.

Model-dependent evaluation should be run manually with a dedicated test key and synthetic profiles because live API output is variable and should not be required by CI.

Future evaluation sets can add blinded human ratings for factuality, relevance, naturalness, and pressure level. Any published result should include the model identifier, prompt version, sample size, scoring rubric, and limitations.
