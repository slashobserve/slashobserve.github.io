import { describe, expect, test } from "bun:test"
import { resolveDocLinks } from "./doc-links"
import { PRODUCT_LINKS, docsHomeHref, footerColumns, getStartedHref, headerNav, isCurrentPage } from "./site-nav"

const withoutReference = new Set(["docs/get-started/quick-start", "docs/get-started/install"])
const withReference = new Set([...withoutReference, "docs/reference/configuration"])

const build = { label: "Build", href: "/build/" }
const grafana = { label: "Coming from Grafana", href: "/grafana/" }
const signals = { label: "Signals", href: "/signals/" }
const selfHost = { label: "Self-host", href: "/docs/get-started/install/" }

describe("PRODUCT_LINKS", () => {
  test("lists Build, Coming from Grafana and Signals", () => {
    expect(PRODUCT_LINKS).toEqual([build, grafana, signals])
  })
})

describe("headerNav", () => {
  test("lists the product pages then Docs, without Self-host", () => {
    expect(headerNav(resolveDocLinks(withReference))).toEqual([build, grafana, signals, { label: "Docs", href: "/docs/" }])
  })

  test("keeps only the product pages when no docs exist", () => {
    expect(headerNav(resolveDocLinks(new Set()))).toEqual([build, grafana, signals])
  })
})

describe("getStartedHref", () => {
  test("points at the quick start", () => {
    expect(getStartedHref(resolveDocLinks(withReference))).toBe("/docs/get-started/quick-start/")
  })

  test("points at the install page when there is no quick start", () => {
    expect(getStartedHref(resolveDocLinks(new Set(["docs/get-started/install"])))).toBe("/docs/get-started/install/")
  })

  test("is null when there is neither", () => {
    expect(getStartedHref(resolveDocLinks(new Set()))).toBeNull()
  })
})

describe("docsHomeHref", () => {
  test("points at the docs overview when docs exist", () => {
    expect(docsHomeHref(resolveDocLinks(withReference))).toBe("/docs/")
    expect(docsHomeHref(resolveDocLinks(new Set(["docs/get-started/install"])))).toBe("/docs/")
  })

  test("is null when no docs exist", () => {
    expect(docsHomeHref(resolveDocLinks(new Set()))).toBeNull()
  })
})

describe("footerColumns", () => {
  test("lists the product pages and Self-host in the Product column", () => {
    const product = footerColumns(resolveDocLinks(withReference)).find((column) => column.title === "Product")
    expect(product?.items).toEqual([build, grafana, signals, selfHost])
  })

  test("omits Reference while it does not exist", () => {
    const columns = footerColumns(resolveDocLinks(withoutReference))
    expect(columns.map((column) => column.title)).toEqual(["Product", "Docs", "Project"])
    expect(columns[1].items.map((item) => item.label)).toEqual(["Overview", "Quick start", "Install"])
  })

  test("includes Reference once it exists", () => {
    const docs = footerColumns(resolveDocLinks(withReference)).find((column) => column.title === "Docs")
    expect(docs?.items.map((item) => item.label)).toEqual(["Overview", "Quick start", "Install", "Reference"])
  })

  test("keeps the product pages and the project column when no docs exist", () => {
    expect(footerColumns(resolveDocLinks(new Set()))).toEqual([
      { title: "Product", items: [build, grafana, signals] },
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
    ["/build/", "/", false],
    ["/build/", "/build", false],
  ])("href %s on path %s is %p", (href, pathname, expected) => {
    expect(isCurrentPage(href, pathname)).toBe(expected)
  })
})
