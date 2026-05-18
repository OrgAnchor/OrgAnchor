import { writeFile } from "node:fs/promises";
import {
  createEnsPlanFromStatementFile,
  readEnsRecordsSnapshot,
  renderEnsVerificationMarkdown,
  verifyEnsRecords
} from "../auxiliary-names/ens.ts";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";

export async function ensVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const ensName = typeof options.name === "string" ? options.name : typeof options._ === "string" ? options._ : undefined;
  if (!ensName) {
    throw new Error("ens verify requires an ENS name, e.g. organchor ens verify example.eth --records ens-records.json");
  }
  const recordsPath = typeof options.records === "string" ? options.records : undefined;
  if (!recordsPath) {
    throw new Error("ens verify currently requires --records <records.json>. Live RPC inspect is a later adapter.");
  }

  const statementPath = typeof options.statement === "string" ? options.statement : "statements/official-endpoints.json";
  const outputDir = typeof options.out === "string" ? options.out : "ens";
  const ipfsCid = typeof options["ipfs-cid"] === "string" ? options["ipfs-cid"] : undefined;
  const plan = await createEnsPlanFromStatementFile(ensName, statementPath, {
    ...(ipfsCid !== undefined ? { ipfsCid } : {})
  });
  const records = await readEnsRecordsSnapshot(recordsPath);
  const report = verifyEnsRecords(plan, records);

  await ensureDir(outputDir);
  await writeJsonFile(`${outputDir}/ens-verification-report.json`, report as unknown as JsonValue);
  await writeFile(`${outputDir}/ens-verification-report.md`, renderEnsVerificationMarkdown(report), "utf8");

  console.log(report.status);
  console.log(`ENS: ${report.ens_name}`);
  console.log(`Checks: ${report.checks.length}`);
  console.log(`Report JSON: ${outputDir}/ens-verification-report.json`);
  console.log(`Report Markdown: ${outputDir}/ens-verification-report.md`);
  if (report.status === "FAIL") {
    process.exitCode = 1;
  }
}
