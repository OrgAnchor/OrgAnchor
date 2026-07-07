# Fireseed Outreach Kit

Status: Active external-validation starter kit.

## Purpose

This kit is the practical entry point for Fireseed Alpha outreach.

It is for named early adopters, technical reviewers, and evidence/governance critics who need one clear answer:

```text
What should I try, what should I not infer, and where should feedback go?
```

Fireseed outreach should test whether OrgAnchor lowers the cost of discovery, verification, understanding, and early transaction screening for third-party AI agents and people.

It should not test whether OrgAnchor is a stable v1 product, certification authority, marketplace, or product-quality judge.

## Current Outreach Claim

Use this exact scope:

```text
OrgAnchor Fireseed Alpha exposes a minimum inspectable loop:
root authority;
signed official-presence records;
public /verify package;
origin-owned Beacon discovery;
AI-agent compact verification;
signed claims and evidence;
S1-S3 evidence baseline;
S4/S5 design-preview boundaries.
```

Do not claim:

```text
stable v1;
guaranteed truth;
official trust badge;
official supplier ranking;
product quality certification;
legal, safety, procurement, or ethical approval;
finished public challenge, correction, and accountability network;
finished marketplace or directory ecosystem.
```

## Before Inviting Anyone

Confirm these are true:

```bash
npm run typecheck
npm test
npm run package:smoke
npm run agent:demo
npm run visible:demo -- --cleanup
```

Public reference surfaces should also be available:

```text
https://organchor.org/verify/
https://organchor.org/.well-known/organchor.json
https://github.com/OrgAnchor/OrgAnchor
```

If the public self-pilot is temporarily unavailable, outreach should be limited to local technical review.

## Who To Invite First

Invite named participants only. Do not broad-promote before the first feedback cycle.

Recommended first batch:

```text
1 adopting organization or realistic organization operator;
1-2 technical reviewers;
1-2 evidence/governance critics;
optional: 1 AI-agent or directory builder.
```

Good participants are people who will report concrete friction, not only general opinions.

## Track 1: Adopting Organization Trial

Goal:

```text
Can a real or realistic organization publish a useful OrgAnchor package without excessive effort?
```

Minimum task list:

```text
install the alpha package or use a source checkout;
create a root authority;
sign an official-presence record;
generate a public /verify package;
generate Beacon discovery surfaces;
create at least one narrow claim;
attach at least one S1 evidence item;
attempt S2 or S3 if the organization has suitable material;
run organchor verify url <origin> --compact;
record the smallest confusing or heavy step.
```

Useful commands:

```bash
npm install -g organchor@alpha
organchor --help
organchor init
organchor key generate --id root-2026
organchor authority create --key keys/root-2026.private.json
organchor statement create --config organchor.config.json --authority root-authority.json
organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --out public/verify
organchor beacon generate --verify-dir public/verify --origin https://example.org
organchor verify url https://example.org --compact
```

Feedback goes to:

```text
GitHub issue template: Adopter Trial / Fireseed
```

Report:

```text
organization kind;
public URL if available;
completed steps;
first blocker;
what would reduce operator friction;
whether a third-party AI agent could verify without private context.
```

## Track 2: Technical Review

Goal:

```text
Can a technical outsider reproduce the verification loop and find implementation, schema, security, or packaging defects?
```

Minimum task list:

```text
run local test and smoke checks;
inspect canonical JSON and duplicate-key rejection;
review Ed25519 and threshold authority behavior;
verify signed statement tamper failure;
verify migration continuity;
inspect /verify/organchor.json and /.well-known/organchor.json;
run compact agent verification;
review package contents for accidental secrets or missing docs.
```

Useful commands:

```bash
npm ci
npm run typecheck
npm test
npm run package:smoke
npm run agent:demo
npm run visible:demo -- --cleanup
organchor verify url <local-or-public-organchor-url> --compact
```

Feedback goes to:

```text
GitHub issue template: Technical Review / Fireseed
```

Report:

```text
area;
finding;
reproduction;
expected vs actual behavior;
Fireseed gate impact.
```

## Track 3: Evidence And Governance Review

Goal:

```text
Can reviewers find where the evidence model misleads agents, punishes honest adopters, or allows abuse?
```

Minimum task list:

```text
review S1 first-party evidence boundaries;
review S2 organization-submitted third-party material and route gaps;
review S3 random purchase / sampling, bounded pools, nullifiers, storage roles, and anti-brushing limits;
review S4/S5 design-preview wording for overclaiming;
review Directory and Beacon capture risks;
review commercial-fit boundaries for price disclosure, signed quotes, and marketplace capture.
```

Questions to answer:

```text
What misleading confidence could a weak organization create?
What honest organization burden is too high?
What should a low-cost AI agent see earlier?
What should be downgraded from PASS to WARN, candidate, design preview, or manual check?
What should remain outside OrgAnchor's authority?
```

Feedback goes to:

```text
GitHub issue template: Evidence / Governance Review
```

Report:

```text
source layer or governance area;
concrete scenario;
failure mode;
desired AI-agent output;
proposed constraint or improvement;
Fireseed gate impact.
```

## Optional Track: AI-Agent Or Directory Builder

Goal:

```text
Can an external agent or directory builder discover, filter, query, and verify candidates without treating OrgAnchor as a trust authority?
```

Minimum task list:

```text
run npm run agent:demo;
inspect beacon sweep NDJSON;
build a local Beacon index;
query by need and capability;
review candidate explanations and risk gaps;
perform direct origin verification before any trust decision;
check whether commercial-fit fields would reduce useless candidate review.
```

Useful commands:

```bash
npm run agent:demo
organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson
organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
organchor beacon query --index beacon-index.json --need "identity continuity support" --limit 10
organchor verify url https://example.org --compact
```

Feedback may use either:

```text
Technical Review / Fireseed
Evidence / Governance Review
```

Choose based on whether the issue is implementation-level or model/governance-level.

## What Counts As Useful Feedback

Useful feedback is concrete.

Good:

```text
This command failed with this output.
This JSON field was ambiguous to my agent.
This S3 record could be gamed by this scenario.
This onboarding step required private context.
This page looked like endorsement even though it should not.
This commercial-fit state would have saved a useless inquiry.
```

Not useful enough:

```text
Looks interesting.
Needs more decentralization.
Needs a better UI.
This should be blockchain-based.
I do not trust this.
```

Those may be valid opinions, but Fireseed needs concrete reproduction, scenario, or protocol friction.

## Success Criteria

Fireseed outreach succeeds when:

```text
a technical outsider can reproduce the core verification loop;
one real or realistic adopting organization can complete the package flow;
reviewers can distinguish identity verification from trust decisions;
reviewers can see S1-S3 strengths and gaps;
S4/S5 are understood as design previews;
commercial-fit gaps are recognized without expanding into marketplace scope;
feedback produces actionable issues or pull requests.
```

## Failure Or Hold Criteria

Pause or narrow outreach if:

```text
public self-pilot verification fails;
the package cannot be installed or run by outsiders;
the /verify page implies OrgAnchor endorsement;
compact agent output hides identity, evidence, or policy-route failures;
S3 missing gates look stronger than they are;
reviewers cannot find the right issue path;
participants repeatedly expose secrets by following unclear instructions.
```

## Copyable Short Invitation

English:

```text
OrgAnchor is in Fireseed Alpha. It helps organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so external AI agents and people can discover, screen, verify, understand, and compare candidate organizations at lower cost without treating OrgAnchor as a trust authority.

We are looking for a small number of named early reviewers: adopting organizations, technical reviewers, and evidence/governance critics. The goal is not endorsement or promotion. The goal is to find concrete friction, misleading outputs, abuse cases, and missing boundaries before v1.

Start here:
https://github.com/OrgAnchor/OrgAnchor/blob/main/FIRESEED_OUTREACH_KIT.md
```

Chinese:

```text
OrgAnchor 现在处于 Fireseed Alpha 阶段。它帮助组织发布经过签名、可复查的公开资料，将身份、官方入口、主张、证据和迁移历史串联起来，使外部 AI Agent 和人能够以更低成本发现、初筛、验证、理解和比较候选组织，同时不把 OrgAnchor 当成最终信任权威。

我们正在邀请少量具名早期验证者：试用组织、技术审查者、证据/治理批评者。目标不是背书或宣传，而是在 v1 之前找出真实摩擦、误导性输出、滥用场景和缺失边界。

从这里开始：
https://github.com/OrgAnchor/OrgAnchor/blob/main/FIRESEED_OUTREACH_KIT.md
```

## Privacy And Secret Safety

Never ask participants to post:

```text
private keys;
recovery codes;
provider tokens;
wallet files;
payment data;
customer-private data;
confidential evidence;
unpublished commercial quotes.
```

If a finding requires private material, ask for a minimized synthetic reproduction instead.
