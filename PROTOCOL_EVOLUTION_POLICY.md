# OrgAnchor Protocol Evolution Policy

Status: Accepted protocol-governance baseline.

## Purpose

OrgAnchor must evolve without erasing the historical validity of packages that were created under earlier rules.

The core rule is:

```text
Old records must remain verifiable under the rules, schemas, keys, hashes, and signatures that existed when they were published.
```

New OrgAnchor versions may add stronger evidence layers, better discovery, better agent outputs, new cryptographic options, and clearer gap reporting. They must not retroactively turn a valid historical package into an invalid package merely because it lacks later capabilities.

## Why This Exists

OrgAnchor is designed for identity continuity. If the protocol itself could casually invalidate old adopter packages, it would recreate the same continuity risk that OrgAnchor is meant to reduce.

An early adopter package should be understood as a versioned public snapshot:

```text
This organization published these signed records under OrgAnchor schema/version X at time Y.
```

Later reviewers may correctly say:

```text
This legacy package is missing newer evidence, discovery, or agent-output capabilities.
```

They must not say:

```text
This legacy package is invalid only because OrgAnchor later introduced a stronger standard.
```

## Terms

```text
protocol version
  The OrgAnchor verification contract and behavior expected by verifiers.

schema version
  The JSON schema identifier and artifact version embedded in a signed record.

adoption snapshot
  A dated verify package produced by an adopting organization under a specific OrgAnchor version.

legacy package
  A package produced under an older OrgAnchor version that can still be verified under its original rules.

current package
  The package an organization currently presents at its main /verify path.

migration statement
  A signed artifact that links an old root authority or package lineage to a newer one.
```

## Non-Negotiable Rules

1. Historical signatures are evaluated against their own canonical JSON, schema version, root authority, threshold rule, signature algorithm, and hash.
2. New required fields must not be applied retroactively to old signed artifacts.
3. Unknown future versions must fail closed as unsupported, not be treated as valid by guessing.
4. Known older versions should be verified by version-specific verifier logic whenever practical.
5. A valid older package should be reported as legacy or gap-bearing, not as tampered.
6. OrgAnchor cannot migrate an adopter's identity on the adopter's behalf.
7. Adoption migration must be authorized by the adopter's own root authority.
8. Historical packages should be preserved by stable dated paths or content-addressed/archive carriers.
9. Directories, mirrors, registries, and the OrgAnchor project website are not allowed to become the identity root for adopters.

## Recommended Compatibility Statuses

Future verifiers should distinguish these cases:

```text
FULL_COMPATIBLE
  The package verifies and satisfies the current verifier's expected profile.

IDENTITY_VERIFY_PASS
  The identity layer verifies, but optional or value/evidence layers are absent or incomplete.

LEGACY_BUT_VERIFIABLE
  The package was produced under an older known protocol/schema version and verifies under that version.

LEGACY_WITH_GAPS
  The package verifies under its original version, but lacks capabilities expected by current adoption guidance.

UNSUPPORTED_VERSION
  The verifier does not know how to evaluate this version safely.

INVALID_OR_TAMPERED
  The package claims a supported version, but hash, signature, schema, root authority, or required artifact checks fail.
```

These statuses are not trust decisions. They are routing signals for humans and AI agents.

## Versioning Rules

OrgAnchor artifacts should keep explicit `schema`, `type`, and `version` fields.

Use version changes conservatively:

```text
patch-level changes
  Documentation clarifications, implementation fixes, and optional output additions that do not change artifact meaning.

minor-compatible changes
  Optional fields, optional reports, additional warnings, additional carrier receipts, or agent-output fields that old verifiers can ignore.

major or schema-line changes
  Required field changes, renamed stable fields, changed canonical signing input, changed root authority semantics, or changed verification rules.
```

Major or schema-line changes must provide a migration and compatibility plan before being treated as adopter-facing.

## Verify Package Layout

An adopter may expose the latest package at:

```text
/verify/
```

Historical packages should be preserved at stable dated or versioned paths when practical:

```text
/verify/2026-07-09/
/verify/v1-2026-07-09/
/verify/history/
```

The current `/verify/` page may point to historical packages, but it must not silently overwrite the meaning of a historical package.

## Migration Model

When an adopter moves from an old package or root authority to a new one:

1. Keep the old package available when practical.
2. Generate the new package under the newer OrgAnchor rules.
3. Sign a migration statement with the old root authority threshold when root authority changes.
4. Publish the migration statement beside the current package.
5. Expose the migration chain in the machine-readable verify index and human-readable verify page.

Migration proves continuity. It does not prove product quality, legal status, ethics, solvency, or final trust.

## What This Means For Early Adopters

An early adopter such as CivitasX should treat its first package as:

```text
OrgAnchor schema v1.0 adoption snapshot for a specific publication date.
```

If OrgAnchor later adds a stronger evidence or agent-compatibility model, CivitasX should:

1. Preserve the original snapshot.
2. Publish a new current package using the newer rules.
3. Link the old and new packages through signed migration or continuity records when the root authority or package lineage changes.
4. Allow external agents to report the old package as legacy-but-verifiable instead of invalid.

## Implementation Requirements Before A Future v2

Before OrgAnchor publishes a future v2 or incompatible schema line, the project should add:

- legacy fixture packages for the last stable v1 adopter shape;
- verifier tests that prove v1 packages remain verifiable;
- explicit status output for legacy-but-verifiable and unsupported-version cases;
- migration examples from v1 to the new package shape;
- documentation updates in the adopter guide, agent contract, and migration guide;
- a release note that explains what changed without implying old packages were erased.

## Boundary

This policy does not require OrgAnchor to support every experimental draft forever.

It applies to adopter-facing packages and stable release lines that organizations could reasonably have used for public identity continuity. Draft examples, local rehearsals, and unpublished development artifacts may be superseded more freely, but public adopter records should be treated as historical facts.
