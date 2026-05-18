import { readJsonFile } from "../core/json.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { validateOfficialStatement } from "../core/validate.ts";

export async function statementHashCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = requireOption(options.in, "--in is required");
  const statement = validateOfficialStatement(await readJsonFile(input));
  console.log(sha256CanonicalJson(statement));
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
