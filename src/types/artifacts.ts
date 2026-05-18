import type { JsonValue } from "../core/json.ts";

export type Algorithm = "ed25519";
export type Jwk = Record<string, JsonValue>;

export interface OrgAnchorPrivateKey {
  [key: string]: JsonValue;
  type: "OrgAnchorPrivateKey";
  version: "1.0";
  id: string;
  algorithm: Algorithm;
  created_at: string;
  key_material: {
    format: "jwk";
    jwk: Jwk;
  };
}

export interface OrgAnchorPublicKey {
  [key: string]: JsonValue;
  type: "OrgAnchorPublicKey";
  version: "1.0";
  id: string;
  algorithm: Algorithm;
  created_at: string;
  public_key: {
    format: "jwk";
    jwk: Jwk;
  };
}

export interface RootAuthority {
  [key: string]: JsonValue;
  schema: string;
  type: "OrgAnchorRootAuthority";
  version: "1.0";
  authority_id: string;
  created_at: string;
  threshold: {
    required: number;
    total: number;
  };
  keys: RootAuthorityKey[];
}

export interface RootAuthorityKey {
  [key: string]: JsonValue;
  id: string;
  algorithm: Algorithm;
  public_key: {
    format: "jwk";
    jwk: Jwk;
  };
}

export interface SignatureFile {
  [key: string]: JsonValue;
  type: "OrgAnchorSignature";
  version: "1.0";
  canonicalization: "RFC8785-JCS";
  hash: {
    algorithm: "sha256";
    value: string;
  };
  signatures: SignatureEntry[];
}

export interface SignatureEntry {
  [key: string]: JsonValue;
  key_id: string;
  algorithm: Algorithm;
  signature: string;
  signed_at: string;
}

export interface OfficialEndpointsStatement {
  [key: string]: JsonValue;
  schema: string;
  type: "OfficialOrganizationEndpoints";
  version: "1.0";
  statement_id: string;
  issued_at: string;
  organization: Record<string, JsonValue>;
  root_authority: RootAuthority;
  root_authority_hash: string;
  official_endpoints: Record<string, JsonValue>;
  archives: {
    arweave: JsonValue[];
    ipfs: JsonValue[];
  };
  disaster_recovery: {
    onion: JsonValue;
  };
  auxiliary_names: {
    ens: JsonValue;
  };
  domain_security: Record<string, JsonValue>;
  notes: string;
}

export interface RootAuthorityMigration {
  [key: string]: JsonValue;
  schema: string;
  type: "OrgAnchorRootAuthorityMigration";
  version: "1.0";
  migration_id: string;
  issued_at: string;
  effective_at: string;
  reason: string;
  old_root_authority: RootAuthority;
  old_root_authority_hash: string;
  new_root_authority: RootAuthority;
  new_root_authority_hash: string;
  supersedes_statement_hashes: string[];
  notes: string;
}

export interface RootAuthorityChangePlan {
  [key: string]: JsonValue;
  schema: string;
  type: "OrgAnchorRootAuthorityChangePlan";
  version: "1.0";
  plan_id: string;
  created_at: string;
  reason: string;
  old_root_authority_path: string;
  new_root_authority_path: string;
  old_root_authority_hash: string;
  new_root_authority_hash: string;
  old_authority_id: string;
  new_authority_id: string;
  old_threshold: {
    required: number;
    total: number;
  };
  new_threshold: {
    required: number;
    total: number;
  };
  changes: {
    retained_key_ids: string[];
    added_key_ids: string[];
    removed_key_ids: string[];
    authority_id_changed: boolean;
    threshold_changed: boolean;
  };
  next_step: string;
}

export interface OrgAnchorConfig {
  [key: string]: JsonValue;
  type: "OrgAnchorConfig";
  version: "1.0";
  organization: {
    name: string;
    display_name: string;
    description: string;
  };
  official_endpoints: Record<string, JsonValue>;
  domain_security: Record<string, JsonValue>;
  auxiliary_names: {
    ens: JsonValue;
  };
  disaster_recovery: {
    onion: JsonValue;
  };
}
