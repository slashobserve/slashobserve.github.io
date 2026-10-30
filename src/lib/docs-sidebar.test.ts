import { describe, expect, test } from "bun:test"
import {
  buildSidebar,
  orderPages,
  prevNext,
  sectionLabel,
  sectionOf,
  type DocsPageRef,
} from "./docs-sidebar"

function page(id: string, title: string): DocsPageRef {
  return { id, title, description: "", href: `/docs/${id}/` }
}

const titles = (pages: DocsPageRef[]) => pages.map((entry) => entry.title)

describe("sectionOf and sectionLabel", () => {
  test("read the section from a docs path", () => {
    expect(sectionOf("/docs/get-started/quick-start/")).toBe("get-started")
    expect(sectionLabel("/docs/reference/configuration/")).toBe("Reference")
  })

  test("return null outside the docs or for an unknown section", () => {
    expect(sectionOf("/features/")).toBeNull()
    expect(sectionLabel("/features/")).toBeNull()
    expect(sectionLabel("/docs/unknown/page/")).toBeNull()
    expect(sectionOf("/docs/")).toBeNull()
  })
})

describe("orderPages", () => {
  test("puts known sections in site order with sentence-case labels", () => {
    const ordered = orderPages([
      page("connect/oidc", "OIDC"),
      page("get-started/install", "Install"),
      page("concepts/agent", "Agent"),
    ])
    expect(ordered.map((group) => group.label)).toEqual(["Get started", "Connect", "Concepts"])
  })

  test("sorts listed pages by PAGE_ORDER", () => {
    const [first] = orderPages([
      page("get-started/install", "Run your own deployment"),
      page("get-started/quick-start", "Quick start"),
      page("get-started/what-is-slashobserve", "What is SlashObserve"),
    ])
    expect(titles(first!.pages)).toEqual(["What is SlashObserve", "Quick start", "Run your own deployment"])
  })

  test("puts unlisted pages after listed ones, by title", () => {
    const [first] = orderPages([
      page("operate/outbound-access", "Outbound access"),
      page("operate/logging", "Logging"),
      page("operate/security-model", "Security model"),
      page("operate/production", "Production"),
    ])
    expect(titles(first!.pages)).toEqual(["Production", "Security model", "Logging", "Outbound access"])
  })

  test("puts unknown sections after known ones by directory, and root pages last", () => {
    const ordered = orderPages([
      page("overview", "Overview"),
      page("zeta-things/a", "A"),
      page("extra-stuff/thing", "Thing"),
      page("use/chat", "Chat"),
    ])
    expect(ordered.map((group) => group.label)).toEqual(["Use", "Extra stuff", "Zeta things", "Docs"])
  })

  test("returns no groups for no pages", () => {
    expect(orderPages([])).toEqual([])
  })
})

describe("buildSidebar", () => {
  const ordered = orderPages([
    page("get-started/quick-start", "Quick start"),
    page("get-started/install", "Install"),
    page("connect/prometheus", "Prometheus"),
  ])

  test("lists links by title and marks only the matching href as current", () => {
    const sidebar = buildSidebar(ordered, "/docs/get-started/install/")
    expect(sidebar).toEqual([
      {
        label: "Get started",
        links: [
          { label: "Quick start", href: "/docs/get-started/quick-start/", isCurrent: false },
          { label: "Install", href: "/docs/get-started/install/", isCurrent: true },
        ],
      },
      {
        label: "Connect",
        links: [{ label: "Prometheus", href: "/docs/connect/prometheus/", isCurrent: false }],
      },
    ])
  })

  test("marks nothing current for an unknown href", () => {
    const links = buildSidebar(ordered, "/docs/nope/").flatMap((group) => group.links)
    expect(links.some((link) => link.isCurrent)).toBe(false)
  })
})

describe("prevNext", () => {
  const ordered = orderPages([
    page("get-started/quick-start", "Quick start"),
    page("get-started/install", "Install"),
    page("connect/prometheus", "Prometheus"),
    page("connect/clickhouse", "ClickHouse"),
  ])

  test("crosses a section boundary", () => {
    expect(prevNext(ordered, "/docs/get-started/install/")).toEqual({
      prev: { label: "Quick start", href: "/docs/get-started/quick-start/" },
      next: { label: "Prometheus", href: "/docs/connect/prometheus/" },
    })
  })

  test("has no previous page for the first and no next page for the last", () => {
    expect(prevNext(ordered, "/docs/get-started/quick-start/").prev).toBeUndefined()
    expect(prevNext(ordered, "/docs/connect/clickhouse/").next).toBeUndefined()
  })

  test("is empty for an unknown href", () => {
    expect(prevNext(ordered, "/docs/nope/")).toEqual({})
  })
})
