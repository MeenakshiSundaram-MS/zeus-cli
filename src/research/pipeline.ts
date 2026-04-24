import type { InferenceAdapter, SearchProvider } from "../core/contracts.ts";

export async function runResearchPipeline(
  question: string,
  adapter: InferenceAdapter,
  search: SearchProvider
) {
  const decompositionPrompt = `Break this software research question into 3 focused web-search queries:\n${question}`;
  const decomposition = await adapter.generate({ prompt: decompositionPrompt, temperature: 0.2 });
  const queries = decomposition.text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const sources = [] as Array<{ title: string; url: string; snippet: string; query: string }>;

  for (const query of queries) {
    const results = await search.search(query, 3);
    for (const item of results) {
      sources.push({ ...item, query });
    }
  }

  const synthesisPrompt = [
    "Synthesize a concise, practical research report from the sources below.",
    "Question:",
    question,
    "Sources:",
    JSON.stringify(sources)
  ].join("\n");

  const synthesis = await adapter.generate({ prompt: synthesisPrompt, temperature: 0.2 });

  return {
    kind: "research.report",
    summary: `Research report for: ${question}`,
    data: {
      question,
      decomposition: queries,
      report: synthesis.text
    },
    citations: sources.map((source) => ({ title: source.title, url: source.url }))
  };
}
