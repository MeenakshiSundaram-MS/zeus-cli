import { compileSchema } from "../schema/validator.ts";

export interface SkillStep {
  type: "prompt" | "tool";
  id: string;
  input: Record<string, unknown>;
}

export interface SkillManifest {
  id: string;
  version: string;
  intent: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  workflow: SkillStep[];
  safety_tags: string[];
}

const skillManifestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "version", "intent", "input_schema", "output_schema", "workflow", "safety_tags"],
  properties: {
    id: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    intent: { type: "string", minLength: 1 },
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    workflow: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "id", "input"],
        properties: {
          type: { enum: ["prompt", "tool"] },
          id: { type: "string", minLength: 1 },
          input: { type: "object" }
        }
      }
    },
    safety_tags: {
      type: "array",
      items: { type: "string" }
    }
  }
} as const;

const parseSkillManifest = compileSchema<SkillManifest>(skillManifestSchema);

export function validateSkillManifest(input: unknown): asserts input is SkillManifest {
  parseSkillManifest(input);
}
