# OrgAnchor Agent Discovery Loop Example

This example documents the local discovery loop that third-party AI agents can use before any central Directory exists.

The loop is:

```text
seed origins or bounded crawl starts -> beacon sweep -> local index -> need query -> direct origin verification
```

Run the demo from the repository root:

```bash
node scripts/agent-discovery-demo.mjs
```

It creates a temporary adopting organization, regenerates its standard Beacon discovery surfaces with `organchor beacon generate`, serves its `/verify` package on localhost, and writes these files:

```text
outputs/beacon-sweep.ndjson
outputs/beacon-sweep-verify.json
outputs/beacon-index.json
public/directory/directory-snapshot.json
public/directory/directory-policy.json
outputs/directory-feed.ndjson
outputs/beacon-query-result.json
outputs/beacon-discovery-report.json
outputs/compact-verify.json
outputs/demo-summary.json
outputs/commands.txt
```

The important boundary is that the local index is only a discovery cache. A returned candidate still has to be verified at its own origin with:

```bash
organchor verify url <origin> --compact
```

This is the core anti-monopoly path: any organization that publishes a valid OrgAnchor Beacon can be found and rechecked by independent agents, crawlers, buyers, auditors, or competing directories.

For known starting points, a crawler can use the same command surface:

```bash
organchor beacon sweep --crawl https://example.org --crawl-max-pages 25 --crawl-max-depth 1 --out beacon-sweep.ndjson
```

The crawler is deliberately bounded. It helps discover OrgAnchor signals from known pages; it is not a global search engine by itself.
