# Public Launch Review 2026-06-06

Status: PASS for public-asset preparation, with known alpha limits.

## Purpose

This review checks whether OrgAnchor is coherent enough to proceed from public understanding documents into actual public assets such as a deck, videos, outreach posts, and sponsor/supporter materials.

It is not a v1 release certification. It is a pre-public-asset consistency review for Fireseed Alpha.

## Review Dimensions

The review used five gates:

1. Positioning consistency: public materials should describe the same project.
2. Implementation/documentation consistency: public claims should not exceed implemented alpha surfaces.
3. Public-material hygiene: no stale public slogan, broken demo command, mojibake, or legacy official-entry public wording should remain in the launch-facing package.
4. Fireseed boundary: materials must keep OrgAnchor outside trust badges, certification, marketplaces, official registries, rankings, and pay-for-trust behavior.
5. AI-agent path: public materials must preserve the low-friction path through `/.well-known/organchor.json`, compact verification, visible gaps, and external policy decisions.

## Findings And Fixes

The review found and fixed these issues:

- Public launch documents still contained a few legacy official-entry phrases. These were changed to "official-presence records" where the context is public positioning.
- Several public demo commands still pointed directly at `https://organchor.org --compact` or used the shorter visible-demo command. These were changed to the local-first public path: `npm run visible:demo -- --out ./visible-demo --serve` plus `organchor verify url <local-or-public-organchor-url> --compact`.
- `FIRESEED_OUTREACH_KIT.md` contained mojibake in the Chinese invitation block. The block was replaced with readable Chinese text.
- Publication production materials are now kept outside the source repository and npm package. This includes video scripts, rendered media, platform post drafts, presentation outlines, and sponsorship letters.
- `tests/language-compatibility.test.ts` still asserted old and mojibake Chinese strings. It now asserts the current readable Chinese wording and rejects common mojibake markers.
- `DOCS_INDEX.md` now has recommended reading paths for first-time readers, AI-agent builders, evidence reviewers, and Fireseed outreach participants.

## Verification Commands

The following checks passed after the fixes:

```bash
npm.cmd run typecheck
npm.cmd test
npm.cmd run package:smoke
npm.cmd run agent:demo
npm.cmd run visible:demo -- --out .tmp\public-launch-review-visible --cleanup
node src\cli.ts verify url https://organchor.org --compact
git diff --check
```

Observed results:

- TypeScript typecheck: PASS.
- Full test suite: PASS, 144 tests.
- Package smoke: PASS, simulated package files: 199 before adding this review document.
- Agent discovery demo: PASS, one candidate, Beacon find rate 1, origin verification success rate 1, compact verification PASS.
- Visible acceptance demo: PASS, human page markers present, compact verification PASS, tamper compact verification FAIL with identity failure as expected.
- Public self-pilot compact verification: PASS for `https://organchor.org`, with `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`.
- Diff whitespace check: PASS.

## Current Public Claim Allowed

OrgAnchor may be described as:

```text
An open-source Fireseed Alpha project that helps organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so people and AI agents can discover, screen, verify, understand, and compare candidate organizations at lower cost across domain, platform, website, or infrastructure changes.
```

This claim is supported by the current README, public explainer, visible demo, agent demo, compact verification output, Beacon/Directory experiments, and full test suite.

## Boundaries That Must Remain Visible

Public assets must continue to say:

- OrgAnchor is not stable v1.
- OrgAnchor is not a trust badge.
- OrgAnchor is not a certification authority.
- OrgAnchor is not a marketplace or final ranking system.
- OrgAnchor does not decide whether to buy, partner, approve, support, list, or trust.
- `PASS` means the checked identity/evidence structure passed the current verification path, not that the organization is good or best.
- S1-S3 are the current Fireseed Alpha evidence baseline.
- S4/S5 are design-preview areas until specific implemented commands, schemas, tests, and operating practices are cited.
- Directory and Beacon discovery reduce search cost, but selected candidates still require direct source verification.
- Sponsorship does not buy ranking, Directory priority, trust status, verification results, policy influence, or certification.

## Known Alpha Limits

The project is coherent enough to proceed into public assets, but the following limits remain:

- No broad external organization pilot has completed yet.
- S4/S5 real-use observation and public challenge remain design-preview areas.
- Product/service delegated credential workflows are documented but not implemented.
- Package health and commercial-fit layers are documented directions, not complete product surfaces.
- Broad third-party Directory adoption has not begun.
- Public videos, deck files, and outreach posts have not yet been produced from the reviewed outlines.

## Decision

Proceed to public-asset production.

Recommended next step:

```text
Use the source repository as the factual base for external material, then prepare decks, videos, posts, and sponsorship messages in an off-repository publication workspace. If publishing through the CivitasX channel, establish the CivitasX parent frame first.
```
