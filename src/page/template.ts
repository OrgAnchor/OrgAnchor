import type { OfficialEndpointsStatement, RootAuthority, SignatureFile } from "../types/artifacts.ts";
import type { JsonValue } from "../core/json.ts";

export interface VerifyLinkedArtifact {
  label: string;
  path: string;
  hash: string;
  signaturePath: string;
  signatureHash: string;
}

export interface VerifyMigrationArtifact {
  migrationId: string;
  path: string;
  hash: string;
  signaturePath: string;
  signatureHash: string;
  oldAuthorityId: string;
  oldAuthorityHash: string;
  oldAuthorityThreshold: {
    required: number;
    total: number;
  };
  newAuthorityId: string;
  newAuthorityHash: string;
  newAuthorityThreshold: {
    required: number;
    total: number;
  };
  effectiveAt: string;
  validSignatures: string[];
  requiredSignatures: number;
}

export interface VerifyRootAuthoritySummary {
  authorityId: string;
  hash: string;
  path: string;
  thresholdRequired: number;
  thresholdTotal: number;
}

export interface VerifyPreviousRootAuthoritySummary extends VerifyRootAuthoritySummary {
  sourceMigrationPath: string;
}

export interface VerifyRootContinuity {
  status: "CURRENT_ROOT_ONLY" | "MIGRATION_CHAIN_VERIFIED";
  currentRootAuthority: VerifyRootAuthoritySummary;
  previousRootAuthorities: VerifyPreviousRootAuthoritySummary[];
  migrationCount: number;
  historicalVerificationRule: string;
  futureStatementRule: string;
}

export interface VerifyProofCheck {
  label: string;
  status: "PASS" | "PRESENT" | "NOT_INCLUDED";
  detail: string;
}

export interface VerifyCarrierReceipt {
  artifactHash: string;
  artifactKind: string;
  artifactPath: string;
  provider: string;
  action: string;
  status: string;
  recordedAt: string;
  summary: Record<string, JsonValue>;
}

export interface VerifyValueContinuity {
  status: "PRESENT" | "NOT_INCLUDED";
  path?: string;
  hash?: string;
  markdownPath?: string;
  markdownHash?: string;
  summary: Record<string, JsonValue>;
}

export interface VerifyPageModel {
  generatedAt: string;
  statementHash: string;
  signatureHash: string;
  authorityHash: string;
  statementFile: string;
  signatureFile: string;
  authorityFile: string;
  indexFile: string;
  statement: OfficialEndpointsStatement;
  authority: RootAuthority;
  signature: SignatureFile;
  linkedArtifacts: VerifyLinkedArtifact[];
  migrationArtifacts: VerifyMigrationArtifact[];
  carrierReceipts: VerifyCarrierReceipt[];
  rootContinuity: VerifyRootContinuity;
  valueContinuity: VerifyValueContinuity;
  proofChecks: VerifyProofCheck[];
}

export function renderVerifyPage(model: VerifyPageModel): string {
  const organization = model.statement.organization;
  const organizationName = stringValue(organization.display_name) || stringValue(organization.name) || "Organization";
  const description = stringValue(organization.description);
  const websiteUrl = stringValue(model.statement.official_endpoints.website);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizationName,
    url: websiteUrl || undefined,
    description: description || undefined,
    sameAs: endpointUrls(model.statement.official_endpoints)
  };
  const endpoints = Object.entries(model.statement.official_endpoints)
    .map(([key, value]) => renderEndpoint(key, value))
    .join("\n");
  const signatures = model.signature.signatures
    .map(
      (signature) => `
        <tr>
          <th scope="row">${escapeHtml(signature.key_id)}</th>
          <td>${escapeHtml(signature.algorithm)}</td>
          <td>${escapeHtml(signature.signed_at)}</td>
        </tr>`
    )
    .join("\n");
  const rootKeys = model.authority.keys
    .map(
      (key) => `
        <tr>
          <th scope="row">${escapeHtml(key.id)}</th>
          <td>${escapeHtml(key.algorithm)}</td>
        </tr>`
    )
    .join("\n");
  const linkedFiles = model.linkedArtifacts
    .map(
      (artifact) => `
        <li>
          <a href="./${escapeHtml(artifact.path)}">${escapeHtml(artifact.label)}</a>
          <br><code>${escapeHtml(artifact.hash)}</code>
          <br><a href="./${escapeHtml(artifact.signaturePath)}">${escapeHtml(artifact.signaturePath)}</a>
          <br><code>${escapeHtml(artifact.signatureHash)}</code>
        </li>`
    )
    .join("\n");
  const proofRows = model.proofChecks
    .map(
      (check) => `
        <tr>
          <th scope="row">${escapeHtml(check.label)}</th>
          <td><span class="badge badge-${escapeHtml(check.status.toLowerCase())}">${escapeHtml(check.status)}</span></td>
          <td>${escapeHtml(check.detail)}</td>
        </tr>`
    )
    .join("\n");
  const migrationRows = model.migrationArtifacts
    .map(
      (migration) => `
        <tr>
          <th scope="row"><a href="./${escapeHtml(migration.path)}">${escapeHtml(migration.migrationId)}</a></th>
          <td>${escapeHtml(migration.effectiveAt)}</td>
          <td>${escapeHtml(migration.oldAuthorityId)}<br><code>${escapeHtml(migration.oldAuthorityHash)}</code></td>
          <td>${escapeHtml(migration.newAuthorityId)}<br><code>${escapeHtml(migration.newAuthorityHash)}</code></td>
          <td>${escapeHtml(String(migration.validSignatures.length))} of ${escapeHtml(String(migration.requiredSignatures))}</td>
        </tr>`
    )
    .join("\n");
  const migrationFiles = model.migrationArtifacts
    .map(
      (migration) => `
        <li>
          <a href="./${escapeHtml(migration.path)}">${escapeHtml(migration.path)}</a>
          <br><code>${escapeHtml(migration.hash)}</code>
          <br><a href="./${escapeHtml(migration.signaturePath)}">${escapeHtml(migration.signaturePath)}</a>
          <br><code>${escapeHtml(migration.signatureHash)}</code>
        </li>`
    )
    .join("\n");
  const carrierRows = model.carrierReceipts
    .map(
      (receipt) => `
        <tr>
          <th scope="row">${escapeHtml(receipt.provider)}</th>
          <td><span class="badge badge-${escapeHtml(cssClass(receipt.status))}">${escapeHtml(receipt.status)}</span></td>
          <td>${escapeHtml(receipt.action)}<br>${escapeHtml(receipt.artifactKind)}<br><code>${escapeHtml(receipt.artifactHash)}</code></td>
          <td>${renderCarrierSummary(receipt.summary)}</td>
          <td>${escapeHtml(receipt.recordedAt)}</td>
        </tr>`
    )
    .join("\n");
  const valueContinuity = model.valueContinuity;
  const valueSummary = valueContinuity.summary;
  const valueReportLinks = valueContinuity.status === "PRESENT" ?
    `<dl>
        <dt>Report JSON</dt>
        <dd><a href="./${escapeHtml(valueContinuity.path ?? "")}">${escapeHtml(valueContinuity.path ?? "")}</a><br><code>${escapeHtml(valueContinuity.hash ?? "")}</code></dd>
        ${valueContinuity.markdownPath ? `<dt>Report Markdown</dt>
        <dd><a href="./${escapeHtml(valueContinuity.markdownPath)}">${escapeHtml(valueContinuity.markdownPath)}</a>${valueContinuity.markdownHash ? `<br><code>${escapeHtml(valueContinuity.markdownHash)}</code>` : ""}</dd>` : ""}
      </dl>` :
    "<p>No value continuity report was included in this verification package.</p>";
  const continuity = model.rootContinuity;
  const continuityStatusText = continuity.status === "MIGRATION_CHAIN_VERIFIED" ?
    `${continuity.migrationCount} migration statement(s) verified as a chain to the current root authority.` :
    "No migration chain is included. Current statements use the current root authority directly.";
  const previousRootRows = continuity.previousRootAuthorities
    .map(
      (authority) => `
        <tr>
          <th scope="row">${escapeHtml(authority.authorityId)}</th>
          <td><code>${escapeHtml(authority.hash)}</code></td>
          <td>${escapeHtml(String(authority.thresholdRequired))} of ${escapeHtml(String(authority.thresholdTotal))}</td>
          <td><a href="./${escapeHtml(authority.sourceMigrationPath)}">${escapeHtml(authority.sourceMigrationPath)}</a></td>
        </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(organizationName)} Verification</title>
  <link rel="organchor" type="application/json" href="/.well-known/organchor.json">
  <link rel="alternate" type="application/json" href="./${escapeHtml(model.indexFile)}" title="OrgAnchor verify index">
  <script type="application/ld+json">${safeInlineJson(jsonLd)}</script>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f7f4;
      --text: #171717;
      --muted: #5f6368;
      --line: #d9d7cf;
      --panel: #ffffff;
      --accent: #174ea6;
      --ok: #137333;
      --warn: #8a5a00;
      --neutral: #5f6368;
      --code: #f1f3f4;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111111;
        --text: #f1f1f1;
        --muted: #b7b7b7;
        --line: #373737;
        --panel: #1a1a1a;
        --accent: #8ab4f8;
        --ok: #81c995;
        --warn: #fdd663;
        --neutral: #b7b7b7;
        --code: #242424;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main {
      width: min(960px, calc(100% - 32px));
      margin: 0 auto;
      padding: 48px 0;
    }

    header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 5vw, 3.5rem);
      line-height: 1.05;
      letter-spacing: 0;
    }

    h2 {
      margin: 32px 0 12px;
      font-size: 1.25rem;
      letter-spacing: 0;
    }

    p {
      margin: 0 0 14px;
      color: var(--muted);
    }

    a {
      color: var(--accent);
    }

    .status {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      color: var(--ok);
      font-weight: 700;
      margin-bottom: 16px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 20px;
    }

    .summary-item {
      border: 1px solid var(--line);
      background: var(--panel);
      padding: 14px;
      border-radius: 8px;
    }

    .summary-label {
      display: block;
      color: var(--muted);
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 800;
    }

    .badge {
      display: inline-block;
      min-width: 92px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 800;
      text-align: center;
      border: 1px solid currentColor;
    }

    .badge-pass {
      color: var(--ok);
    }

    .badge-present {
      color: var(--accent);
    }

    .badge-not_included {
      color: var(--neutral);
    }

    .badge-published,
    .badge-verified {
      color: var(--ok);
    }

    .badge-manual_package {
      color: var(--warn);
    }

    .badge-dry_run {
      color: var(--neutral);
    }

    .status::before {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--ok);
    }

    section {
      padding: 24px 0;
      border-bottom: 1px solid var(--line);
    }

    dl {
      display: grid;
      grid-template-columns: minmax(140px, 220px) 1fr;
      gap: 10px 18px;
      margin: 0;
    }

    dt {
      color: var(--muted);
      font-weight: 700;
    }

    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
    }

    th,
    td {
      padding: 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      color: var(--muted);
      font-weight: 700;
    }

    code,
    pre {
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      background: var(--code);
    }

    code {
      padding: 2px 5px;
      border-radius: 4px;
    }

    pre {
      overflow-x: auto;
      padding: 16px;
      border: 1px solid var(--line);
    }

    @media (max-width: 640px) {
      main {
        width: min(100% - 24px, 960px);
        padding: 32px 0;
      }

      dl {
        grid-template-columns: 1fr;
      }

      th,
      td {
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="status">Signed artifacts generated</div>
      <h1>${escapeHtml(organizationName)}</h1>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      <p>This is an adopting organization OrgAnchor verification page. The page helps people and machines find signed verification artifacts.</p>
      <p>This page display does not by itself prove identity. Trust comes from verifying the signed statement against the expected root authority.</p>
      <div class="summary" aria-label="Visible verification summary">
        <div class="summary-item">
          <span class="summary-label">Statement</span>
          <span class="summary-value">Signed</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Root authority</span>
          <span class="summary-value">${escapeHtml(String(model.authority.threshold.required))} of ${escapeHtml(String(model.authority.threshold.total))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Valid signatures</span>
          <span class="summary-value">${escapeHtml(String(model.signature.signatures.length))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Generated</span>
          <span class="summary-value">${escapeHtml(formatShortDate(model.generatedAt))}</span>
        </div>
      </div>
    </header>

    <section aria-labelledby="proof-trail">
      <h2 id="proof-trail">Visible Proof Trail</h2>
      <p>These checks were performed when this static verification package was generated. They are recorded here so humans can see what happened, and in <code>${escapeHtml(model.indexFile)}</code> so machines can inspect the same evidence.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Check</th>
            <th scope="col">Status</th>
            <th scope="col">Detail</th>
          </tr>
        </thead>
        <tbody>
${proofRows}
        </tbody>
      </table>
    </section>

    <section aria-labelledby="identity">
      <h2 id="identity">Identity Artifacts</h2>
      <dl>
        <dt>Statement hash</dt>
        <dd><code>${escapeHtml(model.statementHash)}</code></dd>
        <dt>Root authority hash</dt>
        <dd><code>${escapeHtml(model.authorityHash)}</code></dd>
        <dt>Signature hash</dt>
        <dd><code>${escapeHtml(model.signatureHash)}</code></dd>
        <dt>Statement id</dt>
        <dd>${escapeHtml(model.statement.statement_id)}</dd>
        <dt>Issued at</dt>
        <dd>${escapeHtml(model.statement.issued_at)}</dd>
        <dt>Generated at</dt>
        <dd>${escapeHtml(model.generatedAt)}</dd>
      </dl>
    </section>

    <section aria-labelledby="value-continuity">
      <h2 id="value-continuity">Value Continuity</h2>
      <p>This section summarizes the organization's signed claims and evidence trail. It does not prove the organization is good or that every claim is true; it helps people and AI agents see how much support the claims currently have.</p>
      <div class="summary" aria-label="Value continuity summary">
        <div class="summary-item">
          <span class="summary-label">Status</span>
          <span class="summary-value">${escapeHtml(valueContinuity.status)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Claims</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.total_claims))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Evidence-linked</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.evidence_linked_claims))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Third-party</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.third_party_claims))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Reproducible</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.reproducible_claims))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Unsupported</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.unsupported_claims))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Stale evidence</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.stale_evidence_items))}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Audit warnings</span>
          <span class="summary-value">${escapeHtml(formatMetric(valueSummary.WARN))}</span>
        </div>
      </div>
      ${valueReportLinks}
    </section>

    <section aria-labelledby="carrier-receipts">
      <h2 id="carrier-receipts">Carrier Receipts</h2>
      <p>These receipts summarize where this verification package or related proof artifacts were mirrored, archived, pinned, or timestamped. Carriers help discovery and durability; they are not the identity root.</p>
      ${carrierRows ? `<table>
        <thead>
          <tr>
            <th scope="col">Provider</th>
            <th scope="col">Status</th>
            <th scope="col">Artifact</th>
            <th scope="col">Receipt summary</th>
            <th scope="col">Recorded at</th>
          </tr>
        </thead>
        <tbody>
${carrierRows}
        </tbody>
      </table>` : "<p>No carrier receipts were included in this verification package.</p>"}
    </section>

    <section aria-labelledby="root-continuity">
      <h2 id="root-continuity">Root Continuity</h2>
      <p>The current root authority is the root that verifies new statements in this package. Older statements remain historical records and must be checked against the root authority that signed them.</p>
      <dl>
        <dt>Current root authority</dt>
        <dd>${escapeHtml(continuity.currentRootAuthority.authorityId)}<br><code>${escapeHtml(continuity.currentRootAuthority.hash)}</code></dd>
        <dt>Current threshold</dt>
        <dd>${escapeHtml(String(continuity.currentRootAuthority.thresholdRequired))} of ${escapeHtml(String(continuity.currentRootAuthority.thresholdTotal))}</dd>
        <dt>Migration status</dt>
        <dd>${escapeHtml(continuityStatusText)}</dd>
        <dt>Historical statements</dt>
        <dd>${escapeHtml(continuity.historicalVerificationRule)}</dd>
        <dt>Future statements</dt>
        <dd>${escapeHtml(continuity.futureStatementRule)}</dd>
      </dl>
      ${previousRootRows ? `<h2>Previous Root Authorities</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Authority id</th>
            <th scope="col">Hash</th>
            <th scope="col">Threshold</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
${previousRootRows}
        </tbody>
      </table>` : ""}
    </section>

    <section aria-labelledby="endpoints">
      <h2 id="endpoints">Official Endpoints</h2>
      <table>
        <tbody>
${endpoints}
        </tbody>
      </table>
    </section>

    <section aria-labelledby="authority">
      <h2 id="authority">Root Authority</h2>
      <dl>
        <dt>Authority id</dt>
        <dd>${escapeHtml(model.authority.authority_id)}</dd>
        <dt>Threshold</dt>
        <dd>${escapeHtml(String(model.authority.threshold.required))} of ${escapeHtml(String(model.authority.threshold.total))}</dd>
      </dl>
      <table>
        <thead>
          <tr>
            <th scope="col">Key id</th>
            <th scope="col">Algorithm</th>
          </tr>
        </thead>
        <tbody>
${rootKeys}
        </tbody>
      </table>
    </section>

    <section aria-labelledby="signatures">
      <h2 id="signatures">Signatures</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Key id</th>
            <th scope="col">Algorithm</th>
            <th scope="col">Signed at</th>
          </tr>
        </thead>
        <tbody>
${signatures}
        </tbody>
      </table>
    </section>

    ${migrationRows ? `<section aria-labelledby="migrations">
      <h2 id="migrations">Migration History</h2>
      <p>These migration statements link an older root authority to the current root authority shown on this page.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Migration</th>
            <th scope="col">Effective at</th>
            <th scope="col">Old root authority</th>
            <th scope="col">New root authority</th>
            <th scope="col">Old-root signatures</th>
          </tr>
        </thead>
        <tbody>
${migrationRows}
        </tbody>
      </table>
    </section>` : ""}

    <section aria-labelledby="files">
      <h2 id="files">Machine-Readable Files</h2>
      <ul>
        <li><a href="./${escapeHtml(model.indexFile)}">${escapeHtml(model.indexFile)}</a></li>
        <li><a href="./${escapeHtml(model.authorityFile)}">${escapeHtml(model.authorityFile)}</a></li>
        <li><a href="./${escapeHtml(model.statementFile)}">${escapeHtml(model.statementFile)}</a></li>
        <li><a href="./${escapeHtml(model.signatureFile)}">${escapeHtml(model.signatureFile)}</a></li>
      </ul>
      ${linkedFiles ? `<h2>Claims And Evidence</h2><ul>${linkedFiles}\n      </ul>` : ""}
      ${migrationFiles ? `<h2>Migration Files</h2><ul>${migrationFiles}\n      </ul>` : ""}
    </section>

    <section aria-labelledby="verify">
      <h2 id="verify">CLI Verification</h2>
      <pre><code>organchor statement verify \\
  --authority ${escapeHtml(model.authorityFile)} \\
  --expected-authority-hash ${escapeHtml(model.authorityHash)} \\
  --in ${escapeHtml(model.statementFile)} \\
  --sig ${escapeHtml(model.signatureFile)}</code></pre>
    </section>
  </main>
</body>
</html>
`;
}

function renderEndpoint(key: string, value: unknown): string {
  const label = escapeHtml(key);
  const text = value === null ? "not declared" : String(value);
  const escapedText = escapeHtml(text);
  const isLink = typeof value === "string" && /^(https?:|mailto:)/.test(value);
  return `        <tr>
          <th scope="row">${label}</th>
          <td>${isLink ? `<a href="${escapedText}">${escapedText}</a>` : escapedText}</td>
        </tr>`;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function endpointUrls(endpoints: Record<string, JsonValue>): string[] {
  return Object.values(endpoints).filter((value): value is string =>
    typeof value === "string" && /^https?:\/\//.test(value)
  );
}

function safeInlineJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function formatShortDate(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
  return match?.[1] ?? value;
}

function renderCarrierSummary(summary: Record<string, JsonValue>): string {
  const entries = Object.entries(summary);
  if (entries.length === 0) return "No public summary fields recorded.";
  return entries
    .map(([key, value]) => `<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(formatJsonValue(value))}</div>`)
    .join("");
}

function formatJsonValue(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatJsonValue).join(", ");
  return JSON.stringify(value);
}

function formatMetric(value: JsonValue | undefined): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "-";
}

function cssClass(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9_-]/g, "_");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
