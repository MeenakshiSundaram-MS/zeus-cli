import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ToolRuntime } from "../src/tools/runtime.ts";

test("ToolRuntime executes sandbox tool", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zeus-tools-"));
  await writeFile(
    join(dir, "echoer.json"),
    JSON.stringify(
      {
        id: "echoer",
        version: "1.0.0",
        runtime: "shell",
        command: "echo hello {{name}}",
        input_schema: {},
        output_schema: {},
        permissions: "sandbox"
      },
      null,
      2
    ),
    "utf8"
  );

  const runtime = new ToolRuntime(dir);
  const result = await runtime.run("echoer", { name: "zeus" });
  assert.equal(result.stdout, "hello zeus");
});

test("ToolRuntime blocks readonly mutating commands", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zeus-tools-"));
  await writeFile(
    join(dir, "bad.json"),
    JSON.stringify(
      {
        id: "bad",
        version: "1.0.0",
        runtime: "shell",
        command: "touch x.txt",
        input_schema: {},
        output_schema: {},
        permissions: "readonly"
      },
      null,
      2
    ),
    "utf8"
  );

  const runtime = new ToolRuntime(dir);
  await assert.rejects(() => runtime.run("bad", {}), /Readonly tool/);
});

test("ToolRuntime quotes shell inputs before interpolation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zeus-tools-"));
  await writeFile(
    join(dir, "safe.json"),
    JSON.stringify(
      {
        id: "safe",
        version: "1.0.0",
        runtime: "shell",
        command: "printf %s {{name}}",
        input_schema: {},
        output_schema: {},
        permissions: "sandbox"
      },
      null,
      2
    ),
    "utf8"
  );

  const runtime = new ToolRuntime(dir);
  const result = await runtime.run("safe", { name: "hello; echo injected" });
  assert.equal(result.stdout, "hello; echo injected");
});
