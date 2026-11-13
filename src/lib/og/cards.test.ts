import { describe, expect, test } from "bun:test"
import { PRODUCT_LINKS } from "../site-nav"
import { SOCIAL_CARDS, cardFor, cardImagePath } from "./cards"

describe("cardFor", () => {
  test.each([
    ["/", "home"],
    ["/observations/", "observations"],
    ["/dashboards/", "dashboards"],
    ["/agents/", "agents"],
    ["/agents", "agents"],
    ["/migrate/", "migrate"],
    ["/migrate", "migrate"],
    ["/signals/", "signals"],
    ["/docs/", "docs"],
  ])("finds the card for %s", (pathname, id) => {
    expect(cardFor(pathname)?.id).toBe(id)
  })

  test.each(["/build/", "/features/", "/404.html", "/docs/self-hosting/", "/migrate/extra/"])("returns null for %s", (pathname) => {
    expect(cardFor(pathname)).toBeNull()
  })
})

describe("cardImagePath", () => {
  test("places the image under /og by card id", () => {
    expect(cardImagePath({ id: "migrate", path: "/migrate/", section: "s", title: "t" })).toBe("/og/migrate.png")
  })
})

describe("SOCIAL_CARDS", () => {
  test("ids are unique slugs", () => {
    const ids = SOCIAL_CARDS.map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  test("paths start and end with a slash and are unique", () => {
    const paths = SOCIAL_CARDS.map((card) => card.path)
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) {
      expect(path.startsWith("/")).toBe(true)
      expect(path.endsWith("/")).toBe(true)
    }
  })

  test("every product page in the nav has a card", () => {
    for (const { href } of PRODUCT_LINKS) expect(cardFor(href)).not.toBeNull()
  })

  test("titles fit three lines at 76px", () => {
    for (const card of SOCIAL_CARDS) expect(card.title.length).toBeLessThanOrEqual(64)
  })
})
