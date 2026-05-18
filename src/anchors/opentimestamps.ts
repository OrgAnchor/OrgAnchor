import { createHash } from "node:crypto";

export interface TimestampNode {
  msg: Buffer;
  entries: TimestampEntry[];
}

export type TimestampEntry = AttestationEntry | OpEntry;

export interface AttestationEntry {
  kind: "attestation";
  tag: Buffer;
  payload: Buffer;
}

export interface OpEntry {
  kind: "op";
  tag: number;
  arg?: Buffer;
  child: TimestampNode;
}

export interface PendingAttestation {
  uri: string;
  commitment: string;
}

export interface BitcoinAttestation {
  height: number;
  commitment: string;
}

export interface DetachedOpenTimestamp {
  algorithm: "sha256";
  digest: Buffer;
  timestamp: TimestampNode;
}

const HEADER_MAGIC = Buffer.from([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00,
  0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94
]);
const MAJOR_VERSION = 1;
const OP_SHA1 = 0x02;
const OP_RIPEMD160 = 0x03;
const OP_SHA256 = 0x08;
const OP_APPEND = 0xf0;
const OP_PREPEND = 0xf1;
const OP_REVERSE = 0xf2;
const OP_HEXLIFY = 0xf3;
const ATTESTATION = 0x00;
const MULTI = 0xff;
const PENDING_TAG = Buffer.from("83dfe30d2ef90c8e", "hex");
const BITCOIN_TAG = Buffer.from("0588960d73d71901", "hex");
const LITECOIN_TAG = Buffer.from("06869a0d73d71b45", "hex");

export const DEFAULT_OPENTIMESTAMPS_CALENDARS = [
  "https://a.pool.opentimestamps.org",
  "https://b.pool.opentimestamps.org",
  "https://a.pool.eternitywall.com",
  "https://ots.btc.catallaxy.com"
];

export function parseDetachedOpenTimestamp(bytes: Buffer): DetachedOpenTimestamp {
  const reader = new ByteReader(bytes);
  reader.expect(HEADER_MAGIC);
  const version = reader.readVaruint();
  if (version !== MAJOR_VERSION) throw new Error(`Unsupported OpenTimestamps major version: ${version}`);
  const hashOp = reader.readByte();
  if (hashOp !== OP_SHA256) throw new Error(`Unsupported OpenTimestamps file hash operation: 0x${hashOp.toString(16)}`);
  const digest = reader.readBytes(32);
  const timestamp = parseTimestamp(reader, digest);
  reader.expectEof();
  return {
    algorithm: "sha256",
    digest,
    timestamp
  };
}

export function serializeDetachedOpenTimestamp(proof: DetachedOpenTimestamp): Buffer {
  const writer = new ByteWriter();
  writer.writeBytes(HEADER_MAGIC);
  writer.writeVaruint(MAJOR_VERSION);
  writer.writeByte(OP_SHA256);
  writer.writeBytes(proof.digest);
  serializeTimestamp(writer, proof.timestamp);
  return writer.toBuffer();
}

export function detachedProofFromTimestampBytes(digest: Buffer, timestampBytes: Buffer): DetachedOpenTimestamp {
  const reader = new ByteReader(timestampBytes);
  const timestamp = parseTimestamp(reader, digest);
  reader.expectEof();
  return {
    algorithm: "sha256",
    digest,
    timestamp
  };
}

export function mergeTimestamp(target: TimestampNode, incoming: TimestampNode): number {
  if (!target.msg.equals(incoming.msg)) throw new Error("Cannot merge OpenTimestamps proofs for different commitments");
  let added = 0;
  const existing = new Set(target.entries.map((entry) => serializeEntry(entry).toString("hex")));
  for (const entry of incoming.entries) {
    const key = serializeEntry(entry).toString("hex");
    if (!existing.has(key)) {
      target.entries.push(entry);
      existing.add(key);
      added++;
    }
  }
  return added;
}

export function findPendingAttestations(node: TimestampNode): PendingAttestation[] {
  const result: PendingAttestation[] = [];
  visitTimestamp(node, (current) => {
    for (const entry of current.entries) {
      if (entry.kind !== "attestation" || !entry.tag.equals(PENDING_TAG)) continue;
      const payloadReader = new ByteReader(entry.payload);
      const uri = payloadReader.readVarBytes(1000).toString("ascii");
      result.push({
        uri,
        commitment: current.msg.toString("hex")
      });
    }
  });
  return result;
}

export function findBitcoinAttestations(node: TimestampNode): BitcoinAttestation[] {
  const result: BitcoinAttestation[] = [];
  visitTimestamp(node, (current) => {
    for (const entry of current.entries) {
      if (entry.kind !== "attestation" || !entry.tag.equals(BITCOIN_TAG)) continue;
      const payloadReader = new ByteReader(entry.payload);
      result.push({
        height: payloadReader.readVaruint(),
        commitment: current.msg.toString("hex")
      });
    }
  });
  return result;
}

export function findTimestampNode(node: TimestampNode, commitmentHex: string): TimestampNode | null {
  if (node.msg.toString("hex") === commitmentHex) return node;
  for (const entry of node.entries) {
    if (entry.kind === "op") {
      const found = findTimestampNode(entry.child, commitmentHex);
      if (found) return found;
    }
  }
  return null;
}

export function sha256Bytes(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

export function readVaruintForTest(bytes: Buffer): number {
  return new ByteReader(bytes).readVaruint();
}

function parseTimestamp(reader: ByteReader, msg: Buffer): TimestampNode {
  const entries: TimestampEntry[] = [];
  let tag = reader.readByte();
  while (tag === MULTI) {
    entries.push(parseEntry(reader, reader.readByte(), msg));
    tag = reader.readByte();
  }
  entries.push(parseEntry(reader, tag, msg));
  return { msg, entries };
}

function parseEntry(reader: ByteReader, tag: number, msg: Buffer): TimestampEntry {
  if (tag === ATTESTATION) {
    const attestationTag = reader.readBytes(8);
    const payload = reader.readVarBytes(8192);
    return {
      kind: "attestation",
      tag: attestationTag,
      payload
    };
  }

  const op = parseOp(reader, tag);
  const childMsg = applyOp(op, msg);
  const entry: OpEntry = {
    kind: "op",
    tag,
    child: parseTimestamp(reader, childMsg)
  };
  if (op.arg !== undefined) entry.arg = op.arg;
  return entry;
}

function parseOp(reader: ByteReader, tag: number): { tag: number; arg?: Buffer } {
  if (tag === OP_APPEND || tag === OP_PREPEND) {
    return { tag, arg: reader.readVarBytes(4096) };
  }
  if (tag === OP_REVERSE || tag === OP_HEXLIFY || tag === OP_SHA1 || tag === OP_RIPEMD160 || tag === OP_SHA256) {
    return { tag };
  }
  throw new Error(`Unsupported OpenTimestamps operation tag: 0x${tag.toString(16)}`);
}

function applyOp(op: { tag: number; arg?: Buffer }, msg: Buffer): Buffer {
  if (op.tag === OP_APPEND) return Buffer.concat([msg, op.arg ?? Buffer.alloc(0)]);
  if (op.tag === OP_PREPEND) return Buffer.concat([op.arg ?? Buffer.alloc(0), msg]);
  if (op.tag === OP_REVERSE) return Buffer.from(msg).reverse();
  if (op.tag === OP_HEXLIFY) return Buffer.from(msg.toString("hex"), "ascii");
  if (op.tag === OP_SHA1) return createHash("sha1").update(msg).digest();
  if (op.tag === OP_RIPEMD160) return createHash("ripemd160").update(msg).digest();
  if (op.tag === OP_SHA256) return sha256Bytes(msg);
  throw new Error(`Unsupported OpenTimestamps operation tag: 0x${op.tag.toString(16)}`);
}

function serializeTimestamp(writer: ByteWriter, node: TimestampNode): void {
  if (node.entries.length === 0) throw new Error("Cannot serialize an empty OpenTimestamps timestamp");
  for (let index = 0; index < node.entries.length; index++) {
    if (index < node.entries.length - 1) writer.writeByte(MULTI);
    const entry = node.entries[index];
    if (!entry) throw new Error("Missing OpenTimestamps entry");
    serializeEntryToWriter(writer, entry);
  }
}

function serializeEntry(entry: TimestampEntry): Buffer {
  const writer = new ByteWriter();
  serializeEntryToWriter(writer, entry);
  return writer.toBuffer();
}

function serializeEntryToWriter(writer: ByteWriter, entry: TimestampEntry): void {
  if (entry.kind === "attestation") {
    writer.writeByte(ATTESTATION);
    writer.writeBytes(entry.tag);
    writer.writeVarBytes(entry.payload);
    return;
  }
  writer.writeByte(entry.tag);
  if (entry.tag === OP_APPEND || entry.tag === OP_PREPEND) writer.writeVarBytes(entry.arg ?? Buffer.alloc(0));
  serializeTimestamp(writer, entry.child);
}

function visitTimestamp(node: TimestampNode, visit: (node: TimestampNode) => void): void {
  visit(node);
  for (const entry of node.entries) {
    if (entry.kind === "op") visitTimestamp(entry.child, visit);
  }
}

export class ByteReader {
  private offset = 0;
  private readonly data: Buffer;

  constructor(data: Buffer) {
    this.data = data;
  }

  readByte(): number {
    if (this.offset >= this.data.length) throw new Error("Unexpected end of OpenTimestamps data");
    const value = this.data[this.offset];
    if (value === undefined) throw new Error("Unexpected end of OpenTimestamps data");
    this.offset++;
    return value;
  }

  readBytes(length: number): Buffer {
    if (this.offset + length > this.data.length) throw new Error("Unexpected end of OpenTimestamps data");
    const value = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readVaruint(): number {
    let value = 0;
    let shift = 0;
    while (true) {
      const byte = this.readByte();
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return value;
      shift += 7;
      if (shift > 28) throw new Error("OpenTimestamps varuint is too large");
    }
  }

  readVarBytes(maxLength: number): Buffer {
    const length = this.readVaruint();
    if (length > maxLength) throw new Error(`OpenTimestamps varbytes too large: ${length} > ${maxLength}`);
    return this.readBytes(length);
  }

  expect(expected: Buffer): void {
    const actual = this.readBytes(expected.length);
    if (!actual.equals(expected)) throw new Error("Invalid OpenTimestamps proof header");
  }

  expectEof(): void {
    if (this.offset !== this.data.length) throw new Error("Trailing data after OpenTimestamps proof");
  }
}

export class ByteWriter {
  private chunks: Buffer[] = [];

  writeByte(value: number): void {
    this.chunks.push(Buffer.from([value]));
  }

  writeBytes(value: Buffer): void {
    this.chunks.push(value);
  }

  writeVaruint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid OpenTimestamps varuint");
    let current = value;
    while (true) {
      let byte = current & 0x7f;
      current = Math.floor(current / 128);
      if (current > 0) byte |= 0x80;
      this.writeByte(byte);
      if (current === 0) break;
    }
  }

  writeVarBytes(value: Buffer): void {
    this.writeVaruint(value.length);
    this.writeBytes(value);
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

export function createPendingTimestampForTest(digest: Buffer, uri: string): Buffer {
  const payload = new ByteWriter();
  payload.writeVarBytes(Buffer.from(uri, "ascii"));
  const timestamp: TimestampNode = {
    msg: digest,
    entries: [
      {
        kind: "attestation",
        tag: PENDING_TAG,
        payload: payload.toBuffer()
      }
    ]
  };
  const writer = new ByteWriter();
  serializeTimestamp(writer, timestamp);
  return writer.toBuffer();
}

export function createBitcoinTimestampForTest(digest: Buffer, height: number, suffix: Buffer): { timestamp: Buffer; merkleRoot: string } {
  const appended = Buffer.concat([digest, suffix]);
  const merkleRoot = sha256Bytes(appended);
  const payload = new ByteWriter();
  payload.writeVaruint(height);
  const timestamp: TimestampNode = {
    msg: digest,
    entries: [
      {
        kind: "op",
        tag: OP_APPEND,
        arg: suffix,
        child: {
          msg: appended,
          entries: [
            {
              kind: "op",
              tag: OP_SHA256,
              child: {
                msg: merkleRoot,
                entries: [
                  {
                    kind: "attestation",
                    tag: BITCOIN_TAG,
                    payload: payload.toBuffer()
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  };
  const writer = new ByteWriter();
  serializeTimestamp(writer, timestamp);
  return { timestamp: writer.toBuffer(), merkleRoot: merkleRoot.toString("hex") };
}

export function isLitecoinAttestationTag(tag: Buffer): boolean {
  return tag.equals(LITECOIN_TAG);
}
