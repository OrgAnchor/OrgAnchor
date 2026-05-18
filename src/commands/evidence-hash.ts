import { hashFile } from "../core/artifacts.ts";

export async function evidenceHashCommand(options: Record<string, string | boolean>): Promise<void> {
  const file = requireOption(options.file, "--file is required");
  const artifact = await hashFile(file);
  console.log(artifact.hash);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
