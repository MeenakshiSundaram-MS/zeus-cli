import type { InferenceAdapter, InferenceRequest, InferenceResponse } from "../core/contracts.ts";

export interface OllamaHealthResult {
  ok: boolean;
  message: string;
}

export class OllamaAdapter implements InferenceAdapter {
  readonly baseUrl: string;
  readonly model: string;

  constructor(baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434", model = process.env.OLLAMA_MODEL ?? "llama3.2") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async health(): Promise<OllamaHealthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return { ok: false, message: `Ollama responded with HTTP ${response.status}` };
      }
      return { ok: true, message: `Reachable at ${this.baseUrl} (model: ${this.model})` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isConnectionError(msg)) {
        return { ok: false, message: `Ollama not reachable at ${this.baseUrl} — is it running? Try: ollama serve` };
      }
      return { ok: false, message: msg };
    }
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: request.prompt,
          system: request.system,
          temperature: request.temperature,
          stream: false
        })
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isConnectionError(msg)) {
        throw new Error(`Ollama not reachable at ${this.baseUrl} — is it running? Try: ollama serve`);
      }
      throw error;
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Model '${this.model}' not found in Ollama — run: ollama pull ${this.model}`);
      }
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as { response?: string; model?: string };
    return {
      text: payload.response ?? "",
      model: payload.model ?? this.model
    };
  }
}

function isConnectionError(msg: string): boolean {
  return msg.includes("ECONNREFUSED") || msg.includes("fetch failed") || msg.includes("ECONNRESET") || msg.includes("ENOTFOUND");
}
