import test from "node:test";
import assert from "node:assert/strict";
import type { SearchProvider } from "../src/core/contracts.ts";
import { CompositeSearchProvider } from "../src/search/compositeProvider.ts";
import { createSearchProvider } from "../src/search/factory.ts";

test("CompositeSearchProvider falls back to next provider when first fails", async () => {
  const failing: SearchProvider = {
    name: "fail",
    async search() {
      throw new Error("fail");
    }
  };

  const succeeding: SearchProvider = {
    name: "ok",
    async search(query: string) {
      return [{ title: "ok", url: `https://example.com/${query}`, snippet: "works" }];
    }
  };

  const provider = new CompositeSearchProvider([failing, succeeding]);
  const results = await provider.search("zeus", 3);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "ok");
});

test("createSearchProvider supports explicit duckduckgo", () => {
  const provider = createSearchProvider({ preferred: "duckduckgo" });
  assert.equal(provider.name, "duckduckgo-instant");
});

test("createSearchProvider rejects unavailable provider", () => {
  assert.throws(() => createSearchProvider({ preferred: "brave" }), /Unknown or unavailable search provider/);
});
