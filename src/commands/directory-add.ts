import { writeJsonFile, pathExists } from "../core/files.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { asObject } from "../core/validate.ts";

export async function directoryAddCommand(options: Record<string, string | boolean>): Promise<void> {
  const originsPath = typeof options.origins === "string" ? options.origins : typeof options.in === "string" ? options.in : "";
  if (!originsPath) throw new Error("directory add requires --origins <directory-origins.json>");
  const origin = normalizeOrigin(typeof options.origin === "string" ? options.origin : typeof options._ === "string" ? options._ : "");
  if (!origin) throw new Error("directory add requires --origin <https://example.org> or positional origin");
  const outPath = typeof options.out === "string" ? options.out : originsPath;
  const generatedAt = typeof options["added-at"] === "string" ? options["added-at"] : new Date().toISOString();
  const input = await readOrCreateOriginsFile(originsPath, options);
  const origins = Array.isArray(input.origins) ? [...input.origins] : [];
  const record = candidateRecord({
    origin,
    options,
    generatedAt
  });
  const existingIndex = origins.findIndex((item) => {
    const candidate = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, JsonValue> : {};
    return normalizeOrigin(optionalString(candidate.origin)) === origin;
  });
  const action = existingIndex >= 0 ? "updated" : "added";
  if (existingIndex >= 0) origins[existingIndex] = mergeExistingRecord(origins[existingIndex] as JsonValue, record);
  else origins.push(record);

  const output: JsonValue = {
    ...input,
    type: optionalString(input.type) || "OrgAnchorDirectoryOrigins",
    version: optionalString(input.version) || "0.1",
    origins
  };
  await writeJsonFile(outPath, output);
  console.log(JSON.stringify({
    type: "OrgAnchorDirectoryAddSummary",
    version: "0.1",
    status: "PASS",
    action,
    origins: originsPath,
    out: outPath,
    origin,
    record_id: optionalString(record.record_id),
    next_step: "Run organchor directory build --origins <file> --verify-origins before treating this candidate as verified."
  }, null, 2));
}

async function readOrCreateOriginsFile(
  path: string,
  options: Record<string, string | boolean>
): Promise<Record<string, JsonValue>> {
  if (await pathExists(path)) return asObject(await readJsonFile(path), "directory origins");
  const nodeOrigin = typeof options["node-origin"] === "string" ? normalizeOrigin(options["node-origin"]) : "";
  if (!nodeOrigin) {
    throw new Error("Cannot create a new origins file without --node-origin <https://directory.example>");
  }
  return {
    type: "OrgAnchorDirectoryOrigins",
    version: "0.1",
    snapshot_id: typeof options["snapshot-id"] === "string" ? options["snapshot-id"] : `directory-origins-${Date.now()}`,
    directory_node: {
      name: typeof options["node-name"] === "string" ? options["node-name"] : "OrgAnchor Directory",
      origin: nodeOrigin,
      policy_url: typeof options["policy-url"] === "string"
        ? options["policy-url"]
        : new URL("/directory/directory-policy.json", `${nodeOrigin}/`).toString()
    },
    origins: []
  };
}

function candidateRecord(options: {
  origin: string;
  options: Record<string, string | boolean>;
  generatedAt: string;
}): Record<string, JsonValue> {
  const hostname = new URL(options.origin).hostname;
  const name = typeof options.options.name === "string" ? options.options.name : hostname;
  const displayName = typeof options.options["display-name"] === "string" ? options.options["display-name"] : name;
  return {
    record_id: typeof options.options["record-id"] === "string" ? options.options["record-id"] : slugFromOrigin(options.origin),
    origin: options.origin,
    organization: {
      name,
      display_name: displayName
    },
    discovery: {
      categories: parseListOption(options.options.category ?? options.options.categories, ["uncategorized"]),
      capabilities: parseListOption(options.options.capability ?? options.options.capabilities, ["not-specified"]),
      regions: parseListOption(options.options.region ?? options.options.regions, ["not-specified"]),
      languages: parseListOption(options.options.language ?? options.options.languages, ["not-specified"])
    },
    source: {
      method: typeof options.options["source-method"] === "string" ? options.options["source-method"] : "manual",
      added_at: options.generatedAt
    },
    limitations: [
      "Directory candidate was added as a source entry only.",
      "Directory record is a summary only.",
      "Agent must verify against the origin package before relying on it."
    ]
  };
}

function mergeExistingRecord(existing: JsonValue, incoming: Record<string, JsonValue>): Record<string, JsonValue> {
  const existingRecord = existing && typeof existing === "object" && !Array.isArray(existing) ? existing as Record<string, JsonValue> : {};
  const existingSource = existingRecord.source && typeof existingRecord.source === "object" && !Array.isArray(existingRecord.source)
    ? existingRecord.source as Record<string, JsonValue>
    : {};
  const incomingSource = incoming.source && typeof incoming.source === "object" && !Array.isArray(incoming.source)
    ? incoming.source as Record<string, JsonValue>
    : {};
  return {
    ...existingRecord,
    ...incoming,
    source: {
      ...existingSource,
      ...incomingSource,
      added_at: optionalString(existingSource.added_at) || optionalString(incomingSource.added_at)
    }
  };
}

function normalizeOrigin(value: string): string {
  if (!value) return "";
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("origin must be an http(s) URL");
  }
  return url.origin;
}

function parseListOption(value: string | boolean | undefined, fallback: string[]): string[] {
  if (typeof value !== "string") return fallback;
  const values = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function slugFromOrigin(origin: string): string {
  return new URL(origin).hostname.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

function optionalString(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}
