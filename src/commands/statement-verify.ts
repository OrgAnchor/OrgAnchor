import { readJsonFile } from "../core/json.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { validateOfficialStatement, validateRootAuthority, validateSignatureFile } from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";

export async function statementVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = requireOption(options.in, "--in is required");
  const sigPath = requireOption(options.sig, "--sig is required");
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";

  const statement = validateOfficialStatement(await readJsonFile(input));
  const signature = validateSignatureFile(await readJsonFile(sigPath));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  const authorityHash = sha256CanonicalJson(authority);

  const errors: string[] = [];
  if (statement.root_authority_hash !== authorityHash) {
    errors.push("Statement root_authority_hash does not match authority file");
  }
  if (typeof options["expected-authority-hash"] === "string" && options["expected-authority-hash"] !== authorityHash) {
    errors.push("Authority hash does not match --expected-authority-hash");
  }

  const result = verifySignatureFile(statement, signature, authority);
  errors.push(...result.errors);

  if (errors.length > 0) {
    console.log("FAIL");
    for (const error of errors) console.log(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("PASS");
  console.log(`Statement hash: ${result.statement_hash}`);
  console.log(`Authority hash: ${authorityHash}`);
  console.log(`Valid signatures: ${result.valid_signatures.join(", ")}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
