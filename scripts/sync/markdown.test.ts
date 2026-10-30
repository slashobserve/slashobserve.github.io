import { describe, expect, test } from "bun:test"
import { rewriteLinks, transformPage } from "./markdown"

describe("rewriteLinks", () => {
  test.each([
    ["see [x](#anchor)", "get-started/quick-start.md", "see [x](#anchor)"],
    ["see [x](https://x)", "get-started/quick-start.md", "see [x](https://x)"],
    ["see [x](mailto:a@b.c)", "get-started/quick-start.md", "see [x](mailto:a@b.c)"],
    ["see [x](/docs/other/)", "get-started/quick-start.md", "see [x](/docs/other/)"],
    ["see [x]()", "get-started/quick-start.md", "see [x]()"],
    [
      "see [x](../connect/prometheus.md#tls)",
      "get-started/quick-start.md",
      "see [x](/docs/connect/prometheus/#tls)",
    ],
    [
      "see [x](prometheus.md)",
      "connect/clickhouse.md",
      "see [x](/docs/connect/prometheus/)",
    ],
    [
      'see [x](prometheus.md "Prom")',
      "connect/clickhouse.md",
      'see [x](/docs/connect/prometheus/ "Prom")',
    ],
    [
      "see [x](connect/index.md)",
      "self-hosting.md",
      "see [x](/docs/connect/)",
    ],
    [
      "see [x](../../deploy/compose/compose.yaml)",
      "connect/prometheus.md",
      "see [x](https://github.com/slashobserve/slashobserve/blob/main/deploy/compose/compose.yaml)",
    ],
    [
      "see [x](../../deploy/README.md#run)",
      "connect/prometheus.md",
      "see [x](https://github.com/slashobserve/slashobserve/blob/main/deploy/README.md#run)",
    ],
    ["![flow](img/flow.png)", "get-started/quick-start.md", "![flow](img/flow.png)"],
    ["[a](x.md) and [b](y.md)", "connect/z.md", "[a](/docs/connect/x/) and [b](/docs/connect/y/)"],
    ["[p]: ../connect/prometheus.md", "get-started/a.md", "[p]: /docs/connect/prometheus/"],
    [
      "[p]: ../connect/prometheus.md#tls \"T\"",
      "get-started/a.md",
      "[p]: /docs/connect/prometheus/#tls \"T\"",
    ],
  ])("%s from %s", (source, rel, expected) => {
    expect(rewriteLinks(source, rel)).toBe(expected)
  })

  test("throws for a link that escapes the core repo", () => {
    expect(() => rewriteLinks("[x](../../../x.md)", "connect/a.md")).toThrow(
      "connect/a.md: link ../../../x.md points outside the core repo",
    )
  })

  test("leaves links inside fenced blocks unchanged", () => {
    const source = "```md\n[x](../connect/prometheus.md)\n```\n~~~~\n[y](a.md)\n~~~\n[z](a.md)\n~~~~\n[w](a.md)"
    expect(rewriteLinks(source, "get-started/q.md")).toBe(
      "```md\n[x](../connect/prometheus.md)\n```\n~~~~\n[y](a.md)\n~~~\n[z](a.md)\n~~~~\n[w](/docs/get-started/a/)",
    )
  })

  test("leaves links inside inline code spans unchanged and rewrites the rest of the line", () => {
    expect(rewriteLinks("`[x](a.md)` then [y](a.md) and ``[z](b.md)``", "connect/c.md")).toBe(
      "`[x](a.md)` then [y](/docs/connect/a/) and ``[z](b.md)``",
    )
  })

  test("does not rewrite front matter", () => {
    const source = "---\ndescription: see [x](a.md)\n---\n[x](a.md)"
    expect(rewriteLinks(source, "connect/c.md")).toBe(
      "---\ndescription: see [x](a.md)\n---\n[x](/docs/connect/a/)",
    )
  })
})

describe("transformPage", () => {
  const FRONT = '---\ntitle: "Quick start"\ndescription: Run it\n---\n'

  test("rewrites links and keeps the front matter", () => {
    const source = `${FRONT}\nNext: [Prometheus](../connect/prometheus.md#tls)\n`
    expect(transformPage(source, "get-started/quick-start.md", null)).toBe(
      `${FRONT}\nNext: [Prometheus](/docs/connect/prometheus/#tls)\n`,
    )
  })

  test("appends lastUpdated as the last front matter line", () => {
    expect(transformPage(`${FRONT}\nText\n`, "a.md", "2026-10-30T04:30:00+00:00")).toBe(
      '---\ntitle: "Quick start"\ndescription: Run it\nlastUpdated: 2026-10-30T04:30:00+00:00\n---\n\nText\n',
    )
  })

  test("adds no lastUpdated line without a date", () => {
    expect(transformPage(`${FRONT}\nText\n`, "a.md", null)).not.toContain("lastUpdated")
  })

  test.each([
    ["no front matter", "Text\n"],
    ["a missing description", "---\ntitle: T\n---\nText\n"],
    ["a missing title", "---\ndescription: D\n---\nText\n"],
  ])("throws naming the file for %s", (_, source) => {
    expect(() => transformPage(source, "connect/a.md", null)).toThrow(
      "connect/a.md: front matter must set title and description",
    )
  })

  test("throws for a body heading", () => {
    expect(() => transformPage(`${FRONT}\n# Again\n`, "connect/a.md", null)).toThrow(
      "connect/a.md: remove the # heading; the title comes from front matter",
    )
  })

  test("allows a # comment inside a fenced block", () => {
    const source = `${FRONT}\n\`\`\`sh\n# comment\n\`\`\`\n`
    expect(transformPage(source, "a.md", null)).toBe(source)
  })
})
