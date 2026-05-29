import { basename } from "node:path";
import { hashFile } from "../core/artifacts.ts";
import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { asObject } from "../core/validate.ts";
import type { JsonValue } from "../core/json.ts";

export async function evidenceAddCommand(options: Record<string, string | boolean>): Promise<void> {
  const file = requireOption(options.file, "--file is required");
  const manifestPath = typeof options.manifest === "string" ? options.manifest : "evidence/evidence-manifest.json";
  const manifest = asObject(validateEvidenceManifest(await readJsonFile(manifestPath)), "evidence manifest");
  const artifact = await hashFile(file);
  const id = typeof options.id === "string" ? options.id : "evidence-001";
  const title = typeof options.title === "string" ? options.title : basename(file);
  const issuerType = typeof options["issuer-type"] === "string" ? options["issuer-type"] : "first_party";
  const mediaType = typeof options["media-type"] === "string" ? options["media-type"] : mediaTypeFromPath(file);
  const relation = typeof options.relation === "string" ? options.relation : "supports_claim";
  const claimId = typeof options["claim-id"] === "string" ? options["claim-id"] : "claim-001";
  const uri = typeof options.uri === "string" ? options.uri : null;
  const locationType = typeof options["location-type"] === "string" ? options["location-type"] : inferLocationType(uri);
  const reproducibility = typeof options.reproducibility === "string" ? options.reproducibility : "not_specified";
  const evidenceStrength = typeof options["evidence-strength"] === "string" ? options["evidence-strength"] : "not_assessed";
  const subjectType = typeof options["subject-type"] === "string" ? options["subject-type"] : "";
  const subjectId = typeof options["subject-id"] === "string" ? options["subject-id"] : "";
  const subjectScope = typeof options["subject-scope"] === "string" ? options["subject-scope"] : "";
  if ((subjectType && !subjectId) || (!subjectType && subjectId)) {
    throw new Error("--subject-type and --subject-id must be provided together");
  }
  const validUntil = typeof options["valid-until"] === "string" ? options["valid-until"] : null;
  if (validUntil && Number.isNaN(Date.parse(validUntil))) {
    throw new Error("--valid-until must be a valid date or ISO timestamp");
  }
  const limitations = parseList(options.limitations);

  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : [];
  if (evidence.some((item) => asObject(item, "evidence item").id === id)) {
    throw new Error(`Evidence id "${id}" already exists`);
  }
  const locations: JsonValue[] = [
    {
      type: "local",
      uri: file
    }
  ];
  if (uri) {
    locations.push({
      type: locationType,
      uri
    });
  }

  const item: Record<string, JsonValue> = {
    id,
    title,
    issuer_type: issuerType,
    media_type: mediaType,
    reproducibility,
    evidence_strength: evidenceStrength,
    size: artifact.size,
    hash: artifact.hash,
    locations,
    relations: [
      {
        type: relation,
        claim_id: claimId
      }
    ]
  };
  if (subjectType && subjectId) {
    item.subject = {
      subject_type: subjectType,
      subject_id: subjectId
    };
    if (subjectScope) {
      (item.subject as Record<string, JsonValue>).scope_text = subjectScope;
    }
  }
  if (validUntil) item.valid_until = new Date(validUntil).toISOString();
  if (limitations.length > 0) item.limitations = limitations;
  evidence.push(item);
  manifest.evidence = evidence as JsonValue[];
  await writeJsonFile(manifestPath, manifest);
  console.log(`Added evidence item: ${id}`);
  console.log(`Evidence hash: ${artifact.hash}`);
  if (uri) console.log(`Evidence location: ${locationType} ${uri}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

function mediaTypeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function inferLocationType(uri: string | null): string {
  if (!uri) return "external";
  if (uri.startsWith("ipfs://")) return "ipfs";
  if (uri.startsWith("ar://") || uri.startsWith("arweave://")) return "arweave";
  if (uri.startsWith("https://") || uri.startsWith("http://")) return "https";
  return "external";
}

function parseList(value: string | boolean | undefined): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}
