import { describe, expect, test } from "bun:test"
import { docCard } from "./doc-cards"

describe("docCard", () => {
  test("maps a core docs page to its slug, image, section and title", () => {
    expect(docCard("/docs/get-started/quick-start/", "Quick start")).toEqual({
      slug: "get-started/quick-start",
      image: "/og/docs/get-started/quick-start.png",
      section: "Docs · Get started",
      title: "Quick start",
    })
  })

  test("keeps nested reference pages under their full slug", () => {
    const card = docCard("/docs/reference/observespec/panels/timeseries/", "timeseries")
    expect(card.slug).toBe("reference/observespec/panels/timeseries")
    expect(card.section).toBe("Docs · Reference")
  })

  test("gives the docs landing page the index slug and a bare Docs section", () => {
    expect(docCard("/docs/", "Documentation")).toEqual({
      slug: "index",
      image: "/og/docs/index.png",
      section: "Docs",
      title: "Documentation",
    })
  })

  test("accepts a pathname without a trailing slash", () => {
    expect(docCard("/docs/connect/oidc", "OIDC").slug).toBe("connect/oidc")
  })

  test("uses a bare Docs section for an unknown section", () => {
    expect(docCard("/docs/zzz/page/", "Page").section).toBe("Docs")
  })
})
