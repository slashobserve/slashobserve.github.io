import { mount } from "@/lib/client/mount";
import { provider, type DocsSearchProvider, type DocsSearchResult } from "./providers/pagefind";

const IDLE_MESSAGE = "Search pages and headings.";
const LOADING_MESSAGE = "Searching…";
const LOAD_FAILURE_MESSAGE = "Search could not load. Check your connection and try again.";

function noResultsMessage(query: string): string {
  return `No results for "${query}". Try a setting, a datasource or a CLI command.`;
}

export interface SearchConfig {
  input: HTMLInputElement;
  resultsContainer: HTMLElement;
  emptyState: HTMLElement;
  provider: DocsSearchProvider;
  onNavigate?: () => void;
}

export interface SearchInstance {
  reset(): Promise<void>;
  destroy(): void;
}

export function initSearch(config: SearchConfig): SearchInstance {
  const { input, resultsContainer, emptyState, provider, onNavigate } = config;

  let initialized = false;
  let activeIndex = -1;
  let resultIdCounter = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let activeController: AbortController | undefined;

  function getOptions(): HTMLElement[] {
    return Array.from(resultsContainer.querySelectorAll<HTMLElement>("[role='option']"));
  }

  function updateActive(newIndex: number): void {
    const options = getOptions();
    if (options.length === 0) {
      activeIndex = -1;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = Math.max(-1, Math.min(newIndex, options.length - 1));
    options.forEach((option, index) => {
      if (index === activeIndex) {
        option.setAttribute("data-highlighted", "");
        option.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", option.id);
      } else {
        option.removeAttribute("data-highlighted");
      }
    });
    if (activeIndex < 0) input.removeAttribute("aria-activedescendant");
  }

  function clearResults(): void {
    for (const result of resultsContainer.querySelectorAll("[role='option']")) result.remove();
    resultsContainer.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function resultLink(title: string, href: string, className: string): HTMLAnchorElement {
    const link = document.createElement("a");
    link.href = href;
    link.className = className;
    link.textContent = title;
    link.addEventListener("click", () => onNavigate?.());
    return link;
  }

  function buildResult(result: DocsSearchResult): HTMLElement {
    const option = document.createElement("div");
    option.id = `search-result-${resultIdCounter++}`;
    option.setAttribute("role", "option");
    option.className = "search-option";

    if (result.section) {
      const section = document.createElement("p");
      section.className = "search-section";
      section.textContent = result.section;
      option.appendChild(section);
    }

    const link = resultLink(result.title, result.url, "search-title");
    option.appendChild(link);

    if (result.snippet) {
      const snippet = document.createElement("p");
      snippet.className = "search-snippet";
      snippet.innerHTML = result.snippet;
      option.appendChild(snippet);
    }

    if (result.subResults?.length) {
      const subList = document.createElement("div");
      subList.className = "search-subs";
      for (const sub of result.subResults.slice(0, 3)) {
        subList.appendChild(resultLink(sub.title, sub.url, "search-sub"));
      }
      option.appendChild(subList);
    }

    option.addEventListener("click", (event) => {
      if ((event.target as Element | null)?.closest("a")) return;
      link.click();
    });

    return option;
  }

  async function ensureInitialized(): Promise<boolean> {
    if (initialized) return true;
    try {
      await provider.init?.();
      initialized = true;
      return true;
    } catch {
      emptyState.textContent = import.meta.env.DEV
        ? "Search is available after a production build."
        : LOAD_FAILURE_MESSAGE;
      return false;
    }
  }

  async function runSearch(query: string): Promise<void> {
    activeController?.abort();
    activeController = new AbortController();
    const signal = activeController.signal;

    emptyState.style.display = "";
    emptyState.textContent = LOADING_MESSAGE;
    clearResults();

    if (!(await ensureInitialized()) || signal.aborted) return;

    try {
      const results = await provider.search(query, { signal });
      if (signal.aborted) return;

      clearResults();
      activeIndex = -1;

      if (results.length === 0) {
        emptyState.style.display = "";
        emptyState.textContent = noResultsMessage(query);
        return;
      }

      emptyState.style.display = "none";
      input.setAttribute("aria-expanded", "true");
      for (const result of results) resultsContainer.appendChild(buildResult(result));
      resultsContainer.hidden = false;
    } catch {
      if (signal.aborted) return;
      clearResults();
      emptyState.style.display = "";
      emptyState.textContent = "Search is temporarily unavailable.";
    }
  }

  function handleInput(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim();
      if (!query) {
        activeController?.abort();
        clearResults();
        emptyState.style.display = "";
        emptyState.textContent = IDLE_MESSAGE;
        return;
      }
      void runSearch(query);
    }, 150);
  }

  function handleKeydown(event: KeyboardEvent): void {
    const options = getOptions();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      updateActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      updateActive(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      updateActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      updateActive(options.length - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      options[activeIndex]?.querySelector<HTMLAnchorElement>("a")?.click();
    }
  }

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown);

  return {
    async reset() {
      activeController?.abort();
      if (debounceTimer) clearTimeout(debounceTimer);
      input.value = "";
      input.focus();
      input.select();
      activeIndex = -1;
      clearResults();
      emptyState.style.display = "";
      emptyState.textContent = IDLE_MESSAGE;
      await ensureInitialized();
    },
    destroy() {
      activeController?.abort();
      if (debounceTimer) clearTimeout(debounceTimer);
      input.removeEventListener("input", handleInput);
      input.removeEventListener("keydown", handleKeydown);
    },
  };
}

type SearchDialogElement = HTMLDialogElement & {
  __openSearchDialog?: () => void;
};

function primaryDialog(): SearchDialogElement | null {
  return document.querySelector<SearchDialogElement>("[data-search-dialog][data-search-ready]");
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("input, textarea, select, [contenteditable]") !== null;
}

// ClientRouter keeps document listeners across swaps, so the guard must outlive the <html> attributes it resets.
let globalsBound = false;

function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  document.addEventListener("click", (event) => {
    const trigger = (event.target as Element | null)?.closest("[data-search-trigger]");
    if (!trigger) return;
    primaryDialog()?.__openSearchDialog?.();
  });

  document.addEventListener("keydown", (event) => {
    const dialog = primaryDialog();
    if (!dialog) return;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else dialog.__openSearchDialog?.();
      return;
    }

    const bare = !event.metaKey && !event.ctrlKey && !event.altKey;
    if (event.key === "/" && bare && !dialog.open && !isTypingTarget(event.target)) {
      event.preventDefault();
      dialog.__openSearchDialog?.();
    }
  });
}

mount("[data-search-dialog]", (root) => {
  const dialog = root as SearchDialogElement;
  dialog.setAttribute("data-search-ready", "true");

  const input = dialog.querySelector<HTMLInputElement>("[data-search-input]");
  const resultsContainer = dialog.querySelector<HTMLElement>("[data-search-results]");
  const emptyState = dialog.querySelector<HTMLElement>("[data-search-empty]");
  if (!input || !resultsContainer || !emptyState) return () => {};

  const search = initSearch({
    input,
    resultsContainer,
    emptyState,
    provider,
    onNavigate: () => dialog.close(),
  });

  let returnFocusTo: HTMLElement | null = null;

  dialog.__openSearchDialog = () => {
    if (!dialog.open) {
      returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    }
    void search.reset();
  };

  const restoreFocus = () => {
    if (returnFocusTo?.isConnected) returnFocusTo.focus();
    returnFocusTo = null;
  };
  dialog.addEventListener("close", restoreFocus);

  return () => {
    dialog.removeEventListener("close", restoreFocus);
    search.destroy();
  };
});

bindGlobals();
