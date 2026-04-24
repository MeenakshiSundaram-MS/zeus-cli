import type { CommandResult, Formatter, OutputFormat } from "../core/contracts.ts";

class JsonFormatter implements Formatter {
  format(result: CommandResult): string {
    return `${JSON.stringify(result, null, 2)}\n`;
  }
}

class TxtFormatter implements Formatter {
  format(result: CommandResult): string {
    return `${result.summary}\n${JSON.stringify(result.data, null, 2)}\n`;
  }
}

class MarkdownFormatter implements Formatter {
  format(result: CommandResult): string {
    const lines = [`# ${result.kind}`, "", result.summary, "", "## Data", "", "```json", JSON.stringify(result.data, null, 2), "```"];
    if (result.citations?.length) {
      lines.push("", "## Citations");
      for (const citation of result.citations) {
        lines.push(`- [${citation.title}](${citation.url})`);
      }
    }
    return `${lines.join("\n")}\n`;
  }
}

class CsvFormatter implements Formatter {
  format(result: CommandResult): string {
    const rows = result.rows ?? [];
    if (!rows.length) {
      return "\n";
    }

    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const escape = (value: unknown) => {
      const raw = String(value ?? "");
      if (raw.includes(",") || raw.includes("\"")) {
        return `"${raw.replace(/\"/g, '""')}"`;
      }
      return raw;
    };

    const out = [headers.join(",")];
    for (const row of rows) {
      out.push(headers.map((header) => escape(row[header])).join(","));
    }
    return `${out.join("\n")}\n`;
  }
}

export function formatterFor(format: OutputFormat): Formatter {
  switch (format) {
    case "json":
      return new JsonFormatter();
    case "csv":
      return new CsvFormatter();
    case "txt":
      return new TxtFormatter();
    case "markdown":
    default:
      return new MarkdownFormatter();
  }
}
