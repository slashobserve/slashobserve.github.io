import { describe, expect, test } from "bun:test"
import { nextTheme, parseTheme, resolveTheme, THEME_STORAGE_KEY } from "./theme"

describe("parseTheme", () => {
  test.each([
    ["dark", "dark"],
    ["light", "light"],
    ["auto", null],
    [null, null],
    [undefined, null],
  ])("parses %p as %p", (value, expected) => {
    expect(parseTheme(value)).toBe(expected as ReturnType<typeof parseTheme>)
  })
})

describe("resolveTheme", () => {
  test("keeps a stored light theme when the system prefers dark", () => {
    expect(resolveTheme("light", false)).toBe("light")
  })

  test("keeps a stored dark theme when the system prefers light", () => {
    expect(resolveTheme("dark", true)).toBe("dark")
  })

  test("follows the system when the stored value is garbage", () => {
    expect(resolveTheme("sepia", true)).toBe("light")
    expect(resolveTheme("sepia", false)).toBe("dark")
  })

  test("follows the system when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("light")
    expect(resolveTheme(null, false)).toBe("dark")
  })
})

describe("nextTheme", () => {
  test("flips the theme both ways", () => {
    expect(nextTheme("light")).toBe("dark")
    expect(nextTheme("dark")).toBe("light")
  })
})

describe("THEME_STORAGE_KEY", () => {
  test("is the shared key for docs and marketing", () => {
    expect(THEME_STORAGE_KEY).toBe("slashobserve-theme")
  })
})
