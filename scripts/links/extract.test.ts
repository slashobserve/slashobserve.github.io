import { describe, expect, test } from "bun:test"
import { scanHtml } from "./extract"

describe("scanHtml links", () => {
  test("reads double-quoted, single-quoted and unquoted values", () => {
    const html = `<a href="/a/">x</a><a href='/b/'>y</a><a href=/c/>z</a>`
    expect(scanHtml(html).links).toEqual(["/a/", "/b/", "/c/"])
  })

  test("decodes entities in values", () => {
    const html = `<a href="/x/?a=1&amp;b=2">x</a><a href="/q&quot;r">y</a><a href="/it&#39;s">z</a><a href="&#x2F;docs&#x2F;">w</a>`
    expect(scanHtml(html).links).toEqual(["/x/?a=1&b=2", '/q"r', "/it's", "/docs/"])
  })

  test("ignores anchors without href", () => {
    expect(scanHtml(`<a name="top">t</a><a>plain</a><a href="/ok/">ok</a>`).links).toEqual(["/ok/"])
  })

  test("collects href on link and src on script, img and source in document order", () => {
    const html = [
      `<link rel="sitemap" href="/sitemap-index.xml">`,
      `<script type="module" src="/_astro/app.js"></script>`,
      `<img src="/logo.svg" alt="">`,
      `<picture><source src="/pic.webp"></picture>`,
      `<a href="/docs/">docs</a>`,
    ].join("")
    expect(scanHtml(html).links).toEqual([
      "/sitemap-index.xml",
      "/_astro/app.js",
      "/logo.svg",
      "/pic.webp",
      "/docs/",
    ])
  })

  test("does not treat href on other tags or inside script bodies and comments as links", () => {
    const html = `<div href="/no/"></div><script>const s = '<a href="/no-script/">'</script><!-- <a href="/no-comment/"> --><a href="/yes/">y</a>`
    expect(scanHtml(html).links).toEqual(["/yes/"])
  })

  test("keeps a greater-than sign inside a quoted value", () => {
    expect(scanHtml(`<a href="/a>b/" class="x">t</a>`).links).toEqual(["/a>b/"])
  })
})

describe("scanHtml ids", () => {
  test("collects id on any tag and name on anchors", () => {
    const html = `<h2 id="quick-start">Q</h2><a name="legacy"></a><div id='two'></div><input name="field">`
    expect([...scanHtml(html).ids].sort()).toEqual(["legacy", "quick-start", "two"])
  })

  test("returns empty results for empty html", () => {
    const scan = scanHtml("")
    expect(scan.links).toEqual([])
    expect(scan.ids.size).toBe(0)
  })
})
