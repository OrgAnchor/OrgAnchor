import { auditDomain, writeDomainAuditReport } from "../auditors/domain.ts";

export async function domainAuditCommand(options: Record<string, string | boolean>): Promise<void> {
  const domainArg = typeof options.domain === "string" ? options.domain : firstPositionalDomain(options);
  if (!domainArg) {
    throw new Error("domain audit requires a domain, e.g. organchor domain audit example.com");
  }

  const outputDir = typeof options.out === "string" ? options.out : "reports";
  const dnsServer = typeof options["dns-server"] === "string" ? options["dns-server"] : undefined;
  const resolveIp = typeof options["resolve-ip"] === "string" ? options["resolve-ip"] : undefined;
  const timeoutMs = typeof options["timeout-ms"] === "string" ? Number(options["timeout-ms"]) : 15000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }

  const auditOptions: Parameters<typeof auditDomain>[1] = {
    outputDir,
    timeoutMs
  };
  if (dnsServer !== undefined) {
    auditOptions.dnsServer = dnsServer;
  }
  if (resolveIp !== undefined) {
    auditOptions.resolveIp = resolveIp;
  }

  const report = await auditDomain(domainArg, auditOptions);
  await writeDomainAuditReport(report, outputDir);

  console.log("Domain audit complete.");
  console.log(`Domain: ${report.domain}`);
  console.log(`PASS: ${report.summary.PASS}`);
  console.log(`WARN: ${report.summary.WARN}`);
  console.log(`FAIL: ${report.summary.FAIL}`);
  console.log(`MANUAL_CHECK_REQUIRED: ${report.summary.MANUAL_CHECK_REQUIRED}`);
  console.log(`Report JSON: ${outputDir}/domain-security-report.json`);
  console.log(`Report Markdown: ${outputDir}/domain-security-report.md`);
}

function firstPositionalDomain(options: Record<string, string | boolean>): string | undefined {
  const positional = options._;
  return typeof positional === "string" ? positional : undefined;
}
