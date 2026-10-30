import { describe, expect, test } from "bun:test"
import { homeFirstPage, homeSections, homeStart } from "./docs-home"
import { orderPages, type DocsPageRef } from "./docs-sidebar"

function page(id: string, title: string, description = `About ${title}`, extra: Partial<DocsPageRef> = {}): DocsPageRef {
  return { id, title, description, href: `/docs/${id}/`, ...extra }
}

describe("homeStart", () => {
  test("lists the start pages in the configured order with their own title, description and href", () => {
    const pages = [
      page("use/mcp", "MCP"),
      page("get-started/install", "Install"),
      page("get-started/first-dashboard", "Your first dashboard"),
      page("get-started/quick-start", "Quick start", "Run the demo."),
      page("concepts/agent", "Agent"),
    ]
    expect(homeStart(pages)).toEqual([
      { title: "Quick start", description: "Run the demo.", href: "/docs/get-started/quick-start/" },
      {
        title: "Your first dashboard",
        description: "About Your first dashboard",
        href: "/docs/get-started/first-dashboard/",
      },
      { title: "Install", description: "About Install", href: "/docs/get-started/install/" },
      { title: "MCP", description: "About MCP", href: "/docs/use/mcp/" },
    ])
  })

  test("skips a start page that does not exist", () => {
    const links = homeStart([page("get-started/quick-start", "Quick start"), page("use/mcp", "MCP")])
    expect(links.map((link) => link.title)).toEqual(["Quick start", "MCP"])
  })

  test("returns nothing when no start page exists", () => {
    expect(homeStart([page("concepts/agent", "Agent")])).toEqual([])
    expect(homeStart([])).toEqual([])
  })
})

describe("homeSections", () => {
  test("uses the section dir as id and the section label, in sidebar order", () => {
    const sections = homeSections(
      orderPages([page("reference/configuration", "Configuration"), page("get-started/install", "Install")]),
    )
    expect(sections.map((section) => [section.id, section.label])).toEqual([
      ["get-started", "Get started"],
      ["reference", "Reference"],
    ])
  })

  test("uses docs as the id of the root group", () => {
    const sections = homeSections(orderPages([page("overview", "Overview"), page("use/cli", "CLI")]))
    expect(sections.map((section) => section.id)).toEqual(["use", "docs"])
  })

  test("shows a nested group with an index page as one entry with the group label and the index description", () => {
    const sections = homeSections(
      orderPages([
        page("reference/configuration", "Configuration"),
        page("reference/observespec", "ObserveSpec schema", "The dashboard format.", { order: 1 }),
        page("reference/observespec/panels", "Panels", "Panel types.", { order: 2 }),
        page("reference/observespec/variables", "Variables", "Variable types.", { order: 3 }),
      ]),
    )
    expect(sections[0].links).toEqual([
      { title: "Configuration", description: "About Configuration", href: "/docs/reference/configuration/" },
      { title: "ObserveSpec schema", description: "The dashboard format.", href: "/docs/reference/observespec/" },
    ])
  })

  test("skips a nested group without an index page", () => {
    const sections = homeSections(
      orderPages([page("reference/configuration", "Configuration"), page("reference/http/overview", "Overview")]),
    )
    expect(sections[0].links.map((link) => link.title)).toEqual(["Configuration"])
  })

  test("skips a section whose items give no links", () => {
    expect(homeSections(orderPages([page("reference/http/overview", "Overview")]))).toEqual([])
  })

  test("returns nothing for no sections", () => {
    expect(homeSections([])).toEqual([])
  })
})

describe("homeFirstPage", () => {
  test("is the first page of the first section", () => {
    const ordered = orderPages([page("use/cli", "CLI"), page("get-started/install", "Install")])
    expect(homeFirstPage(ordered)).toEqual({ label: "Install", href: "/docs/get-started/install/" })
  })

  test("is undefined without sections", () => {
    expect(homeFirstPage([])).toBeUndefined()
  })
})
