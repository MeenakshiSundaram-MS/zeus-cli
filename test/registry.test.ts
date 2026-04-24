import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalRegistry } from "../src/registry/localRegistry.ts";

test("LocalRegistry validates and installs skill manifests by id", async () => {
  const base = await mkdtemp(join(tmpdir(), "zeus-registry-"));
  const sourceDir = await mkdtemp(join(tmpdir(), "zeus-source-"));
  const source = join(sourceDir, "custom-file-name.json");
  await writeFile(
    source,
    JSON.stringify(
      {
        id: "seo-writer",
        version: "1.0.0",
        intent: "write SEO drafts",
        input_schema: {},
        output_schema: {},
        workflow: [{ type: "prompt", id: "draft", input: { prompt: "hello" } }],
        safety_tags: ["low-risk"]
      },
      null,
      2
    ),
    "utf8"
  );

  const registry = new LocalRegistry(base);
  const installed = await registry.install("skills", source);
  assert.equal(installed, join(base, "skills", "seo-writer.json"));
});

test("LocalRegistry rejects invalid tool manifests during install", async () => {
  const base = await mkdtemp(join(tmpdir(), "zeus-registry-"));
  const sourceDir = await mkdtemp(join(tmpdir(), "zeus-source-"));
  const source = join(sourceDir, "bad-tool.json");
  await writeFile(source, JSON.stringify({ id: "bad-tool" }, null, 2), "utf8");

  const registry = new LocalRegistry(base);
  await assert.rejects(() => registry.install("tools", source), /Schema validation failed/);
});
