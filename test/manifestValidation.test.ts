import test from "node:test";
import assert from "node:assert/strict";
import { validateSkillManifest } from "../src/skills/manifest.ts";
import { validateToolManifest } from "../src/tools/manifest.ts";

test("validateSkillManifest accepts valid manifest", () => {
  const manifest = {
    id: "lead-research",
    version: "1.0.0",
    intent: "research leads",
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    workflow: [
      { type: "prompt", id: "draft", input: { prompt: "hello" } },
      { type: "tool", id: "search", input: { tool_id: "search-web", input: { q: "x" } } }
    ],
    safety_tags: ["low-risk"]
  };

  assert.doesNotThrow(() => validateSkillManifest(manifest));
});

test("validateSkillManifest rejects missing required fields", () => {
  assert.throws(() => validateSkillManifest({ id: "x" }), /Schema validation failed/);
});

test("validateSkillManifest rejects additional properties", () => {
  const manifest = {
    id: "lead-research",
    version: "1.0.0",
    intent: "research leads",
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    workflow: [{ type: "prompt", id: "draft", input: { prompt: "hello" }, extra: true }],
    safety_tags: ["low-risk"]
  };

  assert.throws(() => validateSkillManifest(manifest), /must NOT have additional properties/);
});

test("validateToolManifest accepts valid manifest", () => {
  const manifest = {
    id: "csv-cleaner",
    version: "0.1.0",
    runtime: "shell",
    command: "echo ok",
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    permissions: "sandbox"
  };

  assert.doesNotThrow(() => validateToolManifest(manifest));
});

test("validateToolManifest rejects invalid permission", () => {
  assert.throws(
    () =>
      validateToolManifest({
        id: "x",
        version: "1",
        runtime: "shell",
        command: "echo hi",
        input_schema: {},
        output_schema: {},
        permissions: "danger"
      }),
    /Schema validation failed/
  );
});

test("validateToolManifest rejects additional top-level properties", () => {
  const manifest = {
    id: "csv-cleaner",
    version: "0.1.0",
    runtime: "shell",
    command: "echo ok",
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    permissions: "sandbox",
    unknown: true
  };

  assert.throws(() => validateToolManifest(manifest), /must NOT have additional properties/);
});
