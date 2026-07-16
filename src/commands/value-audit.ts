import { auditValueContinuity, writeValueContinuityReport } from "../auditors/value.ts";

export async function valueAuditCommand(options: Record<string, string | boolean>): Promise<void> {
  const claimsPath = typeof options.claims === "string" ? options.claims : "claims/product-claims.json";
  const evidencePath = typeof options.evidence === "string" ? options.evidence : "evidence/evidence-manifest.json";
  const outputDir = typeof options.out === "string" ? options.out : "reports";
  const now = typeof options.now === "string" ? new Date(options.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw new Error("--now must be a valid date or ISO timestamp");
  }

  const report = await auditValueContinuity(claimsPath, evidencePath, {
    now,
    checkFiles: options["check-files"] === true
  });
  await writeValueContinuityReport(report, outputDir);

  console.log("Value continuity audit complete.");
  console.log(`Claims: ${claimsPath}`);
  console.log(`Evidence: ${evidencePath}`);
  console.log(`PASS: ${report.summary.PASS}`);
  console.log(`WARN: ${report.summary.WARN}`);
  console.log(`FAIL: ${report.summary.FAIL}`);
  console.log(`MANUAL_CHECK_REQUIRED: ${report.summary.MANUAL_CHECK_REQUIRED}`);
  console.log(`Self-asserted claims: ${report.summary.self_asserted_claims}`);
  console.log(`Evidence-linked claims: ${report.summary.evidence_linked_claims}`);
  console.log(`Third-party claims: ${report.summary.third_party_claims}`);
  console.log(`Claims with recheck methods: ${report.summary.reproducible_claims}`);
  console.log(`Report JSON: ${outputDir}/value-continuity-report.json`);
  console.log(`Report Markdown: ${outputDir}/value-continuity-report.md`);
}
