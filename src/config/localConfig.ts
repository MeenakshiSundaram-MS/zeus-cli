import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface ZeusConfig {
  ollama_base_url: string;
  ollama_model: string;
  search_provider: "auto" | "duckduckgo" | "brave" | "serpapi";
  default_format: "markdown" | "json" | "csv" | "txt";
  registry_dir: string;
}

export interface InitOptions {
  homeDir?: string;
  force?: boolean;
}

export interface InitResult {
  configPath: string;
  skillsDir: string;
  toolsDir: string;
  voicesPath: string;
  createdConfig: boolean;
}

export function zeusHome(homeDir = homedir()): string {
  return join(homeDir, ".zeus");
}

export function defaultConfig(homeDir = homedir()): ZeusConfig {
  const base = zeusHome(homeDir);
  return {
    ollama_base_url: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollama_model: process.env.OLLAMA_MODEL ?? "llama3.2",
    search_provider: (process.env.ZEUS_SEARCH_PROVIDER as ZeusConfig["search_provider"] | undefined) ?? "auto",
    default_format: "markdown",
    registry_dir: base
  };
}

export async function initZeus(options: InitOptions = {}): Promise<InitResult> {
  const home = options.homeDir ?? homedir();
  const base = zeusHome(home);
  const configPath = join(base, "config.json");
  const skillsDir = join(base, "skills");
  const toolsDir = join(base, "tools");
  const voicesPath = join(base, "voices.json");

  await mkdir(skillsDir, { recursive: true });
  await mkdir(toolsDir, { recursive: true });
  await mkdir(dirname(voicesPath), { recursive: true });

  let createdConfig = false;
  try {
    await readFile(configPath, "utf8");
    if (options.force) {
      await writeFile(configPath, `${JSON.stringify(defaultConfig(home), null, 2)}\n`, "utf8");
      createdConfig = true;
    }
  } catch {
    await writeFile(configPath, `${JSON.stringify(defaultConfig(home), null, 2)}\n`, "utf8");
    createdConfig = true;
  }

  try {
    await readFile(voicesPath, "utf8");
  } catch {
    await writeFile(voicesPath, "[]\n", "utf8");
  }

  return { configPath, skillsDir, toolsDir, voicesPath, createdConfig };
}

export async function isInitialized(homeDir = homedir()): Promise<boolean> {
  try {
    await access(join(zeusHome(homeDir), "config.json"));
    return true;
  } catch {
    return false;
  }
}

export async function readConfig(homeDir = homedir()): Promise<ZeusConfig> {
  try {
    const content = await readFile(join(zeusHome(homeDir), "config.json"), "utf8");
    return JSON.parse(content) as ZeusConfig;
  } catch {
    return defaultConfig(homeDir);
  }
}
