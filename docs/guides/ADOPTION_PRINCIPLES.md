# OrgAnchor Adoption Principles

Status: Active adoption guidance.

## Purpose

This document describes the kind of organization OrgAnchor is designed to help first.

OrgAnchor can be used as a technical toolchain, but the official project should encourage adoption by organizations that want more than a credibility badge. The best adopters want continuity, public evidence, and long-term accountability.

## Good Fit

OrgAnchor is a good fit for organizations that:

- Build products, services, research, media, infrastructure, or communities intended to last.
- Want their official entry points to remain verifiable across domain, platform, and infrastructure changes.
- Are willing to publish signed statements instead of relying only on platform profiles or marketing pages.
- Can protect root authority keys or distribute authority across trusted members.
- Can publish structured claims and supporting evidence.
- Are willing to correct, supersede, or explain older claims instead of silently rewriting history.
- Want people and AI agents to inspect their public proof trail.

Good early adopters include:

- Open-source projects.
- Research groups.
- Public-interest organizations.
- Independent labs and studios.
- Small companies with real public artifacts.
- Long-term communities that need identity continuity.

## Poor Fit

OrgAnchor is a poor fit for organizations that:

- Want a trust badge without publishing evidence.
- Need legal identity verification as their primary goal.
- Cannot safely protect root authority keys.
- Have unresolved internal authority disputes.
- Want to hide ownership changes, accountability failures, or material corrections.
- Want to use signed continuity to impersonate another organization.
- Want to use technical legitimacy to launder fraud, exploitation, or deliberate deception.

OrgAnchor may still be open-source software, but the official project does not need to promote every use.

## Adoption Promise

An adopting organization should be able to explain, in public and in machine-readable form:

```text
What value do we claim to provide?
What official endpoints do we currently use?
Who may sign official statements for us?
What evidence supports our claims?
Which evidence is first-party, third-party, technical, testimonial, or historical?
What are the known limits of the evidence?
How do we publish corrections?
How do we preserve continuity when our roots or endpoints change?
```

This is not a legal oath. It is a practical public posture.

## Claims and Evidence Discipline

Claims should be specific enough to evaluate.

Weak:

```text
We are the best.
We are trusted.
We are revolutionary.
```

Better:

```text
We maintain this open-source package.
This release was published from this Git commit.
This benchmark used this dataset and method.
This customer case was published with this permission and date.
This claim supersedes an older claim because these conditions changed.
```

OrgAnchor should make the second style easier.

## AI-Agent-Friendly Adoption

Future verification will often be performed by AI agents before humans read anything.

Adopters should help agents distinguish:

- Official statements from mirrors.
- Claims from evidence.
- First-party evidence from third-party evidence.
- Current claims from superseded claims.
- Public facts from marketing interpretation.
- Verified continuity from broader trustworthiness.

This makes honest organizations easier to inspect without pretending that a signature alone proves virtue.

## Official Support and Showcase

Official OrgAnchor examples, case studies, and showcase listings should prefer organizations that:

- Publish a working `/verify` page.
- Keep claims and evidence structured.
- Avoid misleading "verified means trusted" language.
- Record corrections and migrations plainly.
- Do not use OrgAnchor to obscure obvious harm, fraud, impersonation, or exploitation.

See `docs/outreach/SHOWCASE_POLICY.md` for the public listing rules.

## Adoption Boundary

OrgAnchor adoption means:

```text
This organization has made its identity continuity and public claims more verifiable.
```

It does not mean:

```text
This organization is endorsed by OrgAnchor.
This organization is morally good.
This organization's products are proven effective.
This organization cannot deceive people.
```

Keeping this boundary clear protects both users and the project.
