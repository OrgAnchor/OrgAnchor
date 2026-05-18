import { writeFile } from "node:fs/promises";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";
import { generateOnionConfig, renderOnionConfigMarkdown } from "../onion/config.ts";

export async function onionConfigGenerateCommand(options: Record<string, string | boolean>): Promise<void> {
  const domain = typeof options.domain === "string" ? options.domain : typeof options.onion === "string" ? options.onion : undefined;
  if (!domain) {
    throw new Error("onion config generate requires --domain <v3-address.onion>");
  }

  const outDir = typeof options.out === "string" ? options.out : "onion";
  const hiddenServiceDir = typeof options["hidden-service-dir"] === "string" ? options["hidden-service-dir"] : undefined;
  const target = typeof options.target === "string" ? options.target : undefined;
  const publicPort = typeof options.port === "string" ? Number(options.port) : undefined;

  const plan = generateOnionConfig({
    onionAddress: domain,
    ...(hiddenServiceDir !== undefined ? { hiddenServiceDir } : {}),
    ...(target !== undefined ? { target } : {}),
    ...(publicPort !== undefined ? { publicPort } : {})
  });

  await ensureDir(outDir);
  await writeJsonFile(`${outDir}/onion-config.json`, {
    type: "OrgAnchorOnionConfigPlan",
    version: "1.0",
    ...plan
  } as unknown as JsonValue);
  await writeFile(`${outDir}/torrc-snippet.txt`, `${plan.torrc}\n`, "utf8");
  await writeFile(`${outDir}/onion-deployment.md`, renderOnionConfigMarkdown(plan), "utf8");

  console.log("Onion config generated.");
  console.log(`Onion: ${plan.onion_address}`);
  console.log(`Verify URL: ${plan.verify_url}`);
  console.log(`torrc snippet: ${outDir}/torrc-snippet.txt`);
  console.log(`Deployment notes: ${outDir}/onion-deployment.md`);
}
