import { lstat, readdir, readFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";

interface SafetyFinding {
  code: string;
  path: string;
  detail: string;
}

export interface PublicSafetyReport {
  type: "OrgAnchorPublicSafetyReport";
  version: "0.1";
  status: "PASS" | "FAIL";
  directory: string;
  files_scanned: number;
  findings: SafetyFinding[];
}

const SENSITIVE_FILENAME = /(^|[._-])(private|secret|secrets|credential|credentials|wallet|recovery)([._-]|$)/i;
const SENSITIVE_JSON_KEYS = new Set([
  "private_key",
  "privatekey",
  "private_key_material",
  "secret_key",
  "secretkey",
  "api_secret",
  "apisecret",
  "client_secret",
  "clientsecret",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "mnemonic",
  "seed_phrase",
  "seedphrase",
  "jwt"
]);
const SECRET_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["PRIVATE_KEY_PEM", /-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----/],
  ["AWS_ACCESS_KEY", /\bAKIA[0-9A-Z]{16}\b/],
  ["GITHUB_TOKEN", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["NPM_TOKEN", /\bnpm_[A-Za-z0-9]{20,}\b/],
  ["STRIPE_LIVE_SECRET", /\bsk_live_[A-Za-z0-9]{16,}\b/]
];
const MAX_STRUCTURED_SCAN_BYTES = 32 * 1024 * 1024;

export async function safetyScanCommand(options: Record<string, string | boolean>): Promise<void> {
  const directory = typeof options.dir === "string" ? options.dir : "public";
  const report = await scanPublicDirectory(directory);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "FAIL") process.exitCode = 1;
}

export async function scanPublicDirectory(directory: string): Promise<PublicSafetyReport> {
  const root = resolve(directory);
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory()) throw new Error(`Safety scan target is not a directory: ${directory}`);

  const findings: SafetyFinding[] = [];
  let filesScanned = 0;

  async function visit(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(current, entry.name);
      const displayPath = relative(root, fullPath).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) {
        findings.push({
          code: "SYMLINK_IN_PUBLIC_OUTPUT",
          path: displayPath,
          detail: "Public output contains a symbolic link; review the resolved target before publishing."
        });
        continue;
      }
      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      filesScanned++;
      if (SENSITIVE_FILENAME.test(basename(entry.name))) {
        findings.push({
          code: "SENSITIVE_FILENAME",
          path: displayPath,
          detail: "Filename indicates private, secret, credential, wallet, or recovery material."
        });
      }

      const content = await readFile(fullPath);
      const text = content.toString("utf8");
      for (const [code, pattern] of SECRET_TEXT_PATTERNS) {
        if (pattern.test(text)) {
          findings.push({
            code,
            path: displayPath,
            detail: "File contains a high-confidence private credential marker."
          });
        }
      }

      if (entry.name.toLowerCase().endsWith(".json") && content.byteLength <= MAX_STRUCTURED_SCAN_BYTES) {
        try {
          inspectJson(JSON.parse(text) as unknown, displayPath, findings);
        } catch {
          // JSON validity is checked by the package verifier; this command only checks disclosure risk.
        }
      }
    }
  }

  await visit(root);
  return {
    type: "OrgAnchorPublicSafetyReport",
    version: "0.1",
    status: findings.length === 0 ? "PASS" : "FAIL",
    directory: root,
    files_scanned: filesScanned,
    findings
  };
}

function inspectJson(value: unknown, path: string, findings: SafetyFinding[]): void {
  if (Array.isArray(value)) {
    for (const item of value) inspectJson(item, path, findings);
    return;
  }
  if (!value || typeof value !== "object") return;

  const object = value as Record<string, unknown>;
  if (object.type === "OrgAnchorPrivateKey") {
    addJsonFinding(findings, path, "ORGANCHOR_PRIVATE_KEY", "JSON contains an OrgAnchor private-key object.");
  }
  if (typeof object.kty === "string" && (typeof object.d === "string" || typeof object.priv === "string")) {
    addJsonFinding(findings, path, "PRIVATE_JWK", "JSON contains private JWK key material.");
  }
  if (object.format === "pkcs8-der" && typeof object.data === "string") {
    addJsonFinding(findings, path, "PRIVATE_DER", "JSON contains PKCS#8 private key material.");
  }

  for (const [key, child] of Object.entries(object)) {
    const normalized = key.replaceAll("-", "_").toLowerCase();
    if (SENSITIVE_JSON_KEYS.has(normalized) && typeof child === "string" && child.length > 0) {
      addJsonFinding(findings, path, "SENSITIVE_JSON_FIELD", `JSON contains the sensitive field ${key}.`);
    }
    inspectJson(child, path, findings);
  }
}

function addJsonFinding(findings: SafetyFinding[], path: string, code: string, detail: string): void {
  if (!findings.some((finding) => finding.path === path && finding.code === code && finding.detail === detail)) {
    findings.push({ code, path, detail });
  }
}
