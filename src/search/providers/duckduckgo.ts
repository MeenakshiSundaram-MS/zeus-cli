import type { SearchProvider, SearchResultItem } from "../../core/contracts.ts";

type DuckTopic = { Text?: string; FirstURL?: string } | { Name?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> };

interface DuckResponse {
  AbstractText?: string;
  AbstractURL?: string;
  AbstractSource?: string;
  Heading?: string;
  RelatedTopics?: DuckTopic[];
}

export class DuckDuckGoSearchProvider implements SearchProvider {
  readonly name = "duckduckgo-instant";

  async search(query: string, limit = 5): Promise<SearchResultItem[]> {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Search provider failed: ${response.status}`);
    }

    const payload = (await response.json()) as DuckResponse;
    const results: SearchResultItem[] = [];

    if (payload.AbstractText && payload.AbstractURL) {
      results.push({
        title: payload.Heading || payload.AbstractSource || "Top result",
        url: payload.AbstractURL,
        snippet: payload.AbstractText
      });
    }

    const flattenTopic = (topic: DuckTopic): Array<{ Text?: string; FirstURL?: string }> => {
      if ("Topics" in topic && Array.isArray(topic.Topics)) {
        return topic.Topics;
      }
      if ("Text" in topic || "FirstURL" in topic) {
        return [topic];
      }
      return [];
    };

    for (const topic of payload.RelatedTopics ?? []) {
      for (const entry of flattenTopic(topic)) {
        if (!entry.Text || !entry.FirstURL) {
          continue;
        }
        results.push({
          title: entry.Text.split(" - ")[0] || "Related",
          url: entry.FirstURL,
          snippet: entry.Text
        });
        if (results.length >= limit) {
          return results;
        }
      }
    }

    return results.slice(0, limit);
  }
}
