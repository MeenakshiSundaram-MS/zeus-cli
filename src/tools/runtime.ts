import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ToolExecutor } from "../core/contracts.ts";
import { validateToolManifest } from "./manifest.ts";
import type { ToolManifest } from "./manifest.ts";

function shellQuote(value: unknown): string {
  const raw = String(value ?? "");
  if (raw.length === 0) {
    return "''";
  }
  return `'${raw.replace(/'/g, "'\\''")}'`;
}

function interpolate(template: string, input: Record<string, unknown>, runtime: ToolManifest["runtime"]): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
    const value = input[key];
    if (runtime === "node") {
      return JSON.stringify(value ?? "");
    }
    return shellQuote(value);
  });
}

export class ToolRuntime implements ToolExecutor {
  private readonly registryDir: string;

  constructor(registryDir = join(homedir(), ".zeus", "tools")) {
    this.registryDir = registryDir;
  }

  async run(toolId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const manifestPath = join(this.registryDir, `${toolId}.json`);
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as ToolManifest;
    validateToolManifest(manifest);

    if (manifest.permissions === "readonly") {
      const blocked = /(rm\s|mv\s|cp\s|>|>>|chmod|chown|touch\s)/;
      if (blocked.test(manifest.command)) {
        throw new Error(`Readonly tool ${toolId} contains a mutating command`);
      }
    }

    if (manifest.permissions === "sandbox") {
      const denied = /(sudo\s|rm\s+-rf\s+\/|:>|dd\s+if=|mkfs\s)/;
      if (denied.test(manifest.command)) {
        throw new Error(`Sandbox policy denied command for ${toolId}`);
      }
    }

    const command = interpolate(manifest.command, input, manifest.runtime);

    if (manifest.runtime === "node") {
      return { stdout: await this.execute("node", ["-e", command]) };
    }

    return { stdout: await this.execute("sh", ["-c", command]) };
  }

  private async execute(bin: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, {
        stdio: ["ignore", "pipe", "pipe"]
      });
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGTERM");
        }
      }, 60_000);
      timeout.unref();

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Tool command failed (${code}): ${stderr.trim()}`));
          return;
        }
        resolve(stdout.trim());
      });
    });
  }
}
