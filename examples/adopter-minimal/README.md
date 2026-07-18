# Minimal Adopter Example

Status: public skeleton example.

This directory is a safe starting shape for an adopting organization. It is not a real organization identity, not a signed public pilot, and not an endorsement.

Copy the shape into a separate adoption workspace, then replace all example values before running real commands.

## Files

```text
organchor.config.example.json
```

The example config contains only placeholder organization data.

## Minimal Flow

From a separate adoption workspace:

```bash
organchor init
```

Copy the example values into:

```text
organchor.config.json
```

Then run:

```bash
organchor key generate --id root-2026
organchor authority create --key keys/root-2026.private.json --out root-authority.json
organchor statement create --config organchor.config.json --authority root-authority.json --out statements/official-endpoints.json
organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json --out statements/official-endpoints.json.sig
organchor statement verify --authority root-authority.json --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --out public/verify
organchor adoption status --verify-dir public/verify --origin https://example.org --level 2 --out ADOPTION_STATUS.md --json reports/adoption-status-report.json
```

Use `docs/guides/ADOPTER_QUICKSTART.md` for the short explanation and `docs/guides/EXTERNAL_PILOT_RUNBOOK.md` for the full pilot path.

## Safety

Never copy a real private key into this example directory.
