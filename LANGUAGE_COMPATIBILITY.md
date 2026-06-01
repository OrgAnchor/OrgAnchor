# OrgAnchor Language Compatibility Policy

Status: Active design policy.

## Purpose

OrgAnchor is global-facing. It must support humans working in different languages without fragmenting the machine-readable protocol that AI agents, directories, and independent verifiers rely on.

The core rule is:

```text
Machine contract stays stable and language-neutral.
Human explanation can be localized.
Localization must not create a different protocol.
```

## Layers

## 1. Machine Contract

These MUST remain stable English / ASCII identifiers:

- JSON object keys.
- schema URLs.
- CLI command names and flags.
- status enums such as `PASS`, `WARN`, `FAIL`, `NOT_INCLUDED`, `FULL_COMPATIBLE`.
- policy route codes such as `EXTERNAL_POLICY_REVIEW` and `STOP_IDENTITY_FAILURE`.
- evidence class identifiers such as `S1`, `S2`, `S3`, `S4`, `S5`.
- hash, signature, authority, and artifact field names.

Reason:

AI agents, independent implementations, directory nodes, validators, and scripts need one stable contract. Translating machine keys would create incompatible variants and raise verification cost.

## 2. Human Explanation

Human-facing text MAY be localized:

- `/verify/index.html` explanatory labels and descriptions.
- README and onboarding guides.
- visible acceptance guides.
- glossary entries.
- operator checklists.
- evidence template instructions.

Localized pages must preserve the same underlying files:

```text
/verify/organchor.json
/.well-known/organchor.json
official-endpoints.json
official-endpoints.json.sig
root-authority.json
claims/evidence manifests
```

Localized text may explain what `PASS` means, but it must not rename `PASS` inside the machine-readable JSON.

## 3. Claim And Evidence Content

Organizations may publish claims, evidence descriptions, limitations, and methods in their working language.

When language matters, records SHOULD carry language metadata instead of relying on inference:

```json
{
  "language": "zh-CN",
  "text": "..."
}
```

or, for multilingual content:

```json
{
  "localized": {
    "en": "...",
    "zh-CN": "..."
  }
}
```

The current alpha does not fully implement multilingual claim/evidence fields. This policy defines the direction: add explicit language metadata where low-cost compatibility requires it, without breaking existing single-language records.

## 4. Discovery Language Metadata

Beacon and Directory discovery records already expose language filters through `languages`.

This means:

- `languages` describes the languages an adopter publicly supports for discovery and human review.
- It does not change the machine contract.
- Directory and Beacon queries may filter by language to reduce first-pass review cost.

If a page is only English, its page language should be `en`.
If a page has localized variants, those variants should use standard BCP 47 tags such as `en`, `zh-CN`, `ja`, `de`, `fr`, or `es`.

## 5. Translation Risk Boundary

Translation can introduce errors. OrgAnchor should treat translated human text as an explanation layer, not as a new signed fact unless it is explicitly signed as a translated claim.

Recommended rule:

```text
If a translated statement changes legal, technical, safety, performance, or evidence meaning, it must be reviewed and signed like any other claim-bearing artifact.
```

For low-risk UI labels, ordinary localization is acceptable.

For product claims, specifications, limitations, warranties, certifications, or test methods, translation accuracy can affect trust decisions. Those translations should be hash-bound or signed when used as evidence.

## 6. Default Project Policy

Fireseed Alpha defaults:

- Protocol language: stable English machine contract.
- Human docs: English plus selected Chinese operator guidance where useful.
- `/verify` page: English first, with future localization support planned.
- AI-agent path: language-independent JSON contract first; localized explanation second.
- Directory language filters: supported through existing `language` / `languages` fields.

OrgAnchor should not block adoption because an organization is not English-native. It should also not force every verifier to understand every language before performing first-pass identity verification.

## 7. Acceptance Criteria

Language compatibility is acceptable when:

- machine-readable keys and enums remain stable across locales;
- human-visible pages clearly declare their language;
- localized pages do not change trust semantics;
- `/.well-known/organchor.json` and `/verify/organchor.json` remain discoverable and language-independent;
- Directory and Beacon records expose supported languages;
- evidence translations that carry substantive claim meaning can be separately hashed, signed, or tied back to the source artifact.

Language compatibility is not acceptable when:

- translated machine keys create incompatible JSON variants;
- localized pages imply OrgAnchor certification or endorsement;
- translation hides missing evidence, warnings, expired records, or policy boundaries;
- an organization uses translation ambiguity to make stronger claims in one language than another without disclosure.

## Current Gap

The current alpha has basic discovery language metadata, but the generated `/verify/index.html` is English-only and does not yet emit localized variants. That is acceptable for Fireseed Alpha if it is disclosed, but localization should become a first-class operator feature before broad non-English adoption.
