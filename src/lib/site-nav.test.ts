import { describe, expect, test } from "bun:test"
import { resolveDocLinks } from "./doc-links"
import { PRODUCT_LINKS, footerColumns, headerNav, isCurrentPage } from "./site-nav"

const today = new Set(["docs/self-hosting"])
const afterSplit = new Set([
  "docs/self-hosting",
  "docs/get-started/quick-start",
  "docs/get-started/install",
  "docs/reference",
])

const features = { label: "Features", href: "/features/" }
const grafana = { label: "Coming from Grafana", href: "/grafana/" }

describe("PRODUCT_LINKS", () => {
  test("lists Features then Coming from Grafana", () => {
    expect(PRODUCT_LINKS).toEqual([features, grafana])
  })
})

describe("headerNav", () => {
  test("lists Features, Coming from Grafana, Docs and Self-host for today's docs", () => {
    expect(headerNav(resolveDocLinks(today))).toEqual([
      features,
      grafana,
      { label: "Docs", href: "/docs/self-hosting/#quick-start" },
      { label: "Self-host", href: "/docs/self-hosting/" },
    ])
  })

  test("points Docs at the quick start page after the split", () => {
    expect(headerNav(resolveDocLinks(afterSplit))[2]).toEqual({
      label: "Docs",
      href: "/docs/get-started/quick-start/",
    })
  })

  test("keeps only Features and Coming from Grafana when no docs exist", () => {
    expect(headerNav(resolveDocLinks(new Set()))).toEqual([features, grafana])
  })
})

describe("footerColumns", () => {
  test("lists Features, Coming from Grafana and Self-host in the Product column", () => {
    const product = footerColumns(resolveDocLinks(today)).find((column) => column.title === "Product")
    expect(product?.items).toEqual([features, grafana, { label: "Self-host", href: "/docs/self-hosting/" }])
  })

  test("omits Reference while it does not exist", () => {
    const columns = footerColumns(resolveDocLinks(today))
    expect(columns.map((column) => column.title)).toEqual(["Product", "Docs", "Project"])
    expect(columns[1].items.map((item) => item.label)).toEqual(["Quick start", "Install"])
  })

  test("includes Reference once it exists", () => {
    const docs = footerColumns(resolveDocLinks(afterSplit)).find((column) => column.title === "Docs")
    expect(docs?.items.map((item) => item.label)).toEqual(["Quick start", "Install", "Reference"])
  })

  test("keeps the product pages and the project column when no docs exist", () => {
    expect(footerColumns(resolveDocLinks(new Set()))).toEqual([
      { title: "Product", items: [features, grafana] },
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

describe("isCurrentPage", () => {
  test.each([
    ["/grafana/", "/grafana/", true],
    ["/docs/self-hosting/#quick-start", "/docs/self-hosting/", false],
    ["/docs/self-hosting/#quick-start", "/docs/self-hosting/#quick-start", false],
    ["/features/", "/", false],
    ["/features/", "/features", false],
  ])("href %s on path %s is %p", (href, pathname, expected) => {
    expect(isCurrentPage(href, pathname)).toBe(expected)
  })
})
