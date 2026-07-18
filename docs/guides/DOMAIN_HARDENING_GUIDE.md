# OrgAnchor Domain Hardening Guide

Status: Draft operator guide.

## Purpose

This guide explains how to reduce traditional domain risk for an OrgAnchor adoption.

Domain hardening is not the identity root.

The domain is a high-value discovery carrier. A stronger domain setup makes it harder for attackers or operational mistakes to mislead users before they reach the signed OrgAnchor artifacts.

## Domain Role

The domain usually carries:

```text
https://example.org/
https://example.org/verify/
https://example.org/verify/organchor.json
https://example.org/verify/official-endpoints.json
https://example.org/verify/official-endpoints.json.sig
https://example.org/verify/root-authority.json
```

If the domain fails, OrgAnchor should still have:

- Root authority.
- Signed statements.
- IPFS mirrors.
- Arweave archives.
- OpenTimestamps proofs.
- Future migration statements.
- Optional Onion or ENS access.

## Audit Command

Run:

```bash
organchor domain audit example.org
```

Expected outputs:

```text
reports/domain-security-report.json
reports/domain-security-report.md
```

Status values:

```text
PASS
WARN
FAIL
MANUAL_CHECK_REQUIRED
```

## How to Read Results

### PASS

The check succeeded.

Example:

```text
HTTPS is available.
```

### WARN

The result is not ideal, but may be acceptable depending on context.

Example:

```text
CAA record missing.
```

### FAIL

The check failed and should be fixed before production use.

Example:

```text
/verify/ is not reachable.
```

### MANUAL_CHECK_REQUIRED

The tool cannot reliably determine the setting automatically.

Example:

```text
Registry Lock status.
Auto-renewal status.
Registrar account 2FA.
```

## Registrar Account Controls

Manual checks:

- [ ] Domain is in the intended organization account.
- [ ] Account uses strong 2FA.
- [ ] Recovery email is controlled by the organization.
- [ ] Recovery phone, if any, is current.
- [ ] Billing method is current.
- [ ] Auto-renewal is enabled.
- [ ] Renewal reminders are configured.
- [ ] Registry Lock is enabled where available and appropriate.
- [ ] Administrative contacts are not a single unmonitored personal inbox.

Why:

Registrar compromise or accidental expiry can break the most visible carrier.

## DNS Controls

Recommended:

- DNSSEC enabled if operationally acceptable.
- CAA record configured.
- Minimal unnecessary records.
- No stale verification records for old providers.
- DNS changes reviewed before publication.

DNSSEC:

DNSSEC can reduce some DNS tampering risks, but it must be operated carefully. Broken DNSSEC can make a domain unreachable.

CAA:

CAA limits which certificate authorities should issue certificates for the domain.

Example policy:

```text
Only allow the certificate authority actually used by the organization.
```

## HTTPS Controls

Required:

- HTTPS works.
- Certificate is valid.
- Certificate expiry is not near.
- HTTP redirects to HTTPS where appropriate.

Recommended:

- HSTS after the site is stable.
- No mixed content.
- TLS settings maintained by a reputable provider.

OrgAnchor domain audit should report HTTPS and certificate expiration.

## Mail Controls

If the domain sends or receives email, configure:

- MX.
- SPF.
- DKIM.
- DMARC.

If the domain does not send email, publish a restrictive SPF and DMARC policy when appropriate.

Examples:

```text
SPF: v=spf1 -all
DMARC: reject or quarantine policy after testing
```

Be careful:

- Do not set a strict DMARC policy until legitimate mail flows are understood.
- DKIM depends on the actual mail provider.

## Verification Paths

These should be publicly reachable:

```text
/verify/
/verify/organchor.json
/verify/official-endpoints.json
/verify/official-endpoints.json.sig
/verify/root-authority.json
```

Recommended:

```text
/.well-known/organchor.json
/.well-known/security.txt
/security.txt
```

`/verify/*` should be friendly to:

- Humans.
- CLI tools.
- Search engines when appropriate.
- AI agents that need machine-readable verification artifacts.

Do not block all bots from `/verify/*` by default.

## security.txt

Recommended:

```text
/.well-known/security.txt
```

Purpose:

- Tell researchers how to report security issues.
- Provide a security contact.

This does not replace OrgAnchor identity verification, but it is useful domain hygiene.

## Cloudflare Notes

If using Cloudflare:

- Use a dedicated organization/project account when possible.
- Keep API tokens scoped after setup.
- Revoke or rotate temporary broad credentials.
- Avoid globally blocking AI agents from `/verify/*`.
- Confirm Pages custom domain status.
- Confirm DNS-only versus proxied records intentionally.
- Confirm registrar auto-renewal manually.

Cloudflare is a carrier and operational provider, not the identity root.

## Common Failure Modes

### Domain Expires

Impact:

- Website carrier fails.
- Attackers may acquire the domain later.

Mitigation:

- Auto-renewal.
- Billing monitoring.
- Renewal reminders.
- Registry Lock where available.
- Alternative carriers recorded.

### DNS Misconfigured

Impact:

- `/verify` may disappear.
- Users see old or wrong content.

Mitigation:

- DNS audit.
- Deployment checks.
- IPFS and Arweave receipts.

### Provider Account Compromised

Impact:

- Attacker can change website or DNS.

Mitigation:

- Root authority signatures still decide validity.
- Domain audit and monitoring.
- Publish correction/migration through other carriers.
- Rotate provider credentials.

### Certificate Failure

Impact:

- HTTPS warnings.
- Users and agents may not fetch artifacts.

Mitigation:

- Certificate monitoring.
- Provider-managed certificates.
- HSTS only after stable setup.

## Minimum Domain Hardening For Public Pilot

- [ ] Domain controlled by intended organization account.
- [ ] 2FA enabled.
- [ ] Auto-renewal manually confirmed.
- [ ] `/verify/` reachable.
- [ ] HTTPS valid.
- [ ] `official-endpoints.json` reachable.
- [ ] `official-endpoints.json.sig` reachable.
- [ ] `root-authority.json` reachable.
- [ ] `security.txt` published or consciously deferred.
- [ ] Domain audit report generated.
- [ ] Manual checks recorded.

## Mature Domain Hardening

- [ ] DNSSEC enabled and tested.
- [ ] CAA configured.
- [ ] Mail authentication configured.
- [ ] Registry Lock enabled if available.
- [ ] Provider API tokens scoped.
- [ ] Monitoring configured.
- [ ] Alternative carriers tested.
- [ ] Incident response path documented.

## Incident Response

If the domain is compromised:

1. Do not treat the compromised website as authoritative.
2. Verify the latest valid signed statement from independent carriers.
3. Publish an incident statement through remaining controlled carriers.
4. Rotate provider credentials.
5. Restore or replace the domain carrier.
6. If root authority is unaffected, use it to explain the incident.
7. If root authority is affected, follow root authority compromise procedures.

## Plain-Language Summary

The domain is the front door.

OrgAnchor root authority is the continuity seal.

Domain hardening keeps the front door harder to steal, but the signed statements are what let the organization explain and recover from carrier failure.
