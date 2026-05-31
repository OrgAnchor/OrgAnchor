# Observation Routing Guide

Status: Accepted guidance for S3/S4 routing. The first CLI route command is implemented; route-specific observation templates remain future work.

## Purpose

Organizations should not have to understand every S3/S4 detail before publishing useful observation records.

This guide defines a low-friction routing rule for tools, AI assistants, and human operators:

```text
S3 = sample conformance
S4 = performance continuity
```

Chinese shorthand:

```text
S3 看“物/样本/交付物本身是否符合主张”
S4 看“一段时间内是否持续兑现交付、使用、维护、供给承诺”
```

OrgAnchor should not pretend that routing can be perfect. The correct model is:

```text
rule-based recommendation;
user confirmation;
uncertainty exposed;
audit can later flag obvious mismatch;
AI assistants may help explain, but are not trust roots.
```

## Route Values

Recommended route values:

```text
S3_RECOMMENDED
S4_RECOMMENDED
MIXED_S3_S4
ROUTING_UNCLEAR
```

Meaning:

| Route | Meaning |
| --- | --- |
| S3_RECOMMENDED | The record is mainly about a concrete sample, batch, unit, test specimen, API probe, or project deliverable conforming to a stated claim. |
| S4_RECOMMENDED | The record is mainly about delivery, operation, usage, support, repair, uptime, supply, or service continuity over a time window. |
| MIXED_S3_S4 | The material contains both sample conformance and continuity information. Split it into separate S3 and S4 records when possible. |
| ROUTING_UNCLEAR | The material is too vague, promotional, incomplete, or ambiguous. Ask for a clearer subject, time window, method, and intended claim. |

## Primary Decision Rule

Ask these questions in order:

```text
1. Is the claim about a concrete sample, batch, unit, delivered artifact, test specimen, API probe, or acceptance item itself meeting a standard, specification, or declared property?
   If yes, route to S3.

2. Is the claim about performance over time: delivery reliability, lead time, uptime, field failures, maintenance, repair, support, warranty, returns, or continued supply?
   If yes, route to S4.

3. Does the material contain both?
   If yes, route to MIXED_S3_S4 and split the record.

4. Is the material only a broad marketing statement, testimonial, case story, or vague quality claim?
   If yes, route to ROUTING_UNCLEAR.
```

Short rule:

```text
thing itself -> S3
ongoing behavior over time -> S4
both -> split
vague -> unclear
```

## What Tools Should Ask

An OrgAnchor tool or AI assistant should ask for the minimum needed to route:

```text
What exact subject is this about?
Is this about a concrete sample or a time window?
What method or observation produced the result?
Who selected or observed it?
Does it include delivery/use/support history?
What claim should it support?
```

The tool should avoid asking users to pick S3 or S4 as a first step.

## CLI Route Output Contract

CLI command:

```bash
organchor evidence observe route --text "Recent 90 day on-time delivery for model-x1 orders"
```

Recommended JSON output:

```json
{
  "type": "OrgAnchorObservationRouteResult",
  "version": "1.0",
  "recommended_route": "S4_RECOMMENDED",
  "routing_confidence": "medium",
  "routing_reasons": [
    "mentions a time window",
    "mentions delivery continuity"
  ],
  "detected_subject_hints": [
    "model-x1"
  ],
  "missing_information": [
    "observer identity",
    "exact order count",
    "raw evidence location or vault"
  ],
  "suggested_next_command": "organchor evidence observe template --route S4_RECOMMENDED",
  "user_confirmation_required": true,
  "not_a_trust_decision": true
}
```

Recommended fields:

```text
type
version
recommended_route
routing_confidence
routing_reasons
detected_subject_hints
missing_information
suggested_next_command
user_confirmation_required
not_a_trust_decision
```

Recommended `routing_confidence` values:

```text
high
medium
low
```

Confidence is not evidence strength. It only describes confidence in the S3/S4 route suggestion.

## 24 Routing Examples

### Clear S3

| # | Scenario | Route | Reason |
| ---: | --- | --- | --- |
| 1 | A buyer randomly purchases one bearing model and measures dimensional tolerance. | S3_RECOMMENDED | Concrete market sample is tested against a specification. |
| 2 | An auditor selects five units from distributor inventory and tests hardness. | S3_RECOMMENDED | Sample acquisition and sample conformance. |
| 3 | A batch of custom-machined parts passes buyer acceptance testing before shipment. | S3_RECOMMENDED | Delivered artifacts are tested against acceptance criteria. |
| 4 | A customer-site installed device is inspected as a single physical sample. | S3_RECOMMENDED | The installed unit is being sampled, not its long-term usage history. |
| 5 | A lab tests one API endpoint response against a declared schema at a given time. | S3_RECOMMENDED | One concrete service probe is tested for conformance. |
| 6 | A production lot sample fails the declared thermal tolerance test. | S3_RECOMMENDED | Lot-level sample result about the item itself. |

### Clear S4

| # | Scenario | Route | Reason |
| ---: | --- | --- | --- |
| 7 | A buyer records 18 orders over 90 days and reports 17 on-time deliveries. | S4_RECOMMENDED | Delivery performance over a time window. |
| 8 | A customer records 12 months of uptime, failures, repairs, and maintenance for installed equipment. | S4_RECOMMENDED | Field-use continuity and maintenance history. |
| 9 | An API monitor records availability and latency across 30 days and three regions. | S4_RECOMMENDED | Service continuity over time. |
| 10 | Warranty records show return and repair rates for a product family over one quarter. | S4_RECOMMENDED | Warranty and repair pattern over a time window. |
| 11 | A logistics buyer tracks partial shipments, late shipments, and replacement behavior for repeated orders. | S4_RECOMMENDED | Supply and correction continuity. |
| 12 | A repair provider reports recurring field failures and average repair time for deployed units. | S4_RECOMMENDED | Field operation and support behavior. |

### Mixed, Split Into S3 And S4

| # | Scenario | Route | Reason |
| ---: | --- | --- | --- |
| 13 | A custom project passed final acceptance tests and the supplier also provided six months of maintenance. | MIXED_S3_S4 | Acceptance test is S3; maintenance history is S4. |
| 14 | A buyer sampled 10 units from recent shipments and also measured on-time delivery across those shipments. | MIXED_S3_S4 | Unit conformance is S3; shipment continuity is S4. |
| 15 | A SaaS provider publishes one API schema test plus 30-day uptime metrics. | MIXED_S3_S4 | Probe conformance is S3; uptime history is S4. |
| 16 | A field device inspection includes one teardown test and 18 months of failure logs. | MIXED_S3_S4 | Teardown sample is S3; field logs are S4. |
| 17 | A supplier provides a buyer-witnessed batch test and a quarterly defect/return trend. | MIXED_S3_S4 | Batch test is S3; trend is S4. |
| 18 | A directory publishes blind sample test results and rolling delivery health for the same product family. | MIXED_S3_S4 | Sample set is S3; rolling delivery health is S4. |

### Unclear Or Needs More Information

| # | Scenario | Route | Reason |
| ---: | --- | --- | --- |
| 19 | "Our products are reliable and trusted by many customers." | ROUTING_UNCLEAR | Promotional statement; no subject, method, sample, or time window. |
| 20 | "A famous customer used our product successfully." | ROUTING_UNCLEAR | Could be case study, S4, or testimonial; details missing. |
| 21 | "Quality has been verified internally." | ROUTING_UNCLEAR | No sample identity, method, selector, or result. |
| 22 | "We have long-term cooperation with several clients." | ROUTING_UNCLEAR | Could become S4 if orders, windows, and outcomes are disclosed. |
| 23 | "This model is better than competitors." | ROUTING_UNCLEAR | Comparative claim needs specific metric, sample/method, and scope. |
| 24 | "Our factory can handle urgent orders." | ROUTING_UNCLEAR | Could become S4 supply-continuity evidence if backed by observed orders and lead times. |

## Common Edge Cases

### Customer-Site Evidence

Customer site does not decide the route by itself.

```text
customer-site unit sampled and tested -> S3
customer-site unit observed over months of use -> S4
```

### Custom Project Evidence

Custom projects often require both routes:

```text
acceptance test for the delivered artifact -> S3
schedule, change handling, support, maintenance, and correction history -> S4
```

### SaaS And API Evidence

```text
single API conformance probe -> S3
continuous uptime, latency, incident, or support monitoring -> S4
```

### Private Or Confidential Customer Work

Confidentiality does not change the route.

```text
private acceptance sample -> S3 with redacted/vaulted raw bundle
private delivery continuity record -> S4 with redacted/vaulted raw bundle
```

### Organization-Only Records

Organization-only records can be useful but weaker:

```text
organization-chosen sample -> weak S3 or candidate S3
organization-only delivery statistics -> weak S4 unless supported by buyer, directory, monitor, or vault review
```

## Tooling Policy

OrgAnchor should be:

```text
tool-first, not tool-only;
core-first, not interface-first.
```

The recommended path:

```text
template -> AI/user fill -> validate -> audit -> sign -> publish
```

Manual JSON remains allowed because OrgAnchor is an open protocol, but manual records should still pass schema validation, hash binding, signature checks, and value audit before being treated as high-quality records.

Future tools should route observations before asking users to pick S3 or S4:

```bash
organchor evidence observe route --text "..."
organchor evidence observe template --route S3_RECOMMENDED
organchor evidence observe template --route S4_RECOMMENDED
```

## Success Criteria

This guide succeeds if:

```text
ordinary organizations can describe what they want to prove without first learning S3/S4 terminology;
AI assistants can classify most ordinary cases using the 24 examples;
ambiguous cases are routed to MIXED_S3_S4 or ROUTING_UNCLEAR instead of forced into a wrong bucket;
audit tools can later flag obvious mismatch.
```

It fails if:

```text
S3 becomes a review system;
S4 becomes generic marketing;
sample tests are misread as supply continuity;
delivery history is misread as product conformance;
users must manually guess protocol categories before they can start.
```
