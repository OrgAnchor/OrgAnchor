import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { asObject, validateRootAuthority } from "../core/validate.ts";
import type { OfficialEndpointsStatement, OrgAnchorConfig } from "../types/artifacts.ts";

export async function statementCreateCommand(options: Record<string, string | boolean>): Promise<void> {
  const configPath = typeof options.config === "string" ? options.config : "organchor.config.json";
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const out = typeof options.out === "string" ? options.out : "statements/official-endpoints.json";
  const config = asConfig(await readJsonFile(configPath));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  const authorityHash = sha256CanonicalJson(authority);
  const statement: OfficialEndpointsStatement = {
    schema: "https://organchor.org/schemas/official-endpoints.v1.json",
    type: "OfficialOrganizationEndpoints",
    version: "1.0",
    statement_id: typeof options.id === "string" ? options.id : `organchor-statement-${new Date().getUTCFullYear()}-001`,
    issued_at: new Date().toISOString(),
    organization: config.organization,
    root_authority: authority,
    root_authority_hash: authorityHash,
    official_endpoints: config.official_endpoints,
    archives: {
      arweave: [],
      ipfs: []
    },
    disaster_recovery: config.disaster_recovery,
    auxiliary_names: config.auxiliary_names,
    domain_security: config.domain_security,
    notes: "Only statements satisfying the root authority rule should be trusted for future migrations."
  };
  await writeJsonFile(out, statement);
  console.log(`Created official endpoints statement: ${out}`);
  console.log(`Statement hash: ${sha256CanonicalJson(statement)}`);
}

function asConfig(value: unknown): OrgAnchorConfig {
  const object = asObject(value as never, "config");
  if (object.type !== "OrgAnchorConfig") throw new Error("Invalid OrgAnchor config type");
  return value as OrgAnchorConfig;
}
