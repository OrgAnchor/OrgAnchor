# Commercial Fit Layer

Status: Accepted design direction, not implemented as CLI commands.

## Purpose

OrgAnchor's north star is to lower transaction cost, not only verification cost.

Identity, discovery, claims, and evidence can make an organization easier to verify. They do not by themselves answer a practical buyer question:

```text
Is this candidate commercially worth contacting for this need?
```

The Commercial Fit Layer defines how price, quotation, lead time, minimum order, region, validity, and commercial constraints should become inspectable without forcing every organization to publish sensitive prices.

This layer must not turn OrgAnchor into:

```text
a marketplace;
a price comparison site;
a procurement platform;
a fairness judge for pricing;
a paid ranking system;
a broker between buyers and sellers.
```

It should only make commercial-fit facts easier for external agents to fetch, verify, and route into their own budget or procurement policy.

OrgAnchor is not a marketplace. Commercial fit must remain a verification and routing aid, not a venue for brokering or ranking deals.

## Core Principle

OrgAnchor should expose commercial suitability signals, not force universal price disclosure.

Valid:

```text
public price-band disclosure;
public signed price sheet;
private signed quote;
quote validity and scope;
lead-time and minimum-order signals;
commercial-contact and response-time signals.
```

Invalid:

```text
required public prices for all adopters;
OrgAnchor ranking suppliers by cheapest price;
OrgAnchor judging whether a price is fair;
Directory paid placement disguised as commercial fit;
turning missing price into evidence of fraud.
```

## Why Price Belongs In The System

An external AI agent can spend real time and tokens verifying an organization, its identity, its evidence, and its discovery record. If the candidate is later found to be completely outside budget, minimum-order, region, or lead-time constraints, that work was partially wasted.

Commercial fit reduces this waste by letting an agent answer earlier:

```text
continue verification;
ask for quote;
skip for budget mismatch;
skip for lead-time mismatch;
skip because region, MOQ, or contract conditions do not fit.
```

Commercial fit is therefore part of transaction-cost reduction.

## Disclosure Modes

Use a small set of states instead of forcing one pricing style.

| State | Meaning |
| --- | --- |
| `PRICE_NOT_DISCLOSED` | No public price signal is provided. The agent may request a quote if other signals justify it. |
| `PRICE_BAND_DISCLOSED` | A public approximate range, minimum order, or commercial threshold is disclosed for first-pass filtering. |
| `PUBLIC_PRICE_SHEET` | A public signed price sheet exists and can be checked for scope, currency, validity, and signature. |
| `SIGNED_PRIVATE_QUOTE` | A non-public quote was signed for a specific request, buyer, scope, or negotiation context. |
| `PRICE_STALE_OR_EXPIRED` | A price signal exists but is outside its declared validity window or has been superseded. |

Missing public price is not a protocol failure. It is a commercial-fit gap.

## Public Commercial Signals

Organizations may publish coarse public fields to reduce useless contact.

Recommended fields:

```json
{
  "commercial_fit": {
    "status": "PRICE_BAND_DISCLOSED",
    "pricing_model": "fixed | unit | subscription | usage | project | retainer | custom_quote",
    "currency": "USD",
    "price_band": {
      "min": 5000,
      "max": 20000,
      "unit": "project"
    },
    "minimum_order": {
      "amount": 100,
      "unit": "units"
    },
    "lead_time": {
      "min_days": 14,
      "max_days": 45
    },
    "regions": ["US", "EU"],
    "valid_from": "2026-06-01T00:00:00Z",
    "valid_until": "2026-09-01T00:00:00Z",
    "quote_response_time": "3 business days",
    "included": ["standard support"],
    "excluded": ["tax", "shipping", "custom tooling"],
    "limitations": ["Final price depends on scope and availability."]
  }
}
```

These fields are not proof of final deal terms. They are public routing hints.

## Public Signed Price Sheet

Some organizations can publish public price sheets, especially for:

```text
SaaS plans;
standard components;
standard consulting packages;
published service tiers;
support contracts;
training packages.
```

Suggested artifacts:

```text
pricing/pricing-sheet.json
pricing/pricing-sheet.json.sig
```

A public price sheet should declare:

```text
price_sheet_id;
issued_at;
valid_from;
valid_until;
currency;
region;
tax and shipping treatment;
applicable product_id, service_id, discovery_unit_id, or claim_id;
included and excluded scope;
supersedes / superseded_by when changed;
signature by root authority or delegated commercial key.
```

OrgAnchor should verify structure, signature, hash, validity window, and subject binding. It should not decide whether the price is good.

## Private Signed Quote

For custom manufacturing, B2B services, confidential enterprise deals, and negotiated contracts, public pricing may be inappropriate.

The preferred path is a signed private quote.

Conceptual flow:

```text
buyer or buyer-agent sends request-for-quote;
organization returns signed quote;
buyer-agent verifies the quote against the organization's root authority chain or delegated commercial key;
quote remains private unless the parties choose otherwise.
```

Suggested quote fields:

```json
{
  "type": "OrgAnchorSignedQuote",
  "version": "0.1",
  "quote_id": "quote-2026-001",
  "rfq_hash": "sha256:<hash-of-request>",
  "issued_at": "2026-06-02T00:00:00Z",
  "valid_until": "2026-06-16T00:00:00Z",
  "seller": {
    "organization_name": "Example Organization",
    "root_authority_hash": "sha256:<root-authority-hash>"
  },
  "subject": {
    "subject_type": "product_model",
    "subject_id": "model-x1"
  },
  "commercial_terms": {
    "currency": "USD",
    "unit_price": 120,
    "minimum_order_quantity": 100,
    "lead_time_days": 30,
    "payment_terms": "50% deposit, 50% before shipment",
    "included": ["standard packaging"],
    "excluded": ["tax", "shipping", "import duties"],
    "limitations": ["Valid only for the stated specification and quantity."]
  },
  "signature_authority": {
    "authority_type": "delegated_commercial_key",
    "authority_id": "commercial-2026"
  }
}
```

The private quote does not need to be public to be useful. The buyer's agent only needs to verify that the quote was authorized by the organization.

## Authority Boundary

The organization root authority should not sign high-frequency quotes directly.

Recommended authority chain:

```text
root authority
  -> delegates commercial authority
      -> signs public price sheets or private quotes
```

This follows the same risk boundary as product/service operational keys:

```text
root authority = long-term identity and delegation root;
commercial key = revocable operational authority for pricing and quotation;
quote signature = proof that this commercial document came from an authorized channel.
```

If a commercial key is compromised, the organization should publish a signed revocation or replacement statement. Historical quote verification should show the key state at issuance time and the current revocation status.

## Agent Interpretation

An external agent may use commercial-fit data to:

```text
filter candidates before deep verification;
decide whether to request a quote;
detect stale price sheets;
verify that a private quote came from an authorized seller channel;
compare commercial constraints against its own budget and procurement policy.
```

An external agent must not infer:

```text
cheap means trustworthy;
expensive means high quality;
missing public price means fraud;
OrgAnchor approved the price;
Directory rank means best commercial fit.
```

Preferred compact output direction:

```json
{
  "commercial_fit_summary": {
    "status": "PRICE_BAND_DISCLOSED",
    "price_signal": "PUBLIC_RANGE",
    "currency": "USD",
    "validity": "CURRENT",
    "budget_route": "EXTERNAL_BUDGET_POLICY",
    "quote_next_step": "REQUEST_SIGNED_QUOTE",
    "not_a_price_recommendation": true
  }
}
```

This summary is not a price recommendation. It is only a machine-readable route for the external agent's own budget and procurement policy.

## Directory Boundary

Directories may expose commercial-fit filters such as:

```text
pricing model;
price disclosed / not disclosed;
price band;
MOQ;
region;
lead time;
quote response time;
public price sheet availability;
signed private quote support.
```

Directories must not:

```text
turn cheapest price into default ranking;
hide paid placement inside commercial-fit ranking;
claim official commercial certification;
require public pricing as a condition of OrgAnchor compatibility;
store private quotes unless both parties explicitly choose that path.
```

Directory records should continue to point back to origin-owned OrgAnchor packages and direct-origin verification.

## Relationship To Evidence

Commercial fit is separate from evidence strength.

Examples:

```text
Strong evidence + too expensive = may be commercially unsuitable.
Weak evidence + cheap = still weak evidence.
No public price + strong evidence = may require quote, not rejection.
Expired price sheet + current signed quote = use the quote for that transaction context.
```

OrgAnchor should report both:

```text
value/evidence fit;
commercial fit.
```

External agents own the combined decision.

## Minimal Future Implementation

The smallest useful implementation should be:

```text
commercial fit schema;
public commercial-fit manifest;
signature support using root authority or delegated commercial key;
value/verify page inclusion;
compact agent commercial_fit_summary;
price-sheet validity checks;
private signed quote verification command.
```

Possible commands:

```bash
organchor commercial create
organchor commercial sign
organchor commercial verify
organchor commercial quote create
organchor commercial quote sign
organchor commercial quote verify
```

These commands are not Fireseed Alpha acceptance gates.

## Fireseed Boundary

Fireseed Alpha may proceed without implementing this layer.

However, the project should treat the Commercial Fit Layer as necessary for the full transaction-cost thesis. Without it, OrgAnchor reduces discovery and verification cost but leaves a major commercial-screening cost outside the protocol.

The correct Fireseed handling is:

```text
document the layer now;
do not expand scope before external review;
collect pilot feedback on which commercial fields matter most;
implement the smallest signed public-price and private-quote path after evidence/discovery feedback stabilizes.
```

## Acceptance Rule

This layer succeeds if:

```text
organizations are not forced to reveal sensitive prices;
agents can avoid obviously unsuitable candidates earlier;
signed public prices and signed private quotes can be verified;
stale or expired commercial data is visible;
commercial fit does not become a marketplace score or trust badge;
small serious organizations can participate without procurement paperwork overload.
```
