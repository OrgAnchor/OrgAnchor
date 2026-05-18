import { createEnsPlanFromStatementFile, writeEnsPlan } from "../auxiliary-names/ens.ts";

export async function ensPlanCommand(options: Record<string, string | boolean>): Promise<void> {
  const ensName = typeof options.name === "string" ? options.name : typeof options._ === "string" ? options._ : undefined;
  if (!ensName) {
    throw new Error("ens plan requires an ENS name, e.g. organchor ens plan example.eth --statement statements/official-endpoints.json");
  }
  const statementPath = typeof options.statement === "string" ? options.statement : "statements/official-endpoints.json";
  const outputDir = typeof options.out === "string" ? options.out : "ens";
  const ipfsCid = typeof options["ipfs-cid"] === "string" ? options["ipfs-cid"] : undefined;

  const plan = await createEnsPlanFromStatementFile(ensName, statementPath, {
    ...(ipfsCid !== undefined ? { ipfsCid } : {})
  });
  await writeEnsPlan(plan, outputDir);

  console.log("ENS plan generated.");
  console.log(`ENS: ${plan.ens_name}`);
  console.log(`Statement hash: ${plan.statement_hash}`);
  console.log(`Root authority hash: ${plan.root_authority_hash}`);
  if (plan.recommended_contenthash.value) {
    console.log(`Recommended contenthash: ${plan.recommended_contenthash.value}`);
  }
  console.log(`Plan JSON: ${outputDir}/ens-plan.json`);
  console.log(`Plan Markdown: ${outputDir}/ens-plan.md`);
}
