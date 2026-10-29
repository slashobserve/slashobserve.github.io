import { describe, expect, test } from "bun:test"
import { buildSidebar, sectionLabel } from "./docs-sidebar"

describe("buildSidebar", () => {
  test("lists the single self-hosting page as a slug", () => {
    expect(buildSidebar(["self-hosting"], [])).toEqual([{ slug: "docs/self-hosting" }])
  })

  test("is empty when nothing is synced", () => {
    expect(buildSidebar([], [])).toEqual([])
  })

  test("skips the index page", () => {
    expect(buildSidebar(["index", "self-hosting"], [])).toEqual([{ slug: "docs/self-hosting" }])
  })

  test("puts root pages first and sections in canvas order after the split", () => {
    const scrambled = [
      "project",
      "use",
      "reference",
      "get-started",
      "operate",
      "connect",
      "concepts",
      "teams",
    ]
    expect(buildSidebar(["self-hosting"], scrambled)).toEqual([
      { slug: "docs/self-hosting" },
      { label: "Get started", items: [{ autogenerate: { directory: "docs/get-started" } }] },
      { label: "Connect", items: [{ autogenerate: { directory: "docs/connect" } }] },
      { label: "Use", items: [{ autogenerate: { directory: "docs/use" } }] },
      { label: "Teams", items: [{ autogenerate: { directory: "docs/teams" } }] },
      { label: "Concepts", items: [{ autogenerate: { directory: "docs/concepts" } }] },
      { label: "Operate", items: [{ autogenerate: { directory: "docs/operate" } }] },
      { label: "Reference", items: [{ autogenerate: { directory: "docs/reference" } }] },
      { label: "Project", items: [{ autogenerate: { directory: "docs/project" } }] },
    ])
  })

  test("appends unknown directories after the known ones, sorted, in sentence case", () => {
    expect(buildSidebar([], ["how-to", "use", "faq"])).toEqual([
      { label: "Use", items: [{ autogenerate: { directory: "docs/use" } }] },
      { label: "Faq", items: [{ autogenerate: { directory: "docs/faq" } }] },
      { label: "How to", items: [{ autogenerate: { directory: "docs/how-to" } }] },
    ])
  })
})

describe("sectionLabel", () => {
  test.each([
    ["docs/connect/prometheus", "Connect"],
    ["docs/get-started/quick-start", "Get started"],
    ["docs/self-hosting", "Docs"],
    ["docs/how-to/migrate", "How to"],
  ])("labels %s as %s", (entryId, label) => {
    expect(sectionLabel(entryId)).toBe(label)
  })
})
