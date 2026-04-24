import { compileSchema } from "../schema/validator.ts";

export type PermissionProfile = "sandbox" | "elevated" | "readonly";

export interface ToolManifest {
  id: string;
  version: string;
  runtime: "shell" | "node";
  command: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  permissions: PermissionProfile;
}

const toolManifestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "version", "runtime", "command", "input_schema", "output_schema", "permissions"],
  properties: {
    id: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    runtime: { enum: ["shell", "node"] },
    command: { type: "string", minLength: 1 },
    input_schema: { type: "object" },
    output_schema: { type: "object" },
    permissions: { enum: ["sandbox", "elevated", "readonly"] }
  }
} as const;

const parseToolManifest = compileSchema<ToolManifest>(toolManifestSchema);

export function validateToolManifest(input: unknown): asserts input is ToolManifest {
  parseToolManifest(input);
}
