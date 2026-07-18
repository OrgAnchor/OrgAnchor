import assert from "node:assert/strict";
import test from "node:test";
import { escapeMarkdownTableCell } from "../src/core/markdown.ts";

test("Markdown table escaping handles backslashes before pipes and line breaks", () => {
  assert.equal(
    escapeMarkdownTableCell("C:\\evidence|report\r\nnext"),
    "C:\\\\evidence\\|report next"
  );
});
