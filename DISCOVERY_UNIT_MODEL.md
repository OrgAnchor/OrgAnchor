# Discovery Unit Model

Status: Accepted design model. Not yet fully implemented in schemas or Directory records.

## Purpose

OrgAnchor does not define a universal real-world product granularity.

That would fail immediately:

```text
one organization's product may be another organization's component;
a car can be grouped into systems, assemblies, parts, subparts, and replaceable units;
a bearing supplier may expose product families, hundreds of models, custom variants, batches, and units;
a SaaS supplier may expose capabilities, service families, plans, APIs, regions, and customer-specific deployments.
```

However, AI agents still need a default object for low-cost discovery.

The Discovery Unit solves this problem.

## Definition

A Discovery Unit is:

```text
the default machine-readable product/service object that an external AI agent should search, compare, and pre-check before drilling into exact models, variants, batches, units, plans, or service deliveries.
```

It is not necessarily:

```text
a legal product definition
a factory SKU
a bill-of-material unit
a marketplace listing
a certificate scope
a final procurement object
```

It is a discovery object, optimized for matching demand to supply at low cost.

## Default Granularity

Recommended default hierarchy:

```text
organization
  -> capability
    -> Discovery Unit
      -> Featured Sellable Unit
      -> Coverage / Availability Profile
      -> model / plan / variant / batch / lot / deployment / service delivery / unit drilldown
```

Recommended default Discovery Unit level:

```text
product or service family
```

Reason:

```text
capability is usually too broad;
model/SKU is often too fragmented;
product/service family is usually specific enough for discovery and broad enough to avoid index explosion.
```

This is a recommendation, not a hard protocol rule.

Some organizations may use a model-level Discovery Unit when one model is the meaningful product. Others may use a service-line Discovery Unit when the offering is custom or project-based.

## Default Operator Guidance

An adopting organization should start with:

```text
1 to 7 Discovery Units
```

This is not a protocol limit. It is a maintenance guideline.

The organization should choose units that are:

```text
important to its public value proposition;
stable enough to maintain;
distinct enough to match different buyer needs;
backed by at least minimal claims and evidence;
not merely a full dump of every SKU, configuration, or marketing page.
```

## Three-Layer Discovery Structure

The recommended discovery structure has three layers.

```text
Discovery Unit
  = product/service-family-level discovery object

Featured Sellable Unit
  = the concrete product model, service plan, package, or offering the organization most wants to be found for

Coverage / Availability Profile
  = a lightweight description of what else the Discovery Unit may cover, without dumping every SKU into Directory records
```

Reason:

```text
Discovery Unit alone may be too broad.
Featured Sellable Units alone may miss real matches that are not currently featured.
Coverage Profile prevents both over-drilldown and false negatives.
```

Recommended structure:

```json
{
  "unit_id": "needle-bearing-nk-series",
  "name": "NK series needle roller bearings",
  "featured_units": [
    {
      "featured_unit_id": "nk12-16",
      "subject_type": "product_model",
      "subject_id": "NK12/16",
      "name": "NK12/16 needle roller bearing",
      "featured_reason": "organization_featured",
      "disclosure_maturity": "M2_CLAIM_BACKED"
    }
  ],
  "coverage_profile": {
    "coverage_mode": "parametric_range",
    "parameters": {
      "inner_diameter_mm": { "min": 10, "max": 60 },
      "outer_diameter_mm": { "min": 14, "max": 80 },
      "material": ["GCr15", "stainless_steel"],
      "temperature_class": ["standard", "high_temperature"]
    },
    "catalog_url": "https://example.org/catalog/nk-series.json",
    "catalog_hash": "sha256:<hash>"
  }
}
```

### Featured Sellable Units

A Featured Sellable Unit is a concrete offer window.

It is where the organization says:

```text
This is one of the specific products or services we most want agents to notice now.
```

It may be:

```text
product model
variant
service plan
API package
standard project package
dataset product
batch or unit for high-value goods
```

Recommended default:

```text
1 to 5 Featured Sellable Units per Discovery Unit
3 to 15 Featured Sellable Units per organization
```

This is guidance, not a protocol limit.

Avoid ambiguous labels:

```text
organization_featured = selected by the organization as a current focus
best_selling_claimed = organization claims it is a best seller
best_selling_evidence_backed = best-selling status has evidence support
strategic_focus = organization says this is a strategic offer
new_release = organization says this is newly released
```

OrgAnchor should not treat `organization_featured` as a quality claim.

### Coverage / Availability Profile

Coverage Profile prevents "not featured" from meaning "not offered."

Recommended coverage modes:

```text
closed_catalog = fixed known list of models/services
partial_catalog = common or representative items only
dynamic_catalog = catalog changes and should be fetched from a signed or hashed catalog
parametric_range = match by dimensions, rating, material, region, protocol, performance band, or other parameters
custom_configured = supplier can configure or build for a stated requirement
project_based = service or product is delivered per project
not_catalogued = no useful coverage profile is exposed yet
```

Agent interpretation:

```text
featured hit = strong discovery candidate
coverage hit but not featured = possible candidate; drill down only if worth the cost
Discovery Unit hit only = weak candidate
explicit exclusion = likely no match
unknown coverage = low-priority candidate unless other evidence is strong
```

## Required Shape

Recommended minimal Discovery Unit fields:

```json
{
  "unit_id": "needle-bearing-nk-series",
  "name": "NK series needle roller bearings",
  "description": "Needle roller bearings for compact radial load applications.",
  "subject_type": "product_family",
  "subject_scope": {
    "capability_tags": ["precision_bearings", "needle_roller_bearings"],
    "category": "industrial_components",
    "regions": ["EU", "US"],
    "languages": ["en"],
    "intended_use_summary": "Compact bearing applications where radial space is limited."
  },
  "coverage_preview": {
    "match_granularity": "product_family",
    "coverage_level": "family_broad",
    "catalog_mode": "partial_list",
    "included_models": ["NK10/12", "NK12/16", "NK15/16"],
    "excluded_scope": ["high-temperature series", "custom automotive steering assemblies"],
    "exact_model_match_available": true,
    "requires_drilldown_for": ["exact model", "variant", "batch", "unit"]
  },
  "verification_entry": {
    "origin": "https://example.org",
    "verify_url": "https://example.org/verify/"
  },
  "evidence_summary": {
    "claims": 3,
    "s1_count": 2,
    "s2_count": 1,
    "s3_count": 0,
    "s4_count": 0,
    "s5_count": 0
  },
  "limitations": [
    "Discovery Unit is a family-level object.",
    "Exact procurement requires model, variant, and batch-level review."
  ]
}
```

## Disclosure Maturity

The three-layer structure increases maintenance work. OrgAnchor must not require every organization to prove every product and service on day one.

Therefore each Discovery Unit and Featured Sellable Unit should declare disclosure maturity.

Recommended levels:

```text
M1_DISCOVERABLE
M2_CLAIM_BACKED
M3_EVIDENCE_BACKED
```

### M1 Discoverable

Meaning:

```text
The unit is visible to agents.
The organization says it offers or may offer this product/service family or featured unit.
Claims and evidence may be absent or minimal.
```

Minimum:

```text
unit id
name
subject type
capability tags
basic coverage or featured status
verification entry
limitations
not_a_trust_decision
```

Agent interpretation:

```text
candidate only
do not treat as claim support
request claims/evidence before procurement or high-risk use
```

### M2 Claim-Backed

Meaning:

```text
The unit has explicit claims, scopes, applicability, and limitations.
Evidence may still be first-party, incomplete, or weak.
```

Minimum:

```text
M1 fields
claim_refs
claim_scope
limitations
applicability
excluded scope where known
```

Agent interpretation:

```text
the organization is clear about what it claims;
the agent still needs evidence strength before relying on the claim.
```

### M3 Evidence-Backed

Meaning:

```text
The unit has claims linked to evidence and audit summaries.
Evidence may include S1/S2/S3/S4/S5 records depending on purpose.
```

Minimum:

```text
M2 fields
evidence_refs
evidence_summary
value audit status
health status
known gaps
```

Agent interpretation:

```text
ready for external policy review;
not automatically trusted;
fetch full claims/evidence for material decisions.
```

Critical rule:

```text
M1 must not look like M3.
Discovery visibility must not be presented as proof.
```

## Coverage Preview

Coverage preview is mandatory for low-cost AI-agent discovery.

Without it, a Directory result can waste agent time:

```text
Agent needs model NK12/16.
Directory returns a bearing-family candidate.
Agent fetches full package.
Only after drilling down does it discover NK12/16 is not offered or not covered.
```

If this happens often, agents will stop trusting OrgAnchor discovery as a useful cost reducer.

Therefore each Discovery Unit should expose enough preview data to classify the match before full drilldown.

Recommended coverage fields:

```text
match_granularity
coverage_level
catalog_mode
included_models / included_services
excluded_scope
exact_model_match_available
model_catalog_url or model_catalog_path
model_catalog_hash
requires_drilldown_for
not_offered_hints
custom_configuration_available
minimum_order_or_project_constraints when relevant
```

Recommended `coverage_level` values:

```text
exact = the unit directly covers the requested model/service object
family_broad = the unit covers a family; exact object requires drilldown
capability_only = the unit only states a broad capability
custom_configured = the supplier may support the need through custom configuration
not_offered = the unit explicitly excludes the requested object or class
unknown = the preview is insufficient
```

Recommended `catalog_mode` values:

```text
closed_list = listed models/services are intended to be complete
partial_list = listed models/services are examples or common offerings
dynamic_catalog = catalog changes often and should be fetched from a signed or hashed catalog
custom_configured = offerings are configured per project or buyer
not_catalogued = no model/service catalog is exposed yet
```

## Agent Matching Classes

A Directory or agent should not treat all Discovery Unit matches equally.

Recommended first-pass match classes:

```text
EXACT_UNIT_MATCH
FAMILY_REVIEW_REQUIRED
CAPABILITY_ONLY_MATCH
CUSTOM_CONFIGURATION_POSSIBLE
LIKELY_NO_MATCH
UNKNOWN_COVERAGE
```

Meaning:

| Match class | Meaning | Agent action |
| --- | --- | --- |
| `EXACT_UNIT_MATCH` | Preview says the requested model/service is covered | Fetch and verify the exact unit/package |
| `FAMILY_REVIEW_REQUIRED` | Family looks relevant, but exact object needs drilldown | Fetch only if candidate count is low or evidence is strong |
| `CAPABILITY_ONLY_MATCH` | Broad capability match only | Treat as weak discovery lead |
| `CUSTOM_CONFIGURATION_POSSIBLE` | Supplier may support it through custom work | Ask or fetch service/project evidence |
| `LIKELY_NO_MATCH` | Preview excludes requested object | Do not drill down unless there is another reason |
| `UNKNOWN_COVERAGE` | Preview is insufficient | Penalize discovery usefulness; request better coverage metadata |

## Directory Boundary

Directory nodes should index:

```text
organizations
capabilities
Discovery Units
coverage previews
verification pointers
evidence summaries
health summaries
```

Directory nodes should not default to indexing:

```text
every SKU
every batch
every unit
every raw evidence file
every product image or video
```

Fine-grained catalogs should remain at the organization origin or a dedicated catalog file, referenced by hash or signed manifest.

## Subject Binding Rule

Discovery Units do not replace claim/evidence subject binding.

Rules:

```text
A Discovery Unit helps an agent find a candidate.
Claims still need their own subject scope.
Evidence still needs to declare which subject it supports.
S1/S2/S3/S4/S5 records must not be widened beyond their declared subject.
```

Examples:

```text
series-level S2 certificate -> can support series-level claims only if scope says so
one model test -> cannot support the whole product family automatically
one batch inspection -> cannot support all future batches automatically
one customer deployment record -> cannot prove all deployments
```

## Examples

Robotics:

```text
Capability: industrial_robotics
Discovery Unit: six-axis-collaborative-robots
Models: CR-10, CR-20, CR-20-food-grade
```

Bearings:

```text
Capability: precision_bearings
Discovery Unit: needle-roller-bearing-nk-series
Models: NK10/12, NK12/16, NK15/16
```

Automotive components:

```text
Capability: automotive_components
Discovery Unit: steering-column-needle-bearings
Models: SC-NK-12, SC-NK-14
```

SaaS/API:

```text
Capability: identity_verification
Discovery Unit: signed-endpoint-verification-api
Plans: open-source-cli, hosted-api, enterprise-support
```

Professional service:

```text
Capability: compliance_audit
Discovery Unit: supplier-security-review
Service plans: remote-review, onsite-review, annual-monitoring
```

## Success Criteria

This model succeeds if an external AI agent can answer before expensive drilldown:

```text
What does this organization appear to offer?
At what granularity is the offer described?
Does this Discovery Unit likely cover my exact model, service, region, or use case?
If not exact, what drilldown is required?
What is explicitly excluded?
Where is the signed verification package?
What evidence summary exists for this unit?
Is fetching the full package likely worth the cost?
```

It fails if:

```text
Directory search returns broad candidates that hide non-coverage until late drilldown;
organizations dump every SKU into discovery records;
family-level evidence is silently treated as model-level proof;
agents cannot distinguish exact matches from broad capability leads;
OrgAnchor becomes a product marketplace instead of a verifiable discovery layer.
```
