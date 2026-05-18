import { appendIfMissing, ensureDir, pathExists, writeNewJsonFile } from "../core/files.ts";
import type { OrgAnchorConfig } from "../types/artifacts.ts";

const PRIVATE_KEY_IGNORE = `
# OrgAnchor private key material
keys/*.private.json
*.private.json
`;

export async function initCommand(options: Record<string, string | boolean>): Promise<void> {
  await ensureDir("keys");
  await ensureDir("statements");
  await ensureDir("public/verify");
  await ensureDir("reports");
  await ensureDir("claims");
  await ensureDir("evidence");

  await appendIfMissing(".gitignore", PRIVATE_KEY_IGNORE);

  if (!(await pathExists("organchor.config.json")) || options.force === true) {
    const config: OrgAnchorConfig = {
      type: "OrgAnchorConfig",
      version: "1.0",
      organization: {
        name: "Example Org",
        display_name: "Example Organization",
        description: "Short description"
      },
      official_endpoints: {
        website: "https://example.org",
        verify: "https://example.org/verify",
        security: "mailto:security@example.org",
        github: "https://github.com/example"
      },
      domain_security: {
        primary_domain: "example.org",
        dnssec: null,
        spf: null,
        dkim: null,
        dmarc: null,
        registry_lock: null
      },
      auxiliary_names: {
        ens: null
      },
      disaster_recovery: {
        onion: null
      }
    };
    if (options.force === true && (await pathExists("organchor.config.json"))) {
      await writeNewJsonFile("organchor.config.json.new", config);
      console.log("Created organchor.config.json.new because organchor.config.json already exists.");
    } else {
      await writeNewJsonFile("organchor.config.json", config);
      console.log("Created organchor.config.json.");
    }
  }

  console.log("Initialized OrgAnchor workspace.");
}
