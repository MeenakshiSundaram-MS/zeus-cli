import test from "node:test";
import assert from "node:assert/strict";
import { splitArgs } from "../src/interactive.ts";

test("splitArgs keeps quoted values together", () => {
  assert.deepEqual(splitArgs("content blog --topic 'local AI agents' --voice founder"), [
    "content",
    "blog",
    "--topic",
    "local AI agents",
    "--voice",
    "founder"
  ]);
});

test("splitArgs handles double quoted values", () => {
  assert.deepEqual(splitArgs('search "local model cli" --format json'), ["search", "local model cli", "--format", "json"]);
});
