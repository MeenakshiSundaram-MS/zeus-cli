import test from "node:test";
import assert from "node:assert/strict";
import { DuckDuckGoSearchProvider } from "../src/search/defaultSearchProvider.ts";

test("DuckDuckGoSearchProvider maps duck payload into normalized results", async () => {
  const provider = new DuckDuckGoSearchProvider();

  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: true,
      async json() {
        return {
          Heading: "Topic",
          AbstractText: "Top summary",
          AbstractURL: "https://top.example",
          RelatedTopics: [
            { Text: "A - first", FirstURL: "https://a.example" },
            { Name: "Nested", Topics: [{ Text: "B - second", FirstURL: "https://b.example" }] }
          ]
        };
      }
    }) as Response;

  const results = await provider.search("test", 3);
  globalThis.fetch = original;

  assert.equal(results.length, 3);
  assert.equal(results[0].url, "https://top.example");
  assert.equal(results[2].url, "https://b.example");
});
