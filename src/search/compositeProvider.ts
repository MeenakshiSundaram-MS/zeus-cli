import type { SearchProvider, SearchResultItem } from "../core/contracts.ts";

export class CompositeSearchProvider implements SearchProvider {
  readonly name: string;
  private readonly providers: SearchProvider[];

  constructor(providers: SearchProvider[]) {
    this.providers = providers;
    this.name = providers.map((provider) => provider.name).join(" -> ");
  }

  async search(query: string, limit = 5): Promise<SearchResultItem[]> {
    const failures: string[] = [];

    for (const provider of this.providers) {
      try {
        const results = await provider.search(query, limit);
        if (results.length > 0) {
          return results;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${provider.name}: ${message}`);
      }
    }

    if (failures.length) {
      throw new Error(`All search providers failed. ${failures.join(" | ")}`);
    }

    return [];
  }
}
