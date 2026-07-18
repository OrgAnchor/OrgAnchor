# OrgAnchor Discovery Taxonomy

Status: Draft baseline

OrgAnchor discovery fields must be easy for small organizations to publish and easy for AI agents to compare. The taxonomy is therefore controlled but extensible.

## Fields

Directory records and Beacons use four first-pass discovery fields:

```text
category
capability
region
language
```

These are discovery hints, not trust claims. They help agents decide which origins to verify first.

## Categories

Suggested initial categories:

```text
software
hardware
manufacturing
professional-services
research
education
media
community
public-interest
infrastructure
finance-adjacent
health-adjacent
uncategorized
```

Regulated or high-risk categories should use cautious names such as `health-adjacent` instead of implying legal, medical, or financial assurance.

## Capabilities

Capabilities should describe what the organization can provide or prove, not marketing slogans.

Examples:

```text
identity-continuity
agent-verification
evidence-publishing
open-source-maintenance
software-development
security-audit
precision-machining
product-testing
documentation
training
research-publication
data-publishing
```

Rules:

- use lowercase ASCII,
- use hyphen-separated words,
- prefer specific capabilities over slogans,
- avoid unverifiable superiority claims such as `best`, `top`, or `guaranteed`.

## Regions

Regions should use:

```text
global
online
na
eu
uk
us
apac
latam
mena
africa
```

Country codes may be added with ISO-like lowercase values such as `de`, `fr`, `jp`, `sg`, or `br`.

## Languages

Languages should use lowercase BCP-47-style tags:

```text
en
zh
zh-cn
zh-tw
es
fr
de
ja
ko
pt
ar
```

## Extensions

If an adopter or Directory needs a term outside the baseline vocabulary, it may use:

```text
vendor.example:custom-term
```

or:

```text
example.com/custom-term
```

Namespaced extension terms let agents keep comparing the baseline vocabulary while ignoring unsupported custom semantics.

## Agent Behavior

Agents should treat taxonomy matches as candidate-discovery signals only.

Recommended flow:

1. Use category, capability, region, and language to shortlist candidates.
2. Fetch the candidate origin's Beacon.
3. Verify the origin directly.
4. Read match explanations and risk gaps.
5. Apply the requesting party's external policy.

The taxonomy must never become a hidden ranking system or a final trust score.
