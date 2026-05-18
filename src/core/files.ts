import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { JsonValue } from "./json.ts";

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function writeJsonFile(path: string, value: JsonValue, mode = 0o644): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, body, { encoding: "utf8", mode });
}

export async function writeNewJsonFile(path: string, value: JsonValue, mode = 0o644): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, body, { encoding: "utf8", mode, flag: "wx" });
}

export async function appendIfMissing(path: string, content: string): Promise<void> {
  let existing = "";
  try {
    existing = await readFile(path, "utf8");
  } catch {
    await writeFile(path, content, "utf8");
    return;
  }
  if (!existing.includes(content.trim())) {
    await writeFile(path, `${existing.trimEnd()}\n${content}`, "utf8");
  }
}
