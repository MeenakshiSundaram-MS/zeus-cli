import test from "node:test";
import assert from "node:assert/strict";
import { runResearchPipeline } from "../src/research/pipeline.ts";

const fakeAdapter = {
  calls: [] as string[],
  async generate(request: { prompt: string }) {
    this.calls.push(request.prompt);
    if (request.prompt.startsWith("Break this software research question")) {
      return {
        text: "1. latest ollama models\n2. local vector db benchmarks\n3. node cli ai patterns",
        model: "fake"
      };
    }

    return {
      text: "Final synthesized report",
      model: "fake"
    };
  }
};

const fakeSearch = {
  name: "fake",
  async search(query: string) {
    return [{ title: `Result for ${query}`, url: `https://example.com/${encodeURIComponent(query)}`, snippet: "snippet" }];
  }
};

test("runResearchPipeline decomposes question, gathers sources, and synthesizes", async () => {
  const result = await runResearchPipeline("How to design agent plugins?", fakeAdapter, fakeSearch);

  assert.equal(result.kind, "research.report");
  assert.equal(result.data.decomposition.length, 3);
  assert.equal(result.citations.length, 3);
  assert.match(String(result.data.report), /Final synthesized report/);
});
