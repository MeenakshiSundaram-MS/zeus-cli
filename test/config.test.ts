import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initZeus } from "../src/config/localConfig.ts";

test("initZeus creates config, registry folders, and voices file", async () => {
  const home = await mkdtemp(join(tmpdir(), "zeus-home-"));
  const result = await initZeus({ homeDir: home });

  assert.equal(result.createdConfig, true);
  await stat(result.skillsDir);
  await stat(result.toolsDir);
  assert.equal(await readFile(result.voicesPath, "utf8"), "[]\n");

  const config = JSON.parse(await readFile(result.configPath, "utf8"));
  assert.equal(config.ollama_base_url, "http://localhost:11434");
  assert.equal(config.ollama_model, "llama3.2");
  assert.equal(config.search_provider, "auto");
});

test("initZeus does not overwrite config unless force is enabled", async () => {
  const home = await mkdtemp(join(tmpdir(), "zeus-home-"));
  const first = await initZeus({ homeDir: home });
  await initZeus({ homeDir: home });
  const unchanged = JSON.parse(await readFile(first.configPath, "utf8"));
  assert.equal(unchanged.default_format, "markdown");

  const forced = await initZeus({ homeDir: home, force: true });
  assert.equal(forced.createdConfig, true);
});
