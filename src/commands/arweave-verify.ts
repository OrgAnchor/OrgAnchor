import { hashFile } from "../core/artifacts.ts";
import { sha256Digest } from "../core/hash.ts";

export async function arweaveVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const expectedHash = requireOption(options["expected-hash"], "--expected-hash is required");

  if (typeof options.file === "string") {
    const artifact = await hashFile(options.file);
    if (artifact.hash !== expectedHash) {
      console.log("FAIL");
      console.log(`Expected hash: ${expectedHash}`);
      console.log(`Actual hash: ${artifact.hash}`);
      process.exitCode = 1;
      return;
    }

    console.log("PASS");
    console.log(`File: ${options.file}`);
    console.log(`File hash: ${artifact.hash}`);
    return;
  }

  const tx = requireOption(options.tx, "--tx or --file is required");
  const gateway = typeof options.gateway === "string" ? options.gateway : "https://arweave.net";
  const actualHash = await hashTxViaGateway(gateway, tx);
  if (actualHash !== expectedHash) {
    console.log("FAIL");
    console.log(`Expected hash: ${expectedHash}`);
    console.log(`Actual hash: ${actualHash}`);
    process.exitCode = 1;
    return;
  }

  console.log("PASS");
  console.log(`TX: ${tx}`);
  console.log(`Gateway: ${gateway}`);
  console.log(`Content hash: ${actualHash}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

async function hashTxViaGateway(gateway: string, tx: string): Promise<string> {
  const url = new URL(`/${encodeURIComponent(tx)}`, gateway);
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Unable to reach Arweave gateway at ${gateway}.`);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Arweave gateway fetch failed (${response.status}): ${body}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  return sha256Digest(data);
}
