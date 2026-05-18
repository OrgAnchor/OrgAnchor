import { execFile } from "node:child_process";
import { chmod } from "node:fs/promises";
import { platform } from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function restrictPrivateFilePermissions(path: string): Promise<void> {
  if (platform() !== "win32") {
    await chmod(path, 0o600);
    return;
  }

  const currentUserSid = process.env.USERDOMAIN && process.env.USERNAME
    ? `${process.env.USERDOMAIN}\\${process.env.USERNAME}`
    : process.env.USERNAME;
  if (!currentUserSid) {
    throw new Error("Cannot restrict private key ACL because the current Windows user is unknown");
  }

  await execFileAsync("icacls", [
    path,
    "/inheritance:r",
    "/grant:r",
    `${currentUserSid}:F`,
    "/grant:r",
    "*S-1-5-18:F",
    "/grant:r",
    "*S-1-5-32-544:F"
  ]);
}
