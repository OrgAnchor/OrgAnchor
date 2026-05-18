import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { sha256CanonicalJson, sha256Digest } from "./hash.ts";
import type { JsonValue } from "./json.ts";

export interface FileArtifact {
  path: string;
  hash: string;
  size: number;
}

export interface DirectoryArtifact {
  root: string;
  hash: string;
  files: FileArtifact[];
}

export async function hashFile(path: string): Promise<FileArtifact> {
  const data = await readFile(path);
  return {
    path,
    hash: sha256Digest(data),
    size: data.byteLength
  };
}

export async function hashDirectory(root: string): Promise<DirectoryArtifact> {
  const files = await listFiles(root);
  const artifacts: FileArtifact[] = [];
  for (const file of files) {
    const artifact = await hashFile(file);
    artifacts.push({
      path: normalizePath(relative(root, file)),
      hash: artifact.hash,
      size: artifact.size
    });
  }

  const manifest: JsonValue = {
    type: "OrgAnchorDirectoryDigest",
    version: "1.0",
    files: artifacts.map((artifact) => ({
      path: artifact.path,
      hash: artifact.hash,
      size: artifact.size
    }))
  };

  return {
    root,
    hash: sha256CanonicalJson(manifest),
    files: artifacts
  };
}

async function listFiles(root: string): Promise<string[]> {
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) {
    throw new Error(`${root} is not a directory`);
  }
  const result: string[] = [];
  await walk(root, result);
  return result.sort((a, b) => normalizePath(a).localeCompare(normalizePath(b)));
}

async function walk(dir: string, result: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, result);
      continue;
    }
    if (entry.isFile()) {
      result.push(path);
    }
  }
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
