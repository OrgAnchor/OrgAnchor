# OrgAnchor Avatar v0.1

Status: adopted

Adopted on: 2026-07-18

First public use: [OrgAnchor on Bluesky](https://bsky.app/profile/organchor.org)

## Purpose

This directory preserves the first adopted OrgAnchor avatar as a versioned,
reproducible public brand asset. It is not a trust badge or certification mark.

## Meaning

- The one-stroke `organchor` wordmark represents organizational identity and
  historical continuity.
- The gold outer node is the root origin and shares its coordinate with the
  first pen-down point of the letter `o` and the public-record path.
- The open multi-turn path represents signed statements, evidence, migrations,
  and recheckable historical records.
- The path becomes stronger toward the center and ends at an elevated node,
  representing movement from scattered information toward structured,
  machine-verifiable material.
- The faint dot field represents machine-readable public data for AI agents.

## Structural Invariants

- The visible wordmark is one continuous SVG path.
- The wordmark contains one move command and no close command.
- The gold origin node and the outer record path share the same start point.
- The record path remains open; it does not imply a closed certification system.

## Files

- `organchor-avatar-v0.1.svg`: canonical vector asset.
- `organchor-avatar-v0.1-1024.png`: 1024 x 1024 platform-ready export.

## Integrity

SHA-256:

```text
organchor-avatar-v0.1.svg
FFE0D2ED8110141D1450EA6284B61594F7AB954002C9CD48D6A35E92BC580C14

organchor-avatar-v0.1-1024.png
98C89F0A7E464673B7FC876CBE1F4F1A50384FA594941ABCCEA93F1EE895C1A4
```

Future revisions must use a new versioned directory instead of silently
overwriting these files.
