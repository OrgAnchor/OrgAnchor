export class OrgAnchorError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OrgAnchorError";
    this.code = code;
  }
}

export function fail(code: string, message: string): never {
  throw new OrgAnchorError(code, message);
}
