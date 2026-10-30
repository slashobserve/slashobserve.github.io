import { describe, expect, test } from "bun:test"
import {
  buildSidebar,
  orderPages,
  prevNext,
  sectionLabel,
  sectionOf,
  type DocsLink,
  type DocsPageRef,
  type DocsSubgroup,
  type OrderedItem,
} from "./docs-sidebar"

function page(id: string, title: string, extra: Partial<DocsPageRef> = {}): DocsPageRef {
  return { id, title, description: "", href: `/docs/${id}/`, ...extra }
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
        items: [
          { label: "Quick start", href: "/docs/get-started/quick-start/", isCurrent: false },
          { label: "Install", href: "/docs/get-started/install/", isCurrent: true },
        ],
      },
      {
        label: "Connect",
        items: [{ label: "Prometheus", href: "/docs/connect/prometheus/", isCurrent: false }],
      },
    ])
  })

  test("marks nothing current for an unknown href", () => {
    const items = buildSidebar(ordered, "/docs/nope/").flatMap((group) => group.items)
    expect(items.some((item) => "isCurrent" in item && item.isCurrent)).toBe(false)
  })
})

describe("nested groups", () => {
  const pages = [
    page("reference/logging", "Zzz unrelated"),
    page("reference/observespec/field-options", "Field options", { order: 300 }),
    page("reference/observespec/panels/stat", "stat", { order: 201 }),
    page("reference/observespec/panels/timeseries", "timeseries", { order: 200 }),
    page("reference/observespec/variables/query", "query", { order: 100 }),
    page("reference/observespec", "ObserveSpec schema", { navLabel: "Overview", order: 0 }),
    page("reference/configuration", "Configuration"),
  ]
  const ordered = orderPages(pages)
  const reference = ordered[0]!
  const describeItem = (item: OrderedItem): unknown =>
    item.kind === "page"
      ? item.page.title
      : { group: item.label, items: item.items.map(describeItem) }

  test("nests folders as groups ordered by PAGE_ORDER, then order, then title", () => {
    expect(reference.items.map(describeItem)).toEqual([
      "Configuration",
      {
        group: "ObserveSpec schema",
        items: [
          { group: "Variables", items: ["query"] },
          { group: "Panels", items: ["timeseries", "stat"] },
          "Field options",
        ],
      },
      "Zzz unrelated",
    ])
  })

  test("lists pages in reading order, a group index before its children", () => {
    expect(titles(reference.pages)).toEqual([
      "Configuration",
      "ObserveSpec schema",
      "query",
      "timeseries",
      "stat",
      "Field options",
      "Zzz unrelated",
    ])
  })

  test("builds subgroups that start with the index link under its nav label", () => {
    const [section] = buildSidebar(ordered, "/docs/reference/configuration/")
    const group = section!.items[1] as DocsSubgroup
    expect(group.label).toBe("ObserveSpec schema")
    expect(group.items[0]).toEqual({
      label: "Overview",
      href: "/docs/reference/observespec/",
      isCurrent: false,
    })
    expect(group.containsCurrent).toBe(false)
  })

  test("marks every subgroup on the path to the current page", () => {
    const [section] = buildSidebar(ordered, "/docs/reference/observespec/panels/stat/")
    const group = section!.items[1] as DocsSubgroup
    const [overview, variables, panels] = group.items as [DocsLink, DocsSubgroup, DocsSubgroup]
    expect(group.containsCurrent).toBe(true)
    expect(panels.containsCurrent).toBe(true)
    expect(variables.containsCurrent).toBe(false)
    expect(overview.isCurrent).toBe(false)
    expect(panels.items).toEqual([
      { label: "timeseries", href: "/docs/reference/observespec/panels/timeseries/", isCurrent: false },
      { label: "stat", href: "/docs/reference/observespec/panels/stat/", isCurrent: true },
    ])
  })

  test("marks the group when its index page is current", () => {
    const [section] = buildSidebar(ordered, "/docs/reference/observespec/")
    expect((section!.items[1] as DocsSubgroup).containsCurrent).toBe(true)
  })

  test("walks previous and next through the nested order", () => {
    expect(prevNext(ordered, "/docs/reference/observespec/panels/timeseries/")).toEqual({
      prev: { label: "query", href: "/docs/reference/observespec/variables/query/" },
      next: { label: "stat", href: "/docs/reference/observespec/panels/stat/" },
    })
  })

  test("keeps a folder page without an index as a plain group labelled from the folder", () => {
    const [section] = orderPages([page("use/deep/a", "A"), page("use/deep/b", "B")])
    expect(section!.items.map(describeItem)).toEqual([{ group: "Deep", items: ["A", "B"] }])
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
