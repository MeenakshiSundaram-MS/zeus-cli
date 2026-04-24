import type { InferenceAdapter, InferenceRequest, InferenceResponse } from "../core/contracts.ts";

export class OllamaAdapter implements InferenceAdapter {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434", model = process.env.OLLAMA_MODEL ?? "llama3.2") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
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

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as { response?: string; model?: string };
    return {
      text: payload.response ?? "",
      model: payload.model ?? this.model
    };
  }
}
