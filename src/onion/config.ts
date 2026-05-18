import { validateOnionAddress } from "./validate.ts";

export interface OnionConfigOptions {
  onionAddress: string;
  hiddenServiceDir?: string;
  target?: string;
  publicPort?: number;
}

export interface OnionConfigPlan {
  onion_address: string;
  verify_url: string;
  torrc: string;
  deployment_notes: string[];
}

export function generateOnionConfig(options: OnionConfigOptions): OnionConfigPlan {
  const validation = validateOnionAddress(options.onionAddress);
  if (!validation.ok) {
    throw new Error(validation.reason ?? "Invalid onion address");
  }

  const hiddenServiceDir = options.hiddenServiceDir ?? "/var/lib/tor/organchor";
  const target = options.target ?? "127.0.0.1:8080";
  const publicPort = options.publicPort ?? 80;
  const onionAddress = validation.normalized;

  return {
    onion_address: onionAddress,
    verify_url: `http://${onionAddress}/verify/`,
    torrc: [
      `HiddenServiceDir ${hiddenServiceDir}`,
      `HiddenServicePort ${publicPort} ${target}`
    ].join("\n"),
    deployment_notes: [
      "OrgAnchor does not run Tor or guarantee that the onion service is online.",
      "Serve the same public/verify directory at the onion /verify path.",
      "Add the onion address to official-endpoints.json under disaster_recovery.onion, then sign the statement again.",
      "Publish the updated signed statement through the normal /verify, IPFS, and Arweave paths."
    ]
  };
}

export function renderOnionConfigMarkdown(plan: OnionConfigPlan): string {
  return `# Onion Disaster Recovery Entry

Onion address: \`${plan.onion_address}\`

Verify URL: \`${plan.verify_url}\`

## torrc

\`\`\`text
${plan.torrc}
\`\`\`

## Notes

${plan.deployment_notes.map((note) => `- ${note}`).join("\n")}
`;
}
