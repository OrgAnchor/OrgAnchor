# S2 Third-Party Material Example

This example shows the basic usable S2 path:

```bash
organchor evidence add \
  --file certificate.pdf \
  --id evidence-cert-001 \
  --issuer-type third_party \
  --uri https://example.org/evidence/certificate.pdf \
  --location-type https \
  --media-type application/pdf

organchor evidence s2 attach \
  --evidence-id evidence-cert-001 \
  --template certification_record \
  --issuer-name "Example Certification Body" \
  --anchor-url https://registry.example/records/ABC-123 \
  --anchor-record-id ABC-123 \
  --scope "Certificate supports claim-001 for model-x1." \
  --covered-subject-type product_model \
  --covered-subject-id model-x1 \
  --valid-until 2027-05-28T00:00:00Z
```

S2 is not a trust badge. It only makes the organization's use of third-party-looking material explicit, scoped, hash-bound, and externally recheckable.
