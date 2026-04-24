import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { isInitialized } from "./config/localConfig.ts";

export type CommandHandler = (argv: string[]) => Promise<string>;

const COMMANDS = new Set(["ask", "search", "contacts", "content", "research", "skill", "tool", "init", "doctor"]);

export function splitArgs(line: string): string[] {
  const args: string[] = [];
  let current = "";
  let quote: "'" | "\"" | undefined;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if ((char === "'" || char === "\"") && !quote) {
      quote = char;
      continue;
    }

    if (quote && char === quote) {
      quote = undefined;
      continue;
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) {
    args.push(current);
  }

  return args;
}

function toCommand(line: string): string[] {
  const tokens = splitArgs(line);
  if (!tokens.length) {
    return [];
  }
  if (COMMANDS.has(tokens[0])) {
    return tokens;
  }
  return ["ask", line];
}

export async function startInteractive(handler: CommandHandler): Promise<void> {
  output.write("Zeus CLI — Local AI Agent\n");
  output.write("Type /help for commands, /exit to quit.\n");

  const initialized = await isInitialized();
  if (!initialized) {
    output.write("\nFirst time? Run: zeus init\n");
  }
  output.write("\n");

  const rl = createInterface({ input, output });
  try {
    while (true) {
      const line = (await rl.question("zeus > ")).trim();
      if (!line) {
        continue;
      }
      if (line === "/exit" || line === "/quit" || line === "exit" || line === "quit") {
        output.write("bye\n");
        break;
      }
      if (line === "/help") {
        output.write(await handler(["--help"]));
        continue;
      }

      try {
        output.write(await handler(toCommand(line)));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.write(`Error: ${message}\n`);
      }
    }
  } finally {
    rl.close();
  }
}
