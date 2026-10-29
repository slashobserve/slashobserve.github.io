import { describe, expect, test } from "bun:test"
import { resolveDocLinks } from "./doc-links"
import { featureGroups } from "./features"

const today = resolveDocLinks(new Set(["docs/self-hosting"]))
const noDocs = resolveDocLinks(new Set())

function findItem(groups: ReturnType<typeof featureGroups>, title: string) {
  return groups.flatMap((group) => group.items).find((item) => item.title === title)
}

describe("featureGroups", () => {
  test("links an item to the docs section that covers it and leaves the others plain", () => {
    const groups = featureGroups(today, 21)
    expect(findItem(groups, "Roles")?.href).toBe("/docs/self-hosting/#roles")
    expect(findItem(groups, "Folders")?.href).toBe("/docs/self-hosting/#folders-and-access")
    expect(findItem(groups, "Queries checked before saving")?.href).toBeNull()
    expect(findItem(groups, "Share links")?.href).toBeNull()
  })

  test("has no links when no docs exist", () => {
    const hrefs = featureGroups(noDocs, 21).flatMap((group) => group.items.map((item) => item.href))
    expect(hrefs.length).toBeGreaterThan(0)
    expect(hrefs.every((href) => href === null)).toBe(true)
  })

  test("fills the panel type count and leaves no placeholder in a title", () => {
    const titles = featureGroups(today, 21).flatMap((group) => group.items.map((item) => item.title))
    expect(titles).toContain("21 panel types")
    expect(titles.some((title) => title.includes("{"))).toBe(false)
  })

  test("orders the groups as the Features page shows them", () => {
    expect(featureGroups(today, 21).map((group) => group.title)).toEqual([
      "Build dashboards",
      "Review and edit",
      "Teams",
      "Bring Grafana dashboards",
      "Connect",
      "Run it yourself",
    ])
  })

  test("keeps the code word inside the title it decorates", () => {
    const items = featureGroups(today, 21).flatMap((group) => group.items)
    const withCode = items.filter((item) => item.code !== null)
    expect(withCode.map((item) => item.code)).toEqual(["observe"])
    expect(withCode.every((item) => item.title.includes(item.code as string))).toBe(true)
  })
})
