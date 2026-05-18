import { readFile } from "node:fs/promises";
import { fail } from "./errors.ts";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export async function readJsonFile(path: string): Promise<JsonValue> {
  const text = await readFile(path, "utf8");
  return parseStrictJson(text, path);
}

export function parseStrictJson(source: string, label = "JSON input"): JsonValue {
  const parser = new StrictJsonParser(source, label);
  return parser.parse();
}

class StrictJsonParser {
  private source: string;
  private label: string;
  private pos = 0;

  constructor(source: string, label: string) {
    this.source = source;
    this.label = label;
  }

  parse(): JsonValue {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.pos !== this.source.length) {
      this.error("Unexpected trailing content");
    }
    return value;
  }

  private parseValue(): JsonValue {
    this.skipWhitespace();
    const ch = this.peek();
    if (ch === "{") return this.parseObject();
    if (ch === "[") return this.parseArray();
    if (ch === "\"") return this.parseString();
    if (ch === "-" || isDigit(ch)) return this.parseNumber();
    if (this.source.startsWith("true", this.pos)) {
      this.pos += 4;
      return true;
    }
    if (this.source.startsWith("false", this.pos)) {
      this.pos += 5;
      return false;
    }
    if (this.source.startsWith("null", this.pos)) {
      this.pos += 4;
      return null;
    }
    this.error("Expected JSON value");
  }

  private parseObject(): JsonValue {
    this.expect("{");
    this.skipWhitespace();
    const result: { [key: string]: JsonValue } = {};
    const keys = new Set<string>();

    if (this.peek() === "}") {
      this.pos++;
      return result;
    }

    while (true) {
      this.skipWhitespace();
      if (this.peek() !== "\"") {
        this.error("Expected object key string");
      }
      const key = this.parseString();
      if (keys.has(key)) {
        this.error(`Duplicate object key "${key}"`);
      }
      keys.add(key);
      this.skipWhitespace();
      this.expect(":");
      result[key] = this.parseValue();
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === "}") {
        this.pos++;
        return result;
      }
      this.expect(",");
    }
  }

  private parseArray(): JsonValue {
    this.expect("[");
    this.skipWhitespace();
    const result: JsonValue[] = [];
    if (this.peek() === "]") {
      this.pos++;
      return result;
    }

    while (true) {
      result.push(this.parseValue());
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === "]") {
        this.pos++;
        return result;
      }
      this.expect(",");
    }
  }

  private parseString(): string {
    const start = this.pos;
    this.expect("\"");
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === "\"") {
        this.pos++;
        const raw = this.source.slice(start, this.pos);
        try {
          return JSON.parse(raw) as string;
        } catch {
          this.error("Invalid JSON string");
        }
      }
      if (ch === "\\") {
        this.pos++;
        if (this.pos >= this.source.length) {
          this.error("Unterminated escape sequence");
        }
        const escaped = this.source[this.pos];
        if (!"\"\\/bfnrtu".includes(escaped ?? "")) {
          this.error("Invalid string escape");
        }
        if (escaped === "u") {
          for (let i = 0; i < 4; i++) {
            this.pos++;
            if (!isHex(this.source[this.pos])) {
              this.error("Invalid unicode escape");
            }
          }
        }
        this.pos++;
        continue;
      }
      const code = ch?.charCodeAt(0) ?? 0;
      if (code >= 0 && code <= 0x1f) {
        this.error("Unescaped control character in string");
      }
      this.pos++;
    }
    this.error("Unterminated string");
  }

  private parseNumber(): number {
    const start = this.pos;
    if (this.peek() === "-") this.pos++;
    if (this.peek() === "0") {
      this.pos++;
    } else {
      if (!isDigit1to9(this.peek())) {
        this.error("Invalid number");
      }
      while (isDigit(this.peek())) this.pos++;
    }
    if (this.peek() === ".") {
      this.pos++;
      if (!isDigit(this.peek())) this.error("Invalid number fraction");
      while (isDigit(this.peek())) this.pos++;
    }
    if (this.peek() === "e" || this.peek() === "E") {
      this.pos++;
      if (this.peek() === "+" || this.peek() === "-") this.pos++;
      if (!isDigit(this.peek())) this.error("Invalid number exponent");
      while (isDigit(this.peek())) this.pos++;
    }

    const raw = this.source.slice(start, this.pos);
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      this.error("Non-finite number");
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      this.error("Unsafe integer is not allowed in signed JSON");
    }
    return value;
  }

  private skipWhitespace(): void {
    while (/[\u0009\u000a\u000d\u0020]/.test(this.peek())) {
      this.pos++;
    }
  }

  private expect(expected: string): void {
    if (this.peek() !== expected) {
      this.error(`Expected "${expected}"`);
    }
    this.pos++;
  }

  private peek(): string {
    return this.source[this.pos] ?? "";
  }

  private error(message: string): never {
    fail("INVALID_JSON", `${this.label}: ${message} at offset ${this.pos}`);
  }
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isDigit1to9(ch: string): boolean {
  return ch >= "1" && ch <= "9";
}

function isHex(ch: string | undefined): boolean {
  return !!ch && /^[0-9a-fA-F]$/.test(ch);
}
