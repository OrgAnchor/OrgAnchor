import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("migration signed by old root authority links old and new authorities", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-migration-"));
  try {
    createOldAndNewAuthorities(workspace);

    const create = run(workspace, [
      "migrate",
      "create",
      "--old-authority",
      "root-authority-old.json",
      "--new-authority",
      "root-authority-new.json",
      "--out",
      "statements/migration-2026-001.json",
      "--reason",
      "Move from pilot root authority to operational root authority."
    ]);
    assert.match(create.stdout, /Created migration statement/);

    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/old-a.private.json",
      "--old-authority",
      "root-authority-old.json",
      "--in",
      "statements/migration-2026-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/old-b.private.json",
      "--old-authority",
      "root-authority-old.json",
      "--in",
      "statements/migration-2026-001.json",
      "--append"
    ]);

    const verify = run(workspace, [
      "migrate",
      "verify",
      "--old-authority",
      "root-authority-old.json",
      "--new-authority",
      "root-authority-new.json",
      "--in",
      "statements/migration-2026-001.json",
      "--sig",
      "statements/migration-2026-001.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
    assert.match(verify.stdout, /Valid old-authority signatures: old-a, old-b/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("migration verification fails when migration content is modified", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-migration-tamper-"));
  try {
    createOldAndNewAuthorities(workspace);
    createAndSignMigration(workspace);

    const migrationPath = join(workspace, "statements", "migration-2026-001.json");
    const migration = JSON.parse(readFileSync(migrationPath, "utf8"));
    migration.reason = "tampered reason";
    writeFileSync(migrationPath, `${JSON.stringify(migration, null, 2)}\n`, "utf8");

    const verify = run(
      workspace,
      [
        "migrate",
        "verify",
        "--old-authority",
        "root-authority-old.json",
        "--new-authority",
        "root-authority-new.json",
        "--in",
        "statements/migration-2026-001.json",
        "--sig",
        "statements/migration-2026-001.json.sig"
      ],
      1
    );
    assert.match(verify.stdout, /FAIL/);
    assert.match(verify.stdout, /Statement hash mismatch/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("migration verification fails when old authority threshold is not met", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-migration-threshold-"));
  try {
    createOldAndNewAuthorities(workspace);
    run(workspace, [
      "migrate",
      "create",
      "--old-authority",
      "root-authority-old.json",
      "--new-authority",
      "root-authority-new.json",
      "--out",
      "statements/migration-2026-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/old-a.private.json",
      "--old-authority",
      "root-authority-old.json",
      "--in",
      "statements/migration-2026-001.json"
    ]);

    const verify = run(
      workspace,
      [
        "migrate",
        "verify",
        "--old-authority",
        "root-authority-old.json",
        "--new-authority",
        "root-authority-new.json",
        "--in",
        "statements/migration-2026-001.json",
        "--sig",
        "statements/migration-2026-001.json.sig"
      ],
      1
    );
    assert.match(verify.stdout, /threshold not met/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("migration verification fails when supplied new authority does not match migration", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-migration-new-mismatch-"));
  try {
    createOldAndNewAuthorities(workspace);
    createAndSignMigration(workspace);
    run(workspace, ["key", "generate", "--id", "wrong-new"]);
    run(workspace, [
      "authority",
      "create",
      "--key",
      "keys/wrong-new.private.json",
      "--id",
      "root-authority-wrong",
      "--out",
      "root-authority-wrong.json"
    ]);

    const verify = run(
      workspace,
      [
        "migrate",
        "verify",
        "--old-authority",
        "root-authority-old.json",
        "--new-authority",
        "root-authority-wrong.json",
        "--in",
        "statements/migration-2026-001.json",
        "--sig",
        "statements/migration-2026-001.json.sig"
      ],
      1
    );
    assert.match(verify.stdout, /new_root_authority_hash does not match/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("key rotate-plan creates next authority that can be used for migration", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-key-rotate-plan-"));
  try {
    createOldAndNewAuthorities(workspace);
    run(workspace, ["key", "generate", "--id", "old-d"]);
    run(workspace, ["key", "public", "--key", "keys/old-d.private.json"]);

    const rotate = run(workspace, [
      "key",
      "rotate-plan",
      "--authority",
      "root-authority-old.json",
      "--replace-key",
      "old-c",
      "--new-key",
      "keys/old-d.public.json",
      "--out",
      "root-authority-rotated.json",
      "--plan-out",
      "statements/key-rotation-plan-2026-001.json",
      "--new-authority-id",
      "root-authority-rotated"
    ]);
    assert.match(rotate.stdout, /Created next root authority/);
    assert.match(rotate.stdout, /Replaced key: old-c/);
    assert.match(rotate.stdout, /Added key: old-d/);

    const rotated = JSON.parse(readFileSync(join(workspace, "root-authority-rotated.json"), "utf8"));
    assert.equal(rotated.authority_id, "root-authority-rotated");
    assert.deepEqual(rotated.keys.map((key: { id: string }) => key.id), ["old-a", "old-b", "old-d"]);
    assert.equal(rotated.threshold.required, 2);
    const plan = JSON.parse(readFileSync(join(workspace, "statements", "key-rotation-plan-2026-001.json"), "utf8"));
    assert.equal(plan.replaced_key_id, "old-c");
    assert.equal(plan.added_key_id, "old-d");

    run(workspace, [
      "migrate",
      "create",
      "--old-authority",
      "root-authority-old.json",
      "--new-authority",
      "root-authority-rotated.json",
      "--out",
      "statements/migration-2026-001.json",
      "--reason",
      "Replace root member old-c with old-d."
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/old-a.private.json",
      "--old-authority",
      "root-authority-old.json",
      "--in",
      "statements/migration-2026-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/old-b.private.json",
      "--old-authority",
      "root-authority-old.json",
      "--in",
      "statements/migration-2026-001.json",
      "--append"
    ]);
    const verify = run(workspace, [
      "migrate",
      "verify",
      "--old-authority",
      "root-authority-old.json",
      "--new-authority",
      "root-authority-rotated.json",
      "--in",
      "statements/migration-2026-001.json",
      "--sig",
      "statements/migration-2026-001.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("authority change-plan moves 1-of-1 pilot authority to 2-of-3 production authority", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-authority-change-1-to-3-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "pilot-a"]);
    run(workspace, ["key", "generate", "--id", "production-b"]);
    run(workspace, ["key", "generate", "--id", "production-c"]);
    run(workspace, ["key", "public", "--key", "keys/production-b.private.json"]);
    run(workspace, ["key", "public", "--key", "keys/production-c.private.json"]);
    run(workspace, [
      "authority",
      "create",
      "--key",
      "keys/pilot-a.private.json",
      "--id",
      "root-authority-pilot",
      "--out",
      "root-authority-pilot.json"
    ]);

    const change = run(workspace, [
      "authority",
      "change-plan",
      "--old-authority",
      "root-authority-pilot.json",
      "--add-keys",
      "keys/production-b.public.json,keys/production-c.public.json",
      "--threshold",
      "2",
      "--out",
      "root-authority-production.json",
      "--plan-out",
      "statements/root-authority-change-plan-2026-001.json",
      "--new-authority-id",
      "root-authority-production",
      "--reason",
      "Move from single-custodian pilot authority to 2-of-3 production authority."
    ]);
    assert.match(change.stdout, /Created root authority change plan/);
    assert.match(change.stdout, /Retained keys: pilot-a/);
    assert.match(change.stdout, /Added keys: production-b, production-c/);
    assert.match(change.stdout, /New threshold: 2-of-3/);

    const nextAuthority = JSON.parse(readFileSync(join(workspace, "root-authority-production.json"), "utf8"));
    assert.deepEqual(nextAuthority.keys.map((key: { id: string }) => key.id), ["pilot-a", "production-b", "production-c"]);
    assert.equal(nextAuthority.threshold.required, 2);
    assert.equal(nextAuthority.threshold.total, 3);
    const plan = JSON.parse(readFileSync(join(workspace, "statements", "root-authority-change-plan-2026-001.json"), "utf8"));
    assert.equal(plan.type, "OrgAnchorRootAuthorityChangePlan");
    assert.deepEqual(plan.changes.retained_key_ids, ["pilot-a"]);
    assert.deepEqual(plan.changes.added_key_ids, ["production-b", "production-c"]);
    assert.deepEqual(plan.changes.removed_key_ids, []);
    assert.equal(plan.changes.threshold_changed, true);

    run(workspace, [
      "migrate",
      "create",
      "--old-authority",
      "root-authority-pilot.json",
      "--new-authority",
      "root-authority-production.json",
      "--out",
      "statements/migration-2026-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/pilot-a.private.json",
      "--old-authority",
      "root-authority-pilot.json",
      "--in",
      "statements/migration-2026-001.json"
    ]);
    const verify = run(workspace, [
      "migrate",
      "verify",
      "--old-authority",
      "root-authority-pilot.json",
      "--new-authority",
      "root-authority-production.json",
      "--in",
      "statements/migration-2026-001.json",
      "--sig",
      "statements/migration-2026-001.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("authority change-plan expands 2-of-3 authority to 3-of-5", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-authority-change-3-to-5-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-a"]);
    run(workspace, ["key", "generate", "--id", "root-b"]);
    run(workspace, ["key", "generate", "--id", "root-c"]);
    run(workspace, ["key", "generate", "--id", "root-d"]);
    run(workspace, ["key", "generate", "--id", "root-e"]);
    run(workspace, ["key", "public", "--key", "keys/root-d.private.json"]);
    run(workspace, ["key", "public", "--key", "keys/root-e.private.json"]);
    run(workspace, [
      "authority",
      "create",
      "--keys",
      "keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json",
      "--threshold",
      "2",
      "--id",
      "root-authority-2026",
      "--out",
      "root-authority-2026.json"
    ]);

    run(workspace, [
      "authority",
      "change-plan",
      "--old-authority",
      "root-authority-2026.json",
      "--add-keys",
      "keys/root-d.public.json,keys/root-e.public.json",
      "--threshold",
      "3",
      "--out",
      "root-authority-2027.json",
      "--plan-out",
      "statements/root-authority-change-plan-2027-001.json",
      "--new-authority-id",
      "root-authority-2027"
    ]);

    const nextAuthority = JSON.parse(readFileSync(join(workspace, "root-authority-2027.json"), "utf8"));
    assert.deepEqual(nextAuthority.keys.map((key: { id: string }) => key.id), ["root-a", "root-b", "root-c", "root-d", "root-e"]);
    assert.equal(nextAuthority.threshold.required, 3);
    assert.equal(nextAuthority.threshold.total, 5);
    const plan = JSON.parse(readFileSync(join(workspace, "statements", "root-authority-change-plan-2027-001.json"), "utf8"));
    assert.deepEqual(plan.changes.retained_key_ids, ["root-a", "root-b", "root-c"]);
    assert.deepEqual(plan.changes.added_key_ids, ["root-d", "root-e"]);
    assert.equal(plan.changes.threshold_changed, true);

    run(workspace, [
      "migrate",
      "create",
      "--old-authority",
      "root-authority-2026.json",
      "--new-authority",
      "root-authority-2027.json",
      "--out",
      "statements/migration-2027-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/root-a.private.json",
      "--old-authority",
      "root-authority-2026.json",
      "--in",
      "statements/migration-2027-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/root-b.private.json",
      "--old-authority",
      "root-authority-2026.json",
      "--in",
      "statements/migration-2027-001.json",
      "--append"
    ]);
    const verify = run(workspace, [
      "migrate",
      "verify",
      "--old-authority",
      "root-authority-2026.json",
      "--new-authority",
      "root-authority-2027.json",
      "--in",
      "statements/migration-2027-001.json",
      "--sig",
      "statements/migration-2027-001.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("authority change-plan requires an explicit threshold", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-authority-change-threshold-required-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-a"]);
    run(workspace, ["key", "generate", "--id", "root-b"]);
    run(workspace, ["key", "public", "--key", "keys/root-b.private.json"]);
    run(workspace, [
      "authority",
      "create",
      "--key",
      "keys/root-a.private.json",
      "--id",
      "root-authority-2026",
      "--out",
      "root-authority-2026.json"
    ]);

    const change = run(
      workspace,
      [
        "authority",
        "change-plan",
        "--old-authority",
        "root-authority-2026.json",
        "--add-keys",
        "keys/root-b.public.json",
        "--out",
        "root-authority-next.json"
      ],
      1
    );
    assert.match(change.stderr, /--threshold is required/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("authority change-plan can remove a retained root member", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-authority-change-remove-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-a"]);
    run(workspace, ["key", "generate", "--id", "root-b"]);
    run(workspace, ["key", "generate", "--id", "root-c"]);
    run(workspace, [
      "authority",
      "create",
      "--keys",
      "keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json",
      "--threshold",
      "2",
      "--id",
      "root-authority-2026",
      "--out",
      "root-authority-2026.json"
    ]);

    const change = run(workspace, [
      "authority",
      "change-plan",
      "--old-authority",
      "root-authority-2026.json",
      "--remove",
      "root-c",
      "--threshold",
      "2",
      "--out",
      "root-authority-2027.json",
      "--plan-out",
      "statements/root-authority-change-plan-remove-2027-001.json",
      "--new-authority-id",
      "root-authority-2027"
    ]);
    assert.match(change.stdout, /Removed keys: root-c/);

    const nextAuthority = JSON.parse(readFileSync(join(workspace, "root-authority-2027.json"), "utf8"));
    assert.deepEqual(nextAuthority.keys.map((key: { id: string }) => key.id), ["root-a", "root-b"]);
    assert.equal(nextAuthority.threshold.required, 2);
    assert.equal(nextAuthority.threshold.total, 2);
    const plan = JSON.parse(readFileSync(join(workspace, "statements", "root-authority-change-plan-remove-2027-001.json"), "utf8"));
    assert.deepEqual(plan.changes.retained_key_ids, ["root-a", "root-b"]);
    assert.deepEqual(plan.changes.added_key_ids, []);
    assert.deepEqual(plan.changes.removed_key_ids, ["root-c"]);

    run(workspace, [
      "migrate",
      "create",
      "--old-authority",
      "root-authority-2026.json",
      "--new-authority",
      "root-authority-2027.json",
      "--out",
      "statements/migration-2027-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/root-a.private.json",
      "--old-authority",
      "root-authority-2026.json",
      "--in",
      "statements/migration-2027-001.json"
    ]);
    run(workspace, [
      "migrate",
      "sign",
      "--key",
      "keys/root-b.private.json",
      "--old-authority",
      "root-authority-2026.json",
      "--in",
      "statements/migration-2027-001.json",
      "--append"
    ]);
    const verify = run(workspace, [
      "migrate",
      "verify",
      "--old-authority",
      "root-authority-2026.json",
      "--new-authority",
      "root-authority-2027.json",
      "--in",
      "statements/migration-2027-001.json",
      "--sig",
      "statements/migration-2027-001.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createOldAndNewAuthorities(workspace: string): void {
  mkdirSync(join(workspace, "statements"), { recursive: true });
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "old-a"]);
  run(workspace, ["key", "generate", "--id", "old-b"]);
  run(workspace, ["key", "generate", "--id", "old-c"]);
  run(workspace, ["key", "generate", "--id", "new-a"]);
  run(workspace, ["key", "generate", "--id", "new-b"]);
  run(workspace, ["key", "generate", "--id", "new-c"]);
  run(workspace, [
    "authority",
    "create",
    "--keys",
    "keys/old-a.private.json,keys/old-b.private.json,keys/old-c.private.json",
    "--threshold",
    "2",
    "--id",
    "root-authority-old",
    "--out",
    "root-authority-old.json"
  ]);
  run(workspace, [
    "authority",
    "create",
    "--keys",
    "keys/new-a.private.json,keys/new-b.private.json,keys/new-c.private.json",
    "--threshold",
    "2",
    "--id",
    "root-authority-new",
    "--out",
    "root-authority-new.json"
  ]);
}

function createAndSignMigration(workspace: string): void {
  run(workspace, [
    "migrate",
    "create",
    "--old-authority",
    "root-authority-old.json",
    "--new-authority",
    "root-authority-new.json",
    "--out",
    "statements/migration-2026-001.json"
  ]);
  run(workspace, [
    "migrate",
    "sign",
    "--key",
    "keys/old-a.private.json",
    "--old-authority",
    "root-authority-old.json",
    "--in",
    "statements/migration-2026-001.json"
  ]);
  run(workspace, [
    "migrate",
    "sign",
    "--key",
    "keys/old-b.private.json",
    "--old-authority",
    "root-authority-old.json",
    "--in",
    "statements/migration-2026-001.json",
    "--append"
  ]);
}

function run(workspace: string, args: string[], expectedStatus = 0): { stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: workspace,
    encoding: "utf8"
  });
  assert.equal(
    result.status,
    expectedStatus,
    `organchor ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}
