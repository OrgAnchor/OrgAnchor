import assert from "node:assert/strict";
import test from "node:test";
import { sha256CanonicalJson } from "../src/core/hash.ts";
import { validateOfficialStatement, validateRootAuthority } from "../src/core/validate.ts";
import { generateEd25519PrivateKey, rootAuthorityKeyFromPrivate } from "../src/crypto/ed25519.ts";
import { createSignatureFile, verifySignatureFile } from "../src/crypto/signature.ts";
import type { JsonValue } from "../src/core/json.ts";
import type { OfficialEndpointsStatement, OrgAnchorPrivateKey, RootAuthority } from "../src/types/artifacts.ts";

test("statement signed by root authority verifies", () => {
  const key = generateEd25519PrivateKey("root-2026", fixedDate());
  const authority = makeAuthority([key], 1);
  const statement = makeStatement(authority);
  const signature = createSignatureFile(statement, key, fixedDate());

  const result = verifySignatureFile(statement, signature, authority);

  assert.equal(result.ok, true);
  assert.deepEqual(result.valid_signatures, ["root-2026"]);
});

test("modified statement fails verification", () => {
  const key = generateEd25519PrivateKey("root-2026", fixedDate());
  const authority = makeAuthority([key], 1);
  const statement = makeStatement(authority);
  const signature = createSignatureFile(statement, key, fixedDate());
  const modified = {
    ...statement,
    official_endpoints: {
      ...statement.official_endpoints,
      website: "https://attacker.example"
    }
  };

  const result = verifySignatureFile(modified, signature, authority);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Statement hash mismatch/);
  assert.match(result.errors.join("\n"), /Invalid signature/);
});

test("wrong authority fails verification", () => {
  const key = generateEd25519PrivateKey("root-2026", fixedDate());
  const wrongKey = generateEd25519PrivateKey("wrong-root", fixedDate());
  const authority = makeAuthority([key], 1);
  const wrongAuthority = makeAuthority([wrongKey], 1);
  const statement = makeStatement(authority);
  const signature = createSignatureFile(statement, key, fixedDate());

  const result = verifySignatureFile(statement, signature, wrongAuthority);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /not in root authority/);
  assert.match(result.errors.join("\n"), /threshold not met/);
});

test("root authority threshold must be met", () => {
  const keyA = generateEd25519PrivateKey("root-a", fixedDate());
  const keyB = generateEd25519PrivateKey("root-b", fixedDate());
  const authority = makeAuthority([keyA, keyB], 2);
  const statement = makeStatement(authority);
  const signature = createSignatureFile(statement, keyA, fixedDate());

  const result = verifySignatureFile(statement, signature, authority);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /threshold not met/);
});

test("schema validation fails closed for required fields and unsupported algorithms", () => {
  const key = generateEd25519PrivateKey("root-2026", fixedDate());
  const authority = makeAuthority([key], 1);
  const statement = makeStatement(authority);
  const missingField = { ...statement };
  delete (missingField as Record<string, unknown>).statement_id;

  assert.throws(() => validateOfficialStatement(missingField as JsonValue), /statement\.statement_id/);

  const badAuthority = {
    ...authority,
    keys: [
      {
        ...authority.keys[0],
        algorithm: "ed448"
      }
    ]
  };

  assert.throws(() => validateRootAuthority(badAuthority as unknown as JsonValue), /only ed25519/);
});

function fixedDate(): Date {
  return new Date("2026-05-09T00:00:00.000Z");
}

function makeAuthority(keys: OrgAnchorPrivateKey[], required: number): RootAuthority {
  return {
    schema: "https://organchor.org/schemas/root-authority.v1.json",
    type: "OrgAnchorRootAuthority",
    version: "1.0",
    authority_id: "root-authority-2026",
    created_at: fixedDate().toISOString(),
    threshold: {
      required,
      total: keys.length
    },
    keys: keys.map((key) => rootAuthorityKeyFromPrivate(key))
  };
}

function makeStatement(authority: RootAuthority): OfficialEndpointsStatement {
  return {
    schema: "https://organchor.org/schemas/official-endpoints.v1.json",
    type: "OfficialOrganizationEndpoints",
    version: "1.0",
    statement_id: "organchor-statement-2026-001",
    issued_at: fixedDate().toISOString(),
    organization: {
      name: "Example Org",
      display_name: "Example Organization",
      description: "Short description"
    },
    root_authority: authority,
    root_authority_hash: sha256CanonicalJson(authority),
    official_endpoints: {
      website: "https://example.org",
      verify: "https://example.org/verify",
      security: "mailto:security@example.org"
    },
    archives: {
      arweave: [],
      ipfs: []
    },
    disaster_recovery: {
      onion: null
    },
    auxiliary_names: {
      ens: null
    },
    domain_security: {
      primary_domain: "example.org",
      dnssec: null,
      spf: null,
      dkim: null,
      dmarc: null,
      registry_lock: null
    },
    notes: "Only statements satisfying the root authority rule should be trusted for future migrations."
  };
}
