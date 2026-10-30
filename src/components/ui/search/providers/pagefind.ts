interface PagefindSubResult {
  title?: string;
  url?: string;
}

interface PagefindResultData {
  url: string;
  excerpt?: string;
  meta?: { title?: string; section?: string };
  sub_results?: PagefindSubResult[];
}

interface PagefindSearchResponse {
  results: Array<{ data(): Promise<PagefindResultData> }>;
}

interface PagefindApi {
  init(): Promise<void>;
  options(options: { baseUrl?: string }): Promise<void>;
  search(query: string): Promise<PagefindSearchResponse>;
}

export type DocsSearchResult = {
  title: string;
  section?: string;
  url: string;
  snippet?: string;
  subResults?: { title: string; url: string }[];
};

export interface DocsSearchProvider {
  init?(): Promise<void>;
  search(query: string, opts?: { signal?: AbortSignal }): Promise<DocsSearchResult[]>;
}

let pagefind: PagefindApi | undefined;

export const provider: DocsSearchProvider = {
  async init() {
    if (pagefind) return;
    const pagefindUrl = new URL("/pagefind/pagefind.js", window.location.origin);
    const loaded = (await import(/* @vite-ignore */ pagefindUrl.href)) as PagefindApi;
    await loaded.options({ baseUrl: "/" });
    await loaded.init();
    pagefind = loaded;
  },

  async search(query) {
    if (!pagefind) await this.init?.();
    if (!pagefind) return [];

    const search = await pagefind.search(query);
    const results = await Promise.all(search.results.slice(0, 10).map((result) => result.data()));
    return results.map((result): DocsSearchResult => ({
      title: result.meta?.title ?? "Untitled",
      section: result.meta?.section?.trim() || undefined,
      url: result.url,
      snippet: result.excerpt,
      subResults: result.sub_results
        ?.filter((sub): sub is Required<PagefindSubResult> => Boolean(sub.title && sub.url))
        .map((sub) => ({ title: sub.title, url: sub.url })),
    }));
  },
};
