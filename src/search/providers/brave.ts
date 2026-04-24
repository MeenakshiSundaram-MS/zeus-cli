import type { SearchProvider, SearchResultItem } from "../../core/contracts.ts";

interface BraveResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
    }>;
  };
}

export class BraveSearchProvider implements SearchProvider {
  readonly name = "brave-search";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, limit = 5): Promise<SearchResultItem[]> {
    if (!this.apiKey) {
      throw new Error("Brave API key is missing");
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(limit));

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.status}`);
    }

    const payload = (await response.json()) as BraveResponse;
    return (payload.web?.results ?? [])
      .filter((item) => item.title && item.url)
      .slice(0, limit)
      .map((item) => ({
        title: item.title ?? "Untitled",
        url: item.url ?? "",
        snippet: item.description ?? ""
      }));
  }
}
