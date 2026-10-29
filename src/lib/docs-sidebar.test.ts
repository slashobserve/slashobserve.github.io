import { describe, expect, test } from "bun:test"
import { buildSidebar, sectionLabel } from "./docs-sidebar"

const slugs = (dir: string, pages: string[]) => pages.map((page) => ({ slug: `docs/${dir}/${page}` }))

describe("buildSidebar", () => {
  test("lists the single self-hosting page as a slug", () => {
    expect(buildSidebar(["self-hosting"], {})).toEqual([{ slug: "docs/self-hosting" }])
  })

  test("is empty when nothing is synced", () => {
    expect(buildSidebar([], {})).toEqual([])
  })

  test("skips the index page", () => {
    expect(buildSidebar(["index", "self-hosting"], {})).toEqual([{ slug: "docs/self-hosting" }])
  })

  test("puts sections in canvas order and root pages last", () => {
    const scrambled = Object.fromEntries(
      ["project", "use", "reference", "get-started", "operate", "connect", "concepts", "teams"].map(
        (dir) => [dir, ["page"]],
      ),
    )
    expect(buildSidebar(["self-hosting"], scrambled)).toEqual([
      { label: "Get started", items: slugs("get-started", ["page"]) },
      { label: "Connect", items: slugs("connect", ["page"]) },
      { label: "Use", items: slugs("use", ["page"]) },
      { label: "Teams", items: slugs("teams", ["page"]) },
      { label: "Concepts", items: slugs("concepts", ["page"]) },
      { label: "Operate", items: slugs("operate", ["page"]) },
      { label: "Reference", items: slugs("reference", ["page"]) },
      { label: "Project", items: slugs("project", ["page"]) },
      { slug: "docs/self-hosting" },
    ])
  })

  test("appends unknown directories after the known ones, sorted, in sentence case", () => {
    expect(buildSidebar([], { "how-to": ["a"], use: ["cli"], faq: ["b"] })).toEqual([
      { label: "Use", items: slugs("use", ["cli"]) },
      { label: "Faq", items: slugs("faq", ["b"]) },
      { label: "How to", items: slugs("how-to", ["a"]) },
    ])
  })

  test.each([
    [
      "get-started",
      ["first-dashboard", "install", "quick-start", "what-is-slashobserve"],
      ["what-is-slashobserve", "quick-start", "install", "first-dashboard"],
    ],
    [
      "connect",
      ["oidc", "llm-providers", "clickhouse", "prometheus"],
      ["prometheus", "clickhouse", "oidc", "llm-providers"],
    ],
    [
      "use",
      ["mcp", "cli", "import-grafana", "edit-panel", "review", "chat"],
      ["chat", "review", "edit-panel", "import-grafana", "cli", "mcp"],
    ],
    [
      "concepts",
      ["zeta", "versions", "datasources-and-variables", "agent", "observespec"],
      ["observespec", "agent", "datasources-and-variables", "versions", "zeta"],
    ],
    ["teams", ["saved-prompts", "folders", "roles"], ["roles", "folders", "saved-prompts"]],
    [
      "operate",
      ["security-model", "logging", "upgrades-and-backups", "service-account-keys", "outbound-access", "production"],
      ["production", "upgrades-and-backups", "security-model", "logging", "outbound-access", "service-account-keys"],
    ],
    ["reference", ["datasources-file", "configuration"], ["configuration", "datasources-file"]],
  ])("orders %s pages by the canvas, then unknown pages alphabetically", (dir, pages, expected) => {
    expect(buildSidebar([], { [dir]: pages })).toEqual([
      { label: expect.any(String), items: slugs(dir, expected) },
    ])
  })

  test("skips ordered pages that are not synced and keeps the rest in order", () => {
    expect(buildSidebar([], { "get-started": ["install", "zeta", "alpha"] })).toEqual([
      { label: "Get started", items: slugs("get-started", ["install", "alpha", "zeta"]) },
    ])
  })

  test("maps a section index page to the section slug", () => {
    expect(buildSidebar([], { reference: ["index", "configuration", "api/index", "api/routes"] })).toEqual([
      {
        label: "Reference",
        items: [
          { slug: "docs/reference/configuration" },
          { slug: "docs/reference/api" },
          { slug: "docs/reference/api/routes" },
          { slug: "docs/reference" },
        ],
      },
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
