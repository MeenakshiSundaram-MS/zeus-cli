export type OutputFormat = "markdown" | "json" | "csv" | "txt";

export interface CommandResult {
  kind: string;
  summary: string;
  data: Record<string, unknown>;
  rows?: Array<Record<string, unknown>>;
  citations?: Array<{ title: string; url: string }>;
}

export interface InferenceRequest {
  prompt: string;
  system?: string;
  temperature?: number;
}

export interface InferenceResponse {
  text: string;
  model: string;
}

export interface InferenceAdapter {
  generate(request: InferenceRequest): Promise<InferenceResponse>;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  name: string;
  search(query: string, limit?: number): Promise<SearchResultItem[]>;
}

export interface Formatter {
  format(result: CommandResult): string;
}

export interface ToolExecutor {
  run(toolId: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface SkillExecutor {
  execute(skillId: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
}
