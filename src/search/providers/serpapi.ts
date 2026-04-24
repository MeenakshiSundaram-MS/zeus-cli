import type { SearchProvider, SearchResultItem } from "../../core/contracts.ts";

interface SerpApiResponse {
  organic_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
  }>;
}

export class SerpApiSearchProvider implements SearchProvider {
  readonly name = "serpapi-google";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, limit = 5): Promise<SearchResultItem[]> {
    if (!this.apiKey) {
      throw new Error("SerpAPI key is missing");
    }

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", query);
    url.searchParams.set("num", String(limit));
    url.searchParams.set("api_key", this.apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SerpAPI search failed: ${response.status}`);
    }

    const payload = (await response.json()) as SerpApiResponse;
    return (payload.organic_results ?? [])
      .filter((item) => item.title && item.link)
      .slice(0, limit)
      .map((item) => ({
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        snippet: item.snippet ?? ""
      }));
  }
}
