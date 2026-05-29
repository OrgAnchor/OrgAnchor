# Product And Service Credential Layer

Status: Accepted design direction, not yet implemented.

## Purpose

The product and service credential layer binds real-world products, service deliveries, observations, complaints, tests, and corrections back to the adopting organization's root authority without using the root private key for high-frequency operational signing.

This layer is part of the broader P/S/C model in `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`: purpose profiles define intended use, observation source classes describe evidence origin, and challenge/correction lifecycle records disputes and updates over time.

It exists to close a critical gap in value evidence:

```text
An observation is useful only if the observed object can be linked to the organization, product model, batch, service delivery, or project it claims to describe.
```

Without this layer, positive or negative evidence can be misattributed, intentionally or accidentally.

## Core Rule

The organization root authority remains the final identity anchor, but it should not directly sign every product label, service event, observation record, or customer artifact.

Instead:

```text
Root authority
  -> delegated key statement
    -> product or service credential
      -> observation, test, complaint, repair, acceptance, correction, or challenge record
```

The root signs low-frequency authority statements. Delegated keys sign scoped operational credentials.

Subject binding for claims, evidence, observations, credentials, and Discovery Units is defined in `SUBJECT_BINDING_MODEL.md`. This document focuses on the credential layer that can make those subject references verifiable over time.

## Delegated Keys

A delegated key is a scoped signing key authorized by the organization root authority.

It may represent a brand, product line, model family, factory, region, service line, batch authority, or another bounded operational domain.

Example scopes:

```text
brand
product_line
model_family
factory
region
service_line
batch
```

Delegated keys should be authorized by a signed statement containing:

```text
delegated_key_id
delegated_public_key
algorithm
scope
allowed_actions
valid_from
valid_until
revocation_status_url
signed_by_root_authority
```

Example allowed actions:

```text
sign_model_passport
sign_batch_commitment
sign_unit_credential
sign_service_credential
sign_observation_protocol
sign_correction_record
```

Delegated keys are not identity roots. They are revocable operational authorities under the organization root.

## Compromise Handling

Delegation keeps key compromise bounded.

If a delegated key leaks:

1. The root authority signs a revocation statement.
2. A replacement delegated key is authorized.
3. New product or service credentials use the replacement key.
4. Historical credentials are interpreted with signing time, scope, and revocation time.
5. Credentials issued after known compromise are flagged as high risk or invalid by external policy.

This limits damage to a specific brand, product line, model family, factory, batch, service line, or time window instead of destroying the root authority history.

## Product Credential Chain

For manufactured products, the minimum chain is:

```text
organization root authority
  -> delegated product or brand key
    -> product model passport
      -> batch commitment
        -> unit credential
          -> observation or challenge record
```

### Model Passport

A model passport identifies the product model and the claims that may be made about it.

Minimum fields:

```text
model_id
brand
product_category
lifecycle_status
issuer_delegated_key_id
authorized_claim_categories
current_passport_version
issued_at
signature
```

### Batch Commitment

A batch commitment links a production batch to the model without requiring every unit identifier to be published in clear text.

Minimum fields:

```text
model_id
batch_id
manufactured_at_or_window
quantity
unit_commitment_scheme
unit_commitment_root
issuer_delegated_key_id
issued_at
signature
```

The default commitment scheme should be compatible with Merkle inclusion proofs so an individual unit can later prove membership in the batch without exposing every other unit identifier.

### Unit Credential

A unit credential binds a physical unit or smallest sales package to a model and batch.

It can be carried by QR code, NFC, printed serial label, tamper-evident label, or another medium.

Minimum fields:

```text
credential_type: OrgAnchorProductUnitCredential
model_id
batch_id
unit_id_or_private_token
passport_id
issuer_delegated_key_id
issued_at
signature
```

For stronger privacy, `unit_id_or_private_token` may be a random token whose validity is proven with an inclusion proof rather than a public sequential serial number.

## Service Credential Chain

For services, the observed atom is not a physical unit. It is usually:

```text
service offering
order
contract
project
delivery event
acceptance record
support incident
```

The minimum chain is:

```text
organization root authority
  -> delegated service key
    -> service passport
      -> delivery credential
        -> customer acceptance, complaint, outcome, correction, or challenge record
```

Minimum delivery credential fields:

```text
credential_type: OrgAnchorServiceDeliveryCredential
service_id
delivery_id
customer_ref_or_hash
delivery_window
acceptance_record_hash
issuer_delegated_key_id
issued_at
signature
```

When possible, service delivery records should support customer co-signature:

```text
organization signature: delivery was performed
customer signature: delivery was accepted, rejected, disputed, or later corrected
artifact hashes: contract, acceptance record, logs, invoice, or project deliverables
```

## Observation Binding

An observation, test, complaint, repair record, customer acceptance record, or challenge must bind to a specific credential.

Minimum observation binding fields:

```text
target_credential_type
target_credential_id_or_hash
model_id_or_service_id
batch_id_or_delivery_id
observer_id_or_hash
observer_signature_optional
observed_at
artifact_hashes
result
limitations
```

For physical products, a strong observation should include:

```text
unit credential
batch inclusion proof
purchase or custody artifact hash
test or observation artifact hash
observer signature where available
```

For services, a strong observation should include:

```text
delivery credential
customer reference hash
acceptance or complaint artifact hash
co-signature where available
```

## Observation Source Ladder

OrgAnchor should not treat all evidence sources as equivalent. The canonical S1-S5 source classes are defined in `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`.

The value layer should expose which kind of observation supports or challenges a claim, so an external AI agent can distinguish low-cost self-documentation from stronger real-world observation without treating OrgAnchor as a final quality judge.

Credential-specific records should still preserve the fields that make each source class meaningful.

### S1 First-Party Materials

```text
credential binding when the material concerns a concrete product, batch, unit, service, or delivery
artifact hash
issued_at
limitations
```

### S2 Third-Party Documents

These records must still expose:

```text
S2 effective level
verification route
external recheck anchor
organization claimed support
sample source
who selected the sample
commercial relationship or conflict of interest
test or audit scope
covered model, batch, unit, service, or delivery
limitations
```

Third-party status alone is not enough. A paid report over a supplier-selected sample is weaker than an independent record over a randomly obtained product.

Third-party-looking material without an external recheck anchor should be exposed as `UNVERIFIED_EXTERNAL_MATERIAL`, not as effective S2.

### S3 Random Purchase Or Random Sampling

The observation should record:

```text
selection method
selection party
purchase or custody artifact hash
model, batch, or unit credential
sampling window
sample size
limitations
```

### S4 Field-Use Observation

Field-use observations should expose:

```text
observer role
time window
usage context
credential binding
positive or negative result
artifact hashes
privacy-preserving redaction where needed
known bias or incompleteness
```

### S5 Public Challenge And Negative Evidence

A credible organization should provide a route for others to publish or reference negative evidence bound to the same product or service credential chain.

This layer is essential because a system that only accepts positive evidence becomes a marketing wrapper.

## Positive And Negative Feedback

Positive and negative records should be first-class.

The same credential chain must support:

```text
test_pass
test_fail
customer_acceptance
customer_complaint
repair_record
return_or_refund
field_observation
independent_retest
challenge
correction
withdrawal
```

This prevents the system from becoming a self-promotion channel where only favorable materials are easy to publish.

## Verification Flow For AI Agents

An external AI agent should be able to verify:

1. The organization root authority verifies.
2. The delegated key statement is signed by the root authority.
3. The delegated key scope allows the action being checked.
4. The delegated key was valid at the credential signing time.
5. The delegated key was not revoked before the signing time.
6. The model, batch, unit, service, or delivery credential verifies.
7. The observation record binds to that credential.
8. Linked evidence hashes match.
9. Known challenges, corrections, or withdrawals are visible.

OrgAnchor should expose these facts and gaps. It must not decide whether the product is good, the service is excellent, or the supplier is the best choice.

## Low-Cost Adoption Path

This layer should remain practical for small organizations.

Suggested adoption levels:

```text
Level 1: model_id or service_id only
Level 2: batch_id or delivery_id credentials
Level 3: unit credentials or customer co-signed delivery credentials
Level 4: batch commitment with inclusion proofs
Level 5: observation and challenge records bound to unit or delivery credentials
```

Low-value products may start with model and batch identifiers. Higher-value or higher-risk products should use unit credentials and stronger custody records.

## Privacy Boundary

The layer should not require organizations to publish all unit identifiers, customer names, contracts, invoices, or private delivery details.

It should support:

```text
hashed customer references
random unit tokens
Merkle roots
selective disclosure by inclusion proof
artifact hashes instead of public raw artifacts
redacted public records with private originals retained by the parties
```

The goal is verifiable linkage, not forced public disclosure of every operational record.

## Anti-Gaming Boundaries

This layer reduces, but does not eliminate, fraud.

It helps against:

```text
misattributed observations
fake product-model references
complaints attached to the wrong product
selective denial that a unit or delivery belonged to the organization
unbounded damage from leaked operational keys
```

It does not by itself prove:

```text
the product works under all conditions
the service was high quality
the observer is honest
the sample was not manipulated
the customer is unbiased
```

Those remain evidence, observation, challenge, and external policy questions.

## Implementation Direction

Future implementation should add:

1. Delegated key statement schema and verification.
2. Delegated key generation, authorization, rotation, and revocation commands.
3. Product model passport schema.
4. Batch commitment schema with Merkle-friendly unit commitment.
5. Unit credential schema and verification.
6. Service delivery credential schema and optional co-signature support.
7. Observation record schema binding feedback to product or service credentials.
8. Value audit checks for missing or invalid credential linkage.
9. Agent compact output summarizing credential-chain status and linkage gaps.

## Acceptance Rule

This layer is successful only if it lets an external AI agent answer, at low cost:

```text
Is the observed product or service actually linked to this organization's root authority chain?
Which delegated key signed the linkage?
Was that delegated key allowed and valid at signing time?
Does the observation bind to a model, batch, unit, service, or delivery credential?
Are positive and negative records attached to the same lineage?
What remains unproven?
```

The root authority remains the identity anchor. Product and service credentials make real-world feedback attributable to that root without turning OrgAnchor into a product-quality oracle.
