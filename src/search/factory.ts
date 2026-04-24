import type { SearchProvider } from "../core/contracts.ts";
import { CompositeSearchProvider } from "./compositeProvider.ts";
import { BraveSearchProvider } from "./providers/brave.ts";
import { DuckDuckGoSearchProvider } from "./providers/duckduckgo.ts";
import { SerpApiSearchProvider } from "./providers/serpapi.ts";

export interface SearchFactoryOptions {
  preferred?: string;
}

export function createSearchProvider(options: SearchFactoryOptions = {}): SearchProvider {
  const preferred = (options.preferred ?? process.env.ZEUS_SEARCH_PROVIDER ?? "auto").toLowerCase();
  const braveKey = process.env.BRAVE_API_KEY ?? "";
  const serpApiKey = process.env.SERPAPI_API_KEY ?? "";

  const pool: Record<string, SearchProvider | undefined> = {
    brave: braveKey ? new BraveSearchProvider(braveKey) : undefined,
    serpapi: serpApiKey ? new SerpApiSearchProvider(serpApiKey) : undefined,
    duckduckgo: new DuckDuckGoSearchProvider()
  };

  if (preferred !== "auto") {
    const selected = pool[preferred];
    if (!selected) {
      throw new Error(`Unknown or unavailable search provider: ${preferred}`);
    }
    return selected;
  }

  const ordered = [pool.brave, pool.serpapi, pool.duckduckgo].filter(Boolean) as SearchProvider[];
  return new CompositeSearchProvider(ordered);
}
