# S3 Random Purchase / Sampling Example

This example shows the basic usable S3 path:

```bash
organchor evidence add \
  --file random-sample-report.md \
  --id evidence-sample-001 \
  --issuer-type third_party \
  --uri https://example.org/evidence/random-sample-report.md \
  --location-type https \
  --media-type text/markdown

organchor evidence s3 attach \
  --evidence-id evidence-sample-001 \
  --template market_purchase \
  --sampler-type buyer \
  --sampler-name "Example Buyer" \
  --acquired-at 2026-05-28T00:00:00Z \
  --subject-type product_model \
  --subject-id model-x1 \
  --batch-id batch-2026-05 \
  --scope "Random market purchase sample supports claim-001 for model-x1."
```

S3 is not a trust badge. It makes the sample route visible and lets external agents see whether the sample appears selected or provided by the organization.
