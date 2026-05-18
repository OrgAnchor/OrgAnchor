import { validateOnionAddress } from "../onion/validate.ts";

export async function onionVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.onion === "string" ? options.onion : typeof options._ === "string" ? options._ : undefined;
  if (!input) {
    throw new Error("onion verify requires --onion <v3-address.onion>");
  }

  const result = validateOnionAddress(input);
  if (!result.ok) {
    console.log("FAIL");
    console.log(`Onion: ${result.normalized}`);
    console.log(`Reason: ${result.reason}`);
    process.exitCode = 1;
    return;
  }

  console.log("PASS");
  console.log(`Onion: ${result.normalized}`);
  console.log("Version: v3");
}
