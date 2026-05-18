import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { auditDomain, renderDomainAuditMarkdown, writeDomainAuditReport, type DomainResolver, type HttpGet } from "../src/auditors/domain.ts";

test("domain audit reports automatic and manual checks with PASS/WARN/FAIL states", async () => {
  const resolver: DomainResolver = {
    async resolveMx() {
      return [{ priority: 10, exchange: "mail.example.com" }];
    },
    async resolveTxt(hostname: string) {
      if (hostname === "example.com") {
        return [["v=spf1 include:_spf.example.com ~all"]];
      }
      if (hostname === "_dmarc.example.com") {
        return [["v=DMARC1; p=quarantine"]];
      }
      return [];
    },
    async resolveCaa() {
      return [];
    },
    async resolveDs() {
      return [{ keyTag: 12345 }];
    }
  };

  const httpGet: HttpGet = async (url: string) => {
    const path = new URL(url).pathname;
    if (path === "/verify/official-endpoints.json.sig") {
      return { url, finalUrl: url, status: 404, ok: false };
    }
    if (path === "/security.txt") {
      return { url, finalUrl: url, status: 404, ok: false };
    }
    return { url, finalUrl: url, status: 200, ok: true, contentType: "text/plain" };
  };

  const report = await auditDomain(
    "https://Example.COM/verify/",
    { now: new Date("2026-05-12T00:00:00Z") },
    {
      resolver,
      httpGet,
      inspectCertificate: async () => ({
        valid_to: "2026-05-22T00:00:00.000Z",
        days_remaining: 10,
        authorized: true
      })
    }
  );

  assert.equal(report.domain, "example.com");
  assert.equal(report.summary.PASS > 0, true);
  assert.equal(report.summary.WARN > 0, true);
  assert.equal(report.summary.FAIL > 0, true);
  assert.equal(report.summary.MANUAL_CHECK_REQUIRED, 3);
  assert.equal(report.checks.find((check) => check.id === "dnssec")?.status, "PASS");
  assert.equal(report.checks.find((check) => check.id === "caa")?.status, "WARN");
  assert.equal(report.checks.find((check) => check.id === "official_statement_signature")?.status, "FAIL");
  assert.equal(report.checks.find((check) => check.id === "registry_lock")?.status, "MANUAL_CHECK_REQUIRED");

  const markdown = renderDomainAuditMarkdown(report);
  assert.match(markdown, /Domain Security Report/);
  assert.match(markdown, /MANUAL_CHECK_REQUIRED/);
});

test("domain audit writes JSON and Markdown reports", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-domain-audit-"));
  try {
    const report = await auditDomain(
      "example.org",
      { now: new Date("2026-05-12T00:00:00Z") },
      {
        resolver: allMissingResolver(),
        httpGet: async (url) => ({ url, finalUrl: url, status: 200, ok: true }),
        inspectCertificate: async () => ({
          valid_to: "2026-08-12T00:00:00.000Z",
          days_remaining: 92,
          authorized: true
        })
      }
    );
    await writeDomainAuditReport(report, join(workspace, "reports"));

    const json = JSON.parse(readFileSync(join(workspace, "reports", "domain-security-report.json"), "utf8"));
    const markdown = readFileSync(join(workspace, "reports", "domain-security-report.md"), "utf8");
    assert.equal(json.type, "OrgAnchorDomainSecurityReport");
    assert.match(markdown, /example.org/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function allMissingResolver(): DomainResolver {
  return {
    async resolveMx() {
      return [];
    },
    async resolveTxt() {
      return [];
    },
    async resolveCaa() {
      return [];
    },
    async resolveDs() {
      return [];
    }
  };
}
