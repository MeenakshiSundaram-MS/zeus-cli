import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli.ts";
import { LocalRegistry } from "../src/registry/localRegistry.ts";

test("runCli shows help", async () => {
  const out = await runCli([]);
  assert.match(out, /Zeus CLI/);
  assert.match(out, /zeus ask/);
});

test("runCli ask command returns json format", async () => {
  const out = await runCli(["ask", "hello", "--format", "json"], {
    inference: {
      async generate() {
        return { text: "world", model: "fake" };
      }
    } as never,
    search: { name: "fake", async search() { return []; } } as never,
    registry: new LocalRegistry(join(tmpdir(), "zeus-registry-ignore"))
  });

  const parsed = JSON.parse(out);
  assert.equal(parsed.kind, "ask.answer");
  assert.equal(parsed.data.response, "world");
});

test("runCli init creates a local workspace", async () => {
  const home = await mkdtemp(join(tmpdir(), "zeus-cli-home-"));
  const out = await runCli(["init", "--home", home, "--format", "json"], {
    inference: {
      async generate() {
        return { text: "", model: "fake" };
      }
    } as never,
    search: { name: "fake", async search() { return []; } } as never,
    registry: new LocalRegistry(join(tmpdir(), "zeus-registry-ignore"))
  });

  const parsed = JSON.parse(out);
  assert.equal(parsed.kind, "init.complete");
  await stat(parsed.data.configPath);
  await stat(parsed.data.skillsDir);
  await stat(parsed.data.toolsDir);
});

test("runCli contacts find supports csv source and filtering", async () => {
  const temp = await mkdtemp(join(tmpdir(), "zeus-cli-contacts-"));
  const csv = join(temp, "contacts.csv");
  await writeFile(
    csv,
    "name,role,industry,location,company_size,profile_url\nA,Engineer,SaaS,Bangalore,51-200,https://x\nB,Founder,Fintech,Chennai,11-50,https://y\n",
    "utf8"
  );

  const out = await runCli(
    ["contacts", "find", "--source", "csv", "--file", csv, "--role", "engineer", "--format", "json"],
    {
      inference: { async generate() { return { text: "", model: "fake" }; } } as never,
      search: { name: "fake", async search() { return []; } } as never,
      registry: new LocalRegistry(join(tmpdir(), "zeus-registry-ignore"))
    }
  );

  const parsed = JSON.parse(out);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].name, "A");
});
