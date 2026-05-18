# ADR 0001: Use a Root Authority Set

## Status

Accepted

## Context

OrgAnchor needs a long-lived identity root for organizations.

The simplest design is a single root key:

```text
one root private key + one root public key
```

This is easy to understand and easy to implement, but it creates serious governance and safety problems:

- If one person controls the private key, the whole identity continuity chain depends on that person.
- If multiple people share the same private key, leaks cannot be attributed and individual authority cannot be revoked.
- If the organization grows or splits, a single shared key can cause conflicting statements and destroy trust in the accumulated history.
- If the single private key is leaked, an attacker can sign statements that look valid.
- If the single private key is lost, the organization cannot continue the chain.

OrgAnchor should be able to serve both small organizations and organizations that mature over time.

## Decision

OrgAnchor will model the identity root as a **Root Authority Set**:

```text
a set of root public keys + a threshold rule + a traceable change history
```

The smallest valid root authority is `1-of-1`, which behaves like a single root key.

Larger organizations can migrate to rules such as:

```text
2-of-3
3-of-5
5-of-9
```

Each root member should hold a separate private key. OrgAnchor should not recommend multiple people sharing the same root private key.

An official endpoint statement is valid only when its signature set satisfies the current root authority rule.

## Consequences

This design gives OrgAnchor a growth path:

- Small organizations can start simply with `1-of-1`.
- Mature organizations can distribute authority without sharing private keys.
- Member changes can be represented through migration or root authority change statements.
- The statement signature format must support multiple signatures, even if v1 initially implements only `1-of-1`.
- Verification must eventually check both cryptographic validity and threshold satisfaction.

This design does not solve governance by itself. Threshold choices are organizational decisions:

- `1-of-n` may be too permissive.
- `n-of-n` may create deadlock.
- A threshold can still be compromised if enough member keys are leaked.

OrgAnchor should present these tradeoffs honestly.

## v1 Position

v1 may implement `1-of-1` signing first, but the schema, documentation, and signature file format should reserve room for multi-signature verification.

The product language should use:

```text
organization root authority
```

instead of treating a single root public key as the only possible identity root.
