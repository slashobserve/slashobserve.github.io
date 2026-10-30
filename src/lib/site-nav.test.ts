import { describe, expect, test } from "bun:test"
import { resolveDocLinks } from "./doc-links"
import { PRODUCT_LINKS, docsHomeHref, footerColumns, getStartedHref, headerNav, isCurrentPage } from "./site-nav"

const withoutReference = new Set(["docs/get-started/quick-start", "docs/get-started/install"])
const withReference = new Set([...withoutReference, "docs/reference/configuration"])

const features = { label: "Features", href: "/features/" }
const grafana = { label: "Coming from Grafana", href: "/grafana/" }

describe("PRODUCT_LINKS", () => {
  test("lists Features then Coming from Grafana", () => {
    expect(PRODUCT_LINKS).toEqual([features, grafana])
  })
})

describe("headerNav", () => {
  test("lists Features, Coming from Grafana, Docs and Self-host", () => {
    expect(headerNav(resolveDocLinks(withReference))).toEqual([
      features,
      grafana,
      { label: "Docs", href: "/docs/" },
      { label: "Self-host", href: "/docs/get-started/install/" },
    ])
  })

  test("keeps only Features and Coming from Grafana when no docs exist", () => {
    expect(headerNav(resolveDocLinks(new Set()))).toEqual([features, grafana])
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
  test("lists Features, Coming from Grafana and Self-host in the Product column", () => {
    const product = footerColumns(resolveDocLinks(withReference)).find((column) => column.title === "Product")
    expect(product?.items).toEqual([features, grafana, { label: "Self-host", href: "/docs/get-started/install/" }])
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
