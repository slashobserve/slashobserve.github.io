import { describe, expect, test } from "bun:test"
import { DOC_LINK_CANDIDATES, resolveDocLinks } from "./doc-links"
import { footerColumns, headerNav } from "./site-nav"

const today = new Set(["docs/self-hosting"])
const afterSplit = new Set([
  "docs/self-hosting",
  "docs/get-started/quick-start",
  "docs/get-started/install",
  "docs/use/import-from-grafana",
  "docs/use/mcp",
  "docs/reference",
  "docs/teams/roles",
  "docs/teams/folders",
  "docs/connect/oidc",
  "docs/connect/llm-providers",
  "docs/use/cli",
  "docs/connect/prometheus",
])

describe("resolveDocLinks", () => {
  test("falls back to headings of the single self-hosting page", () => {
    expect(resolveDocLinks(today)).toEqual({
      quickStart: "/docs/self-hosting/#quick-start",
      install: "/docs/self-hosting/#run-your-own-deployment",
      importGuide: "/docs/self-hosting/#import-grafana-dashboards",
      mcp: "/docs/self-hosting/#mcp",
      selfHost: "/docs/self-hosting/",
      reference: null,
      roles: "/docs/self-hosting/#roles",
      folders: "/docs/self-hosting/#folders-and-access",
      oidc: "/docs/self-hosting/#sign-in-with-oidc",
      llm: "/docs/self-hosting/#llm-providers",
      cli: "/docs/self-hosting/#cli",
      datasources: "/docs/self-hosting/#datasources-file",
    })
  })

  test("prefers the split pages once they exist", () => {
    expect(resolveDocLinks(afterSplit)).toEqual({
      quickStart: "/docs/get-started/quick-start/",
      install: "/docs/get-started/install/",
      importGuide: "/docs/use/import-from-grafana/",
      mcp: "/docs/use/mcp/",
      selfHost: "/docs/self-hosting/",
      reference: "/docs/reference/",
      roles: "/docs/teams/roles/",
      folders: "/docs/teams/folders/",
      oidc: "/docs/connect/oidc/",
      llm: "/docs/connect/llm-providers/",
      cli: "/docs/use/cli/",
      datasources: "/docs/connect/prometheus/",
    })
  })

  test("returns null for every key when no docs exist", () => {
    const values = Object.values(resolveDocLinks(new Set()))
    expect(values).toHaveLength(Object.keys(DOC_LINK_CANDIDATES).length)
    expect(values.every((value) => value === null)).toBe(true)
  })

  test("ignores ids that only share a prefix with a candidate", () => {
    expect(resolveDocLinks(new Set(["docs/self-hosting-extra"])).selfHost).toBeNull()
  })
})

describe("headerNav", () => {
  test("lists Docs and Self-host for today's docs", () => {
    expect(headerNav(resolveDocLinks(today))).toEqual([
      { label: "Docs", href: "/docs/self-hosting/#quick-start" },
      { label: "Self-host", href: "/docs/self-hosting/" },
    ])
  })

  test("points Docs at the quick start page after the split", () => {
    expect(headerNav(resolveDocLinks(afterSplit))[0]).toEqual({
      label: "Docs",
      href: "/docs/get-started/quick-start/",
    })
  })

  test("is empty when no docs exist", () => {
    expect(headerNav(resolveDocLinks(new Set()))).toEqual([])
  })
})

describe("footerColumns", () => {
  test("omits Reference while it does not exist", () => {
    const columns = footerColumns(resolveDocLinks(today))
    expect(columns.map((column) => column.title)).toEqual(["Product", "Docs", "Project"])
    expect(columns[1].items.map((item) => item.label)).toEqual(["Quick start", "Install"])
  })

  test("includes Reference once it exists", () => {
    const docs = footerColumns(resolveDocLinks(afterSplit)).find((column) => column.title === "Docs")
    expect(docs?.items.map((item) => item.label)).toEqual(["Quick start", "Install", "Reference"])
  })

  test("keeps only the project column when no docs exist", () => {
    expect(footerColumns(resolveDocLinks(new Set()))).toEqual([
      {
        title: "Project",
        items: [
          { label: "GitHub", href: "https://github.com/slashobserve/slashobserve" },
          { label: "Changelog", href: "https://github.com/slashobserve/slashobserve/releases" },
          { label: "License", href: "https://github.com/slashobserve/slashobserve/blob/main/LICENSE" },
        ],
      },
    ])
  })
})
