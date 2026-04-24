import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { InferenceAdapter, SkillExecutor, ToolExecutor } from "../core/contracts.ts";
import { validateSkillManifest } from "./manifest.ts";
import type { SkillManifest } from "./manifest.ts";

function interpolateValue(value: unknown, vars: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => String(vars[key] ?? ""));
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateValue(item, vars));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, interpolateValue(v, vars)])
    );
  }
  return value;
}

export class SkillEngine implements SkillExecutor {
  private readonly inference: InferenceAdapter;
  private readonly tools: ToolExecutor;
  private readonly registryDir: string;

  constructor(inference: InferenceAdapter, tools: ToolExecutor, registryDir = join(homedir(), ".zeus", "skills")) {
    this.inference = inference;
    this.tools = tools;
    this.registryDir = registryDir;
  }

  async execute(skillId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const manifestPath = join(this.registryDir, `${skillId}.json`);
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as SkillManifest;
    validateSkillManifest(manifest);

    const context: Record<string, unknown> = { ...input };

    for (const step of manifest.workflow) {
      const stepInput = interpolateValue(step.input, context) as Record<string, unknown>;
      if (step.type === "prompt") {
        const prompt = String(stepInput.prompt ?? "");
        const response = await this.inference.generate({ prompt });
        context[step.id] = response.text;
        continue;
      }

      const toolInput = (stepInput.input as Record<string, unknown>) ?? {};
      context[step.id] = await this.tools.run(String(stepInput.tool_id), toolInput);
    }

    return context;
  }
}
