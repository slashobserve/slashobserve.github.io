import { mount } from "@/lib/client/mount"

const STORAGE_KEY = "sidebar-state"

interface SidebarState {
  scroll: number
}

function initSidebar(root: HTMLElement): () => void {
  if (!root.hasAttribute("data-nb-sidebar-persist")) return () => {}
  return initPersistence(root)
}

function initPersistence(root: HTMLElement): () => void {
  const scrollHost: HTMLElement =
    root.closest<HTMLElement>("[data-nb-sidebar-tree]") ?? root.closest("aside") ?? root

  function savedScroll(): number | null {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null")
      return typeof saved?.scroll === "number" ? saved.scroll : null
    } catch {
      return null
    }
  }

  function readState(): SidebarState {
    return {
      scroll: scrollHost.clientHeight > 0 ? scrollHost.scrollTop : (savedScroll() ?? 0),
    }
  }

  function restoreScroll() {
    const scroll = savedScroll()
    if (scroll !== null) scrollHost.scrollTop = scroll
    const active = root.querySelector("[aria-current='page']")
    if (!active) return
    const box = scrollHost.getBoundingClientRect()
    const item = active.getBoundingClientRect()
    if (item.top < box.top || item.bottom > box.bottom) {
      scrollHost.scrollTop += item.top - box.top - box.height / 2 + item.height / 2
    }
  }

  let visible = scrollHost.clientHeight > 0
  const resize =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(() => {
          const nowVisible = scrollHost.clientHeight > 0
          if (nowVisible && !visible) restoreScroll()
          visible = nowVisible
        })
  resize?.observe(scrollHost)

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(readState()))
    } catch {}
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") save()
  }
  document.addEventListener("visibilitychange", handleVisibility)
  window.addEventListener("pagehide", save)

  let raf = 0
  function handleScroll() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(save)
  }
  scrollHost.addEventListener("scroll", handleScroll)

  return () => {
    resize?.disconnect()
    document.removeEventListener("visibilitychange", handleVisibility)
    window.removeEventListener("pagehide", save)
    scrollHost.removeEventListener("scroll", handleScroll)
    cancelAnimationFrame(raf)
  }
}

mount("[data-nb-sidebar]", initSidebar)
