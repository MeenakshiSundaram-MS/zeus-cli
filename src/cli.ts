#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { initZeus } from "./config/localConfig.ts";
import { formatterFor } from "./formatters/index.ts";
import { OllamaAdapter } from "./inference/ollamaAdapter.ts";
import { startInteractive } from "./interactive.ts";
import { createSearchProvider } from "./search/factory.ts";
import { filterContacts, parseLinkedInCsv, parseProfileUrls } from "./contacts/parser.ts";
import { generateHookPost, generateSeoBlog } from "./content/generator.ts";
import { getVoice, listVoices, saveVoice } from "./content/voiceProfiles.ts";
import { runResearchPipeline } from "./research/pipeline.ts";
import { LocalRegistry } from "./registry/localRegistry.ts";
import { validateSkillManifest } from "./skills/manifest.ts";
import { validateToolManifest } from "./tools/manifest.ts";
import type { CommandResult, OutputFormat, SearchProvider } from "./core/contracts.ts";

interface CliDeps {
  inference: OllamaAdapter;
  search: SearchProvider;
  registry: LocalRegistry;
}

function parseFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }
  return argv[index + 1];
}

function parseFormat(argv: string[]): OutputFormat {
  const format = parseFlag(argv, "--format") as OutputFormat | undefined;
  if (!format) {
    return "markdown";
  }
  if (["markdown", "json", "csv", "txt"].includes(format)) {
    return format;
  }
  throw new Error(`Unsupported format: ${format}`);
}

function stripFlags(argv: string[]): string[] {
  const valueFlags = new Set([
    "--format",
    "--source",
    "--file",
    "--urls",
    "--role",
    "--industry",
    "--location",
    "--company-size",
    "--topic",
    "--voice",
    "--platform",
    "--id",
    "--tone",
    "--audience",
    "--guidelines",
    "--path",
    "--out",
    "--provider",
    "--home"
  ]);

  const output: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (valueFlags.has(arg)) {
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      continue;
    }
    output.push(arg);
  }
  return output;
}

function print(result: CommandResult, format: OutputFormat): string {
  return formatterFor(format).format(result);
}

function helpText(): string {
  return [
    "Zeus CLI",
    "",
    "Commands:",
    "  zeus",
    "  zeus init [--home <dir>] [--force]",
    "  zeus ask <prompt>",
    "  zeus search <query> [--provider <auto|duckduckgo|brave|serpapi>] --format <markdown|json|csv|txt>",
    "  zeus contacts find --source <csv|urls> [--file <csv>] [--urls <comma>] [--role ... --industry ... --location ... --company-size ...]",
    "  zeus content blog --topic <topic> --voice <profile>",
    "  zeus content hook --platform <linkedin|x> --topic <topic> --voice <profile>",
    "  zeus content voice create --id <id> --tone <tone> --audience <audience> --guidelines <a;b;c>",
    "  zeus content voice list",
    "  zeus research <question> --format <markdown|json|csv|txt>",
    "  zeus skill create|install|list|remove|validate",
    "  zeus tool create|install|list|remove|validate"
  ].join("\n");
}

async function handleSkill(args: string[], deps: CliDeps): Promise<CommandResult> {
  const sub = args[0];
  if (!sub) {
    throw new Error("skill subcommand required");
  }

  if (sub === "create") {
    const id = parseFlag(args, "--id") ?? "new-skill";
    const out = parseFlag(args, "--out") ?? process.cwd();
    const file = await deps.registry.scaffoldSkill(id, out);
    return { kind: "skill.create", summary: `Scaffolded skill manifest: ${file}`, data: { id, file } };
  }

  if (sub === "install") {
    const path = parseFlag(args, "--path");
    if (!path) {
      throw new Error("--path is required");
    }
    const installed = await deps.registry.install("skills", path);
    return { kind: "skill.install", summary: `Installed skill: ${installed}`, data: { installed } };
  }

  if (sub === "list") {
    const skills = await deps.registry.list("skills");
    return {
      kind: "skill.list",
      summary: `Found ${skills.length} skill(s)`,
      data: { count: skills.length },
      rows: skills.map((skill) => ({ skill }))
    };
  }

  if (sub === "remove") {
    const id = parseFlag(args, "--id");
    if (!id) {
      throw new Error("--id is required");
    }
    await deps.registry.remove("skills", id);
    return { kind: "skill.remove", summary: `Removed skill ${id}`, data: { id } };
  }

  if (sub === "validate") {
    const path = parseFlag(args, "--path");
    if (!path) {
      throw new Error("--path is required");
    }
    const doc = await deps.registry.validate(path);
    validateSkillManifest(doc);
    return { kind: "skill.validate", summary: "Skill manifest valid", data: { path } };
  }

  throw new Error(`Unknown skill subcommand: ${sub}`);
}

async function handleTool(args: string[], deps: CliDeps): Promise<CommandResult> {
  const sub = args[0];
  if (!sub) {
    throw new Error("tool subcommand required");
  }

  if (sub === "create") {
    const id = parseFlag(args, "--id") ?? "new-tool";
    const out = parseFlag(args, "--out") ?? process.cwd();
    const file = await deps.registry.scaffoldTool(id, out);
    return { kind: "tool.create", summary: `Scaffolded tool manifest: ${file}`, data: { id, file } };
  }

  if (sub === "install") {
    const path = parseFlag(args, "--path");
    if (!path) {
      throw new Error("--path is required");
    }
    const installed = await deps.registry.install("tools", path);
    return { kind: "tool.install", summary: `Installed tool: ${installed}`, data: { installed } };
  }

  if (sub === "list") {
    const tools = await deps.registry.list("tools");
    return {
      kind: "tool.list",
      summary: `Found ${tools.length} tool(s)`,
      data: { count: tools.length },
      rows: tools.map((tool) => ({ tool }))
    };
  }

  if (sub === "remove") {
    const id = parseFlag(args, "--id");
    if (!id) {
      throw new Error("--id is required");
    }
    await deps.registry.remove("tools", id);
    return { kind: "tool.remove", summary: `Removed tool ${id}`, data: { id } };
  }

  if (sub === "validate") {
    const path = parseFlag(args, "--path");
    if (!path) {
      throw new Error("--path is required");
    }
    const doc = await deps.registry.validate(path);
    validateToolManifest(doc);
    return { kind: "tool.validate", summary: "Tool manifest valid", data: { path } };
  }

  throw new Error(`Unknown tool subcommand: ${sub}`);
}

export async function runCli(argv: string[], deps?: Partial<CliDeps>): Promise<string> {
  const inference = deps?.inference ?? new OllamaAdapter();
  const provider = parseFlag(argv, "--provider");
  const search = deps?.search ?? createSearchProvider({ preferred: provider });
  const registry = deps?.registry ?? new LocalRegistry();

  if (!argv.length || argv.includes("--help")) {
    return `${helpText()}\n`;
  }

  const [command, ...args] = argv;
  const format = parseFormat(args);

  if (command === "ask") {
    const prompt = stripFlags(args).join(" ").trim();
    if (!prompt) {
      throw new Error("ask requires a prompt");
    }
    const response = await inference.generate({ prompt });
    return print(
      {
        kind: "ask.answer",
        summary: `Response from ${response.model}`,
        data: { prompt, response: response.text }
      },
      format
    );
  }

  if (command === "init") {
    const homeDir = parseFlag(args, "--home");
    const force = args.includes("--force");
    const result = await initZeus({ homeDir, force });
    return print(
      {
        kind: "init.complete",
        summary: result.createdConfig ? "Initialized Zeus local workspace" : "Zeus local workspace already initialized",
        data: { ...result }
      },
      format
    );
  }

  if (command === "search") {
    const query = stripFlags(args).join(" ").trim();
    if (!query) {
      throw new Error("search requires a query");
    }
    const results = await search.search(query, 7);
    return print(
      {
        kind: "search.results",
        summary: `Found ${results.length} result(s) for ${query}`,
        data: { query, provider: search.name },
        rows: results.map((result) => ({ ...result }))
      },
      format
    );
  }

  if (command === "contacts") {
    if (args[0] !== "find") {
      throw new Error("Unsupported contacts command");
    }
    const source = parseFlag(args, "--source") ?? "csv";
    let contacts = [];
    if (source === "csv") {
      const file = parseFlag(args, "--file");
      if (!file) {
        throw new Error("contacts find --source csv requires --file");
      }
      contacts = await parseLinkedInCsv(file);
    } else if (source === "urls") {
      const urls = (parseFlag(args, "--urls") ?? "").split(",").map((url) => url.trim()).filter(Boolean);
      contacts = parseProfileUrls(urls);
    } else {
      throw new Error(`Unsupported source: ${source}`);
    }

    const filtered = filterContacts(contacts, {
      role: parseFlag(args, "--role"),
      industry: parseFlag(args, "--industry"),
      location: parseFlag(args, "--location"),
      company_size: parseFlag(args, "--company-size")
    });

    return print(
      {
        kind: "contacts.results",
        summary: `Matched ${filtered.length} contact(s)`,
        data: { source, total: filtered.length },
        rows: filtered.map((contact) => ({ ...contact }))
      },
      format
    );
  }

  if (command === "content") {
    if (args[0] === "voice" && args[1] === "create") {
      const id = parseFlag(args, "--id");
      const tone = parseFlag(args, "--tone");
      const audience = parseFlag(args, "--audience");
      const guidelines = (parseFlag(args, "--guidelines") ?? "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
      if (!id || !tone || !audience) {
        throw new Error("voice create requires --id --tone --audience");
      }
      await saveVoice({ id, tone, audience, style_guidelines: guidelines });
      return print(
        {
          kind: "content.voice.create",
          summary: `Saved voice profile ${id}`,
          data: { id, tone, audience, guidelines }
        },
        format
      );
    }

    if (args[0] === "voice" && args[1] === "list") {
      const voices = await listVoices();
      return print(
        {
          kind: "content.voice.list",
          summary: `Found ${voices.length} voice profile(s)`,
          data: { count: voices.length },
          rows: voices.map((voice) => ({
            id: voice.id,
            tone: voice.tone,
            audience: voice.audience,
            style_guidelines: voice.style_guidelines.join(" | ")
          }))
        },
        format
      );
    }

    if (args[0] === "blog") {
      const topic = parseFlag(args, "--topic");
      const voiceId = parseFlag(args, "--voice");
      if (!topic || !voiceId) {
        throw new Error("content blog requires --topic and --voice");
      }
      const voice = await getVoice(voiceId);
      if (!voice) {
        throw new Error(`Voice profile not found: ${voiceId}`);
      }
      const result = await generateSeoBlog(inference, topic, voice);
      return print(result, format);
    }

    if (args[0] === "hook") {
      const topic = parseFlag(args, "--topic");
      const platform = parseFlag(args, "--platform") as "linkedin" | "x" | undefined;
      const voiceId = parseFlag(args, "--voice");
      if (!topic || !platform || !voiceId) {
        throw new Error("content hook requires --platform --topic --voice");
      }
      if (platform !== "linkedin" && platform !== "x") {
        throw new Error("platform must be linkedin or x");
      }
      const voice = await getVoice(voiceId);
      if (!voice) {
        throw new Error(`Voice profile not found: ${voiceId}`);
      }
      const result = await generateHookPost(inference, platform, topic, voice);
      return print(result, format);
    }

    throw new Error("Unsupported content command");
  }

  if (command === "research") {
    const question = stripFlags(args).join(" ").trim();
    if (!question) {
      throw new Error("research requires a question");
    }
    const result = await runResearchPipeline(question, inference, search);
    return print(result, format);
  }

  if (command === "skill") {
    return print(await handleSkill(args, { inference, search, registry }), format);
  }

  if (command === "tool") {
    return print(await handleTool(args, { inference, search, registry }), format);
  }

  throw new Error(`Unknown command: ${command}`);
}

async function main() {
  try {
    if (process.argv.slice(2).length === 0) {
      await startInteractive(runCli);
      return;
    }
    const output = await runCli(process.argv.slice(2));
    process.stdout.write(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
