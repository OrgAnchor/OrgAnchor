# OrgAnchor Complete Minimal Example

This directory contains a public, unsafe test example for learning and packaging checks.

It is complete enough to verify an official endpoint statement, but it is not a real organization identity.

Do not reuse the root authority, key ids, signatures, or hashes for a real organization.

## Verify

From this directory:

```bash
organchor statement verify \
  --authority root-authority.json \
  --expected-authority-hash sha256:12ce12a2a8e24a9c364aa56156cf182e1fd118463c63f59b1cf452a05f6effeb \
  --in statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig
```

Expected result:

```text
PASS
```

## Generate A Verify Page

```bash
organchor page generate \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json \
  --out public/verify
```

The generated page will include a visible proof trail and `root_continuity`.

