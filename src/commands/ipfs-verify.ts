import { hashDirectory } from "../core/artifacts.ts";
import { sha256Digest } from "../core/hash.ts";

export async function ipfsVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const expectedHash = requireOption(options["expected-hash"], "--expected-hash is required");
  if (typeof options.dir === "string") {
    const artifact = await hashDirectory(options.dir);
    if (artifact.hash !== expectedHash) {
      console.log("FAIL");
      console.log(`Expected hash: ${expectedHash}`);
      console.log(`Actual hash: ${artifact.hash}`);
      process.exitCode = 1;
      return;
    }

    console.log("PASS");
    console.log(`Directory: ${options.dir}`);
    console.log(`Directory hash: ${artifact.hash}`);
    return;
  }

  const cid = requireOption(options.cid, "--cid or --dir is required");
  const api = typeof options.api === "string" ? options.api : "http://127.0.0.1:5001";
  const actualHash = await hashCidViaKubo(api, cid);
  if (actualHash !== expectedHash) {
    console.log("FAIL");
    console.log(`Expected hash: ${expectedHash}`);
    console.log(`Actual hash: ${actualHash}`);
    process.exitCode = 1;
    return;
  }

  console.log("PASS");
  console.log(`CID: ${cid}`);
  console.log(`Content hash: ${actualHash}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

async function hashCidViaKubo(api: string, cid: string): Promise<string> {
  const url = new URL("/api/v0/cat", api);
  url.searchParams.set("arg", cid);
  let response: Response;
  try {
    response = await fetch(url, { method: "POST" });
  } catch {
    throw new Error(`Unable to reach Kubo API at ${api}.`);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Kubo cat failed (${response.status}): ${body}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  return sha256Digest(data);
}
