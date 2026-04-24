import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { homedir } from "node:os";
import { validateSkillManifest } from "../skills/manifest.ts";
import { validateToolManifest } from "../tools/manifest.ts";

export type RegistryType = "skills" | "tools";

export class LocalRegistry {
  private readonly baseDir: string;

  constructor(baseDir = join(homedir(), ".zeus")) {
    this.baseDir = baseDir;
  }

  private pathFor(type: RegistryType): string {
    return join(this.baseDir, type);
  }

  async init(): Promise<void> {
    await mkdir(this.pathFor("skills"), { recursive: true });
    await mkdir(this.pathFor("tools"), { recursive: true });
  }

  async install(type: RegistryType, sourcePath: string): Promise<string> {
    await this.init();
    const manifest = await this.validate(sourcePath);
    if (type === "skills") {
      validateSkillManifest(manifest);
    } else {
      validateToolManifest(manifest);
    }

    const id = (manifest as { id: string }).id;
    const target = join(this.pathFor(type), `${id}.json`);
    await copyFile(sourcePath, target);
    return target;
  }

  async list(type: RegistryType): Promise<string[]> {
    await this.init();
    const files = await readdir(this.pathFor(type));
    return files.filter((file) => extname(file) === ".json");
  }

  async remove(type: RegistryType, id: string): Promise<void> {
    await rm(join(this.pathFor(type), `${id}.json`), { force: true });
  }

  async validate(path: string): Promise<unknown> {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  }

  async scaffoldSkill(id: string, destinationDir: string): Promise<string> {
    const path = join(destinationDir, `${id}.json`);
    const manifest = {
      id,
      version: "0.1.0",
      intent: "Describe what this skill does",
      input_schema: { type: "object" },
      output_schema: { type: "object" },
      workflow: [
        {
          type: "prompt",
          id: "draft",
          input: {
            prompt: "Given input {{topic}}, produce an answer"
          }
        }
      ],
      safety_tags: ["low-risk"]
    };

    await mkdir(destinationDir, { recursive: true });
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    return path;
  }

  async scaffoldTool(id: string, destinationDir: string): Promise<string> {
    const path = join(destinationDir, `${id}.json`);
    const manifest = {
      id,
      version: "0.1.0",
      runtime: "shell",
      command: "echo Tool {{name}} says hello",
      input_schema: { type: "object" },
      output_schema: { type: "object" },
      permissions: "sandbox"
    };

    await mkdir(destinationDir, { recursive: true });
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    return path;
  }
}
