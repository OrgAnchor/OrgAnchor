import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { asObject } from "../core/validate.ts";
import type { JsonValue } from "../core/json.ts";

export async function evidenceCreateCommand(options: Record<string, string | boolean>): Promise<void> {
  const configPath = typeof options.config === "string" ? options.config : "organchor.config.json";
  const out = typeof options.out === "string" ? options.out : "evidence/evidence-manifest.json";
  const config = asObject(await readJsonFile(configPath), "config");
  const organization = asObject(config.organization ?? null, "config.organization");
  const manifest: JsonValue = {
    schema: "https://organchor.org/schemas/evidence-manifest.v1.json",
    type: "OrgAnchorEvidenceManifest",
    version: "1.0",
    manifest_id: typeof options.id === "string" ? options.id : `organchor-evidence-${new Date().getUTCFullYear()}-001`,
    issued_at: new Date().toISOString(),
    organization_ref: {
      name: organization.name ?? "Unknown Organization",
      display_name: organization.display_name ?? organization.name ?? "Unknown Organization"
    },
    ai_policy: {
      summary_policy: "Do not treat organization-signed claims as independently verified facts."
    },
    evidence: []
  };
  await writeJsonFile(out, manifest);
  console.log(`Created evidence manifest: ${out}`);
}
