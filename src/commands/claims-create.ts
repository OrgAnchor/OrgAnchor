import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { asObject } from "../core/validate.ts";
import type { JsonValue } from "../core/json.ts";

export async function claimsCreateCommand(options: Record<string, string | boolean>): Promise<void> {
  const configPath = typeof options.config === "string" ? options.config : "organchor.config.json";
  const out = typeof options.out === "string" ? options.out : "claims/product-claims.json";
  const config = asObject(await readJsonFile(configPath), "config");
  const organization = asObject(config.organization ?? null, "config.organization");
  const productId = typeof options["product-id"] === "string" ? options["product-id"] : "primary-product";
  const claimId = typeof options["claim-id"] === "string" ? options["claim-id"] : "claim-001";
  const evidenceId = typeof options["evidence-id"] === "string" ? options["evidence-id"] : "evidence-001";
  const claimText =
    typeof options.claim === "string"
      ? options.claim
      : "The organization publishes signed official endpoint statements and verification artifacts.";

  const manifest: JsonValue = {
    schema: "https://organchor.org/schemas/product-claims.v1.json",
    type: "OrgAnchorProductClaims",
    version: "1.0",
    statement_id: typeof options.id === "string" ? options.id : `organchor-claims-${new Date().getUTCFullYear()}-001`,
    issued_at: new Date().toISOString(),
    organization_ref: {
      name: organization.name ?? "Unknown Organization",
      display_name: organization.display_name ?? organization.name ?? "Unknown Organization"
    },
    products: [
      {
        id: productId,
        name: typeof options["product-name"] === "string" ? options["product-name"] : productId
      }
    ],
    claims: [
      {
        id: claimId,
        product_id: productId,
        claim_text: claimText,
        evidence_refs: [evidenceId],
        limitations: [
          "OrgAnchor proves publication, integrity, and traceability of this claim. It does not prove objective product effectiveness by itself."
        ]
      }
    ]
  };

  await writeJsonFile(out, manifest);
  console.log(`Created claims manifest: ${out}`);
}
