import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SkillEngine } from "../src/skills/engine.ts";

test("SkillEngine executes prompt and tool steps with interpolation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zeus-skills-"));
  const file = join(dir, "demo.json");

  await writeFile(
    file,
    JSON.stringify(
      {
        id: "demo",
        version: "1.0.0",
        intent: "demo",
        input_schema: {},
        output_schema: {},
        workflow: [
          { type: "prompt", id: "draft", input: { prompt: "Hello {{name}}" } },
          { type: "tool", id: "final", input: { tool_id: "echo", input: { text: "{{draft}}" } } }
        ],
        safety_tags: ["low-risk"]
      },
      null,
      2
    ),
    "utf8"
  );

  const engine = new SkillEngine(
    {
      async generate(request: { prompt: string }) {
        return { text: `${request.prompt}!`, model: "fake" };
      }
    },
    {
      async run(_id: string, input: Record<string, unknown>) {
        return { echoed: input.text };
      }
    },
    dir
  );

  const out = await engine.execute("demo", { name: "Zeus" });
  assert.equal(out.draft, "Hello Zeus!");
  assert.deepEqual(out.final, { echoed: "Hello Zeus!" });
});
