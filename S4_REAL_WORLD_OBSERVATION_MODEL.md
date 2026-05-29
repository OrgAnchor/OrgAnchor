# S4 Real-World Delivery And Use Observation Model

Status: Accepted design model. Not implemented in the alpha CLI yet. S4 is intentionally separated from S3 so random sample quality checks do not get confused with long-term delivery, usage, support, and supply-continuity observations.

## Purpose

S4 covers real-world delivery and use observations.

It answers questions such as:

```text
Did the organization keep delivering after the sale?
Were lead times stable?
Were quantities fulfilled?
Did quality remain stable across deliveries?
Did the service keep working in production?
Were support, warranty, repair, and correction processes responsive?
Did field performance match the organization's claims over time?
```

S4 is not a product sample test. Product or service object sample checks belong to S3.

## Boundary With S3

S3 and S4 must stay separate:

```text
S3 = real sample acquisition and sample test/inspection
S4 = real delivery, operation, usage, support, repair, and continuity observation
```

Examples:

| Scenario | Class |
| --- | --- |
| Buyer purchases one unit from retail and tests dimensions | S3 |
| Auditor randomly samples distributor inventory | S3 |
| Customer allows an installed unit to be inspected as a sample | S3 |
| Customer records 12 months of uptime, failures, repairs, and maintenance | S4 |
| Buyer records 18 purchase orders and on-time delivery outcomes | S4 |
| Warranty, return, and field failure rates across a time window | S4 |
| API monitoring over 30 days across regions | S4 |
| Incident, outage, correction, or recall response trail | S5 if challenged/disputed; S4 if ordinary operational observation |

S4 does not prove that every product unit is good. It shows how the organization performed in real delivery and use contexts.

## Core Position

S4 should be treated as an observation layer, not as a review system.

Bad S4:

```text
This supplier is great.
Five stars.
Very reliable.
```

Useful S4:

```text
For product_family X in EU orders from 2026-03-01 to 2026-05-31:
18 observed orders;
17 delivered on time;
1 partial delay of 6 days;
2 warranty issues;
1 issue corrected within SLA;
raw observation bundle hash sha256:...
```

S4 should expose facts, windows, limits, and source quality. It must not collapse into a single popularity score.

## Who Submits

S4 submitters should be parties that observed actual delivery, use, support, or operation.

Recommended submitter classes:

| Submitter | S4 meaning |
| --- | --- |
| Buyer or buyer agent | Observed real order, delivery, support, and acceptance outcomes. |
| Customer or operator | Observed real usage, failures, maintenance, uptime, returns, or support interactions. |
| Directory operator | Aggregated observations for organizations it lists or recommends. |
| Monitoring service | Observed API, SaaS, infrastructure, or service availability. |
| Repair, warranty, or maintenance provider | Observed failures, repairs, replacement behavior, or recurring issues. |
| Organization | May publish its own operational records and respond to external observations, but organization-only S4 is weaker. |

Responsibility rule:

```text
Who benefits from a supply-continuity or field-performance claim should help make the observation path possible.
```

Organizations should not be forced to publish every private operational detail. They should provide:

```text
product/service credential verification;
order or delivery record verification where privacy permits;
support for redaction;
response policy for negative observations;
permission and process for directory or buyer-agent observation.
```

## Storage

S4 raw data can be heavy and privacy-sensitive.

Examples:

```text
purchase orders;
delivery notes;
invoices;
acceptance records;
support tickets;
warranty claims;
repair logs;
usage telemetry;
monitoring logs;
incident reports;
customer communications;
redacted contracts.
```

Therefore S4 should use the same storage separation as S3:

| Layer | Content | Storage policy |
| --- | --- | --- |
| Public observation receipt | Subject, observer, window, metric summary, hash, vault pointer, limits | Public and small |
| Observation set summary | Aggregated orders, uptime, incidents, returns, support outcomes, time window | Public or semi-public |
| Raw observation bundle | Operational records, logs, tickets, invoices, telemetry, redacted contracts | Vault-managed, access-controlled |
| Anchor | Hashes of receipts, summaries, and bundle manifests | Public and small |

S4 raw bundles should usually live in Evidence Vaults or observer-controlled storage, not only in the evaluated organization's infrastructure.

Privacy boundary:

```text
S4 can be useful without publishing raw customer-identifying data.
Receipts and summaries should expose enough for agent screening.
Raw bundles may require authorization, redaction, or buyer-controlled access.
```

## Minimum Required Fields

A minimum S4 observation receipt should include:

```text
observation_id
observer_type
observer_id_or_origin
subject_type
subject_id
organization_root_or_credential_ref
observation_window
observation_context
metric_type
metric_summary
raw_bundle_hash
raw_bundle_locations_or_vaults
access_policy
limitations
created_at
```

For supply continuity, recommended minimum metrics are:

```text
order_count
on_time_delivery_count
delayed_delivery_count
partial_delivery_count
quality_issue_count
support_or_correction_count
major_incident_count
```

For SaaS/API/service continuity, recommended minimum metrics are:

```text
monitoring_window
regions_or_environments
availability_observations
incident_count
degraded_periods
support_response_observations
measurement_method
```

## Optional Extension Fields

Useful optional fields:

```text
buyer_segment
region
channel
batch_or_lot_refs
service_plan
deployment_id
contract_sla
lead_time_days_declared
lead_time_days_observed
acceptance_criteria
defect_rate
return_rate
warranty_rate
repair_time
support_response_time
reorder_rate
observer_signature
directory_review_signature
privacy_redaction_note
challenge_refs
correction_refs
```

These fields should be purpose-driven. OrgAnchor should not encourage organizations to fill endless optional fields for their own sake.

## Supply Continuity

S4 is the natural home for supply continuity evidence.

Supply continuity means:

```text
The organization has recent observable performance showing it can keep delivering the relevant product or service with acceptable quantity, timing, quality, and correction behavior.
```

It does not mean:

```text
future delivery is guaranteed;
all force majeure risks are removed;
every supplier in the chain is stable;
the buyer's exact future order will be fulfilled.
```

Recommended supply-continuity claim shape:

```json
{
  "claim_type": "supply_continuity",
  "subject_type": "product_family",
  "subject_id": "needle-roller-bearing-series-a",
  "region": ["EU", "US"],
  "time_window": "2026-03/2026-05",
  "declared_monthly_capacity": 50000,
  "declared_lead_time_days": 21,
  "observed_orders": 18,
  "on_time_delivery_rate": 0.94,
  "quality_issue_rate": 0.02,
  "major_incidents": 1,
  "limitations": [
    "Does not prove future supply under war, sanctions, natural disaster, supplier failure, or sudden demand spikes."
  ]
}
```

## Current Window And History

S4 should separate current decision support from historical trend.

```text
current window = recent observations that can support current screening;
history = trend, stability, incident, and correction record;
major incidents = longer retention and stronger preservation expectations.
```

Examples:

| Observation type | Current window | Historical value |
| --- | --- | --- |
| Order delivery performance | Recent 30-180 days, depending on cycle | Stability and degradation trend |
| SaaS/API uptime | Recent 7-30 days for current screening | Long-term reliability trend |
| Warranty and repair behavior | Recent product/service period | Recurring issue and correction trend |
| Industrial supply stability | Current batch, production window, or quarter | Supplier consistency and disruption history |

Old positive observations should not be used as current proof. They may show that the organization once performed well and whether it remained stable over time.

## Trust Meaning

S4 can support statements like:

```text
Within this window, these observed deliveries or usages had these outcomes.
Within this deployment, these incidents and support responses were recorded.
Within this buyer-agent observation set, these orders were delivered with these delays and defects.
```

S4 cannot by itself prove:

```text
future supply is guaranteed;
all customers have the same experience;
all product units meet the declared technical claim;
the organization is generally trustworthy;
the directory's ranking is correct.
```

S4 is strong when it has:

```text
specific subject binding;
recent observation window;
observer independence or buyer-side control;
raw bundle hash and vault availability;
clear metric definitions;
negative observations and corrections included;
organization response where relevant.
```

## Relation To S5

S4 ordinary observations can become S5 when they are disputed, negative, challenged, corrected, or used as public contradiction.

Examples:

```text
ordinary delayed shipment metric -> S4;
public claim that supplier repeatedly misses declared lead time -> S5 challenge;
isolated field failure observation -> S4;
unresolved pattern of failures contradicting a product claim -> S5;
organization correction, recall, withdrawal, or response -> S5 correction lifecycle.
```

S4 should feed S5, but it should not replace S5.

## Implementation Direction

Future implementation should add:

1. `evidence s4 template` for order delivery, SaaS/API monitoring, warranty/repair, and field-use observation.
2. `evidence s4 attach` for adding S4 metadata to evidence items.
3. Value-audit S4 summary fields:
   - effective_s4_count
   - candidate_unverified_observation_count
   - current_window_observation_count
   - historical_observation_count
   - raw_bundle_available_count
   - missing_subject_binding_count
   - top_s4_gaps
   - next_actions
4. Agent compact output that separates S3 sample quality from S4 delivery/use continuity.
5. Directory fields for current observation health and supply-continuity summaries.

## Success Criteria

S4 succeeds if an external AI agent can answer:

```text
What real delivery or use context was observed?
Which organization/product/service subject does it bind to?
What time window does it cover?
What metrics were observed?
Who observed it?
Where is the raw bundle or its vault receipt?
Is this current decision support or only historical trend?
What remains unknown before making a transaction decision?
```

S4 fails if it becomes:

```text
a review score;
a vague testimonial;
a marketing case study;
a hidden ranking factor;
a replacement for S3 product sampling;
a claim that old performance guarantees future delivery.
```
