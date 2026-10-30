import { mount } from "@/lib/client/mount";

const BAND_TOP = 0.1;
const ROOT_MARGIN = "-10% 0px -70% 0px";
const SUPPRESS_MS = 1000;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initMobileToc(root: HTMLElement): () => void {
  const select = root.querySelector<HTMLSelectElement>(
    "[data-nb-mobile-toc-select]",
  );
  const label = root.querySelector<HTMLElement>("[data-nb-mobile-toc-label]");
  if (!select || !label) return () => {};

  type Heading = { slug: string; el: HTMLElement };
  const headings: Heading[] = Array.from(select.options)
    .map((o) => o.value)
    .filter((v) => v !== "_top")
    .map((slug) => ({ slug, el: document.getElementById(slug) }))
    .filter((h): h is Heading => h.el !== null);

  const controller = new AbortController();

  let suppress = false;
  let suppressTimer: ReturnType<typeof setTimeout> | undefined;

  function syncLabel() {
    const option = select!.selectedOptions[0];
    if (!option) return;
    label!.textContent = option.text.trim();
    label!.toggleAttribute("data-muted", option.value === "_top");
  }

  function setActive(slug: string) {
    if (select!.value !== slug) select!.value = slug;
    syncLabel();
  }

  select.addEventListener(
    "change",
    () => {
      const slug = select.value;
      syncLabel();
      suppress = true;
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(() => {
        suppress = false;
      }, SUPPRESS_MS);

      const behavior: ScrollBehavior = prefersReducedMotion()
        ? "auto"
        : "smooth";
      if (slug === "_top") {
        window.scrollTo({ top: 0, behavior });
        return;
      }
      document.getElementById(slug)?.scrollIntoView({ behavior });
    },
    { signal: controller.signal },
  );

  syncLabel();

  if (headings.length === 0) {
    return () => {
      controller.abort();
      clearTimeout(suppressTimer);
    };
  }

  const inBand = new Set<number>();

  function resolve() {
    if (suppress) return;

    if (inBand.size > 0) {
      setActive(headings[Math.min(...inBand)].slug);
      return;
    }

    const bandTop = window.innerHeight * BAND_TOP;
    const passed = headings.filter(
      (h) => h.el.getBoundingClientRect().top < bandTop,
    );
    setActive(passed.length > 0 ? passed[passed.length - 1].slug : "_top");
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const i = headings.findIndex((h) => h.el === entry.target);
        if (i === -1) continue;
        if (entry.isIntersecting) inBand.add(i);
        else inBand.delete(i);
      }
      resolve();
    },
    { rootMargin: ROOT_MARGIN, threshold: 0 },
  );

  for (const { el } of headings) observer.observe(el);
  resolve();

  let frame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        resolve();
      });
    },
    { passive: true, signal: controller.signal },
  );

  return () => {
    controller.abort();
    observer.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(suppressTimer);
  };
}

mount("[data-nb-mobile-toc]", initMobileToc);
