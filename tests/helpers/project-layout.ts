import { readFileSync } from "node:fs";
import { join } from "node:path";

const documentationAreas = [
  "docs/project/README.md",
  "docs/protocol/README.md",
  "docs/guides/README.md",
  "docs/operations/README.md",
  "docs/evaluations/README.md",
  "docs/outreach/README.md",
  "docs/history/README.md"
];

export function readDocumentationMap(repoRoot: string): string {
  return ["DOCS_INDEX.md", ...documentationAreas]
    .map((path) => readFileSync(join(repoRoot, path), "utf8"))
    .join("\n\n");
}

export function packageIncludes(files: string[] | undefined, target: string): boolean {
  const normalizedTarget = normalize(target);
  let included = false;

  for (const rawRule of files ?? []) {
    const excluded = rawRule.startsWith("!");
    const rule = normalize(excluded ? rawRule.slice(1) : rawRule);
    if (!matches(rule, normalizedTarget)) continue;
    included = !excluded;
  }

  return included;
}

function matches(rule: string, target: string): boolean {
  if (rule.endsWith("/")) return target.startsWith(rule);
  return rule === target;
}

function normalize(value: string): string {
  return value.replaceAll("\\", "/");
}
